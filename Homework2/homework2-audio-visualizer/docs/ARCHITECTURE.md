# Architecture — Concurrent FIFO Audio Visualizer

Task A02. Tài liệu này chốt trách nhiệm của từng module và ai sở hữu tài nguyên nào **trước khi** viết code.

## 1. Sơ đồ module

```text
            ┌──────────────────────── React (src/App.tsx) ────────────────────────┐
            │  form URL, nút Play/Stop/Cancel, chọn FFT, vùng trạng thái           │
            │                         │                                            │
            │              useAudioController (src/hooks)                          │
            │     tạo + dọn dẹp engine trong useEffect, chuyển sự kiện → state UI  │
            └───────┬──────────────────────┬──────────────────────────┬────────────┘
                    │ enqueue / cancel     │ play / stop / FFT        │ start / stop
                    ▼                      ▼                          ▼
          AudioTaskQueue           AudioEngine                 CanvasVisualizer
          (src/queue)              (src/audio)                 (src/visualizer)
          FIFO, 1 worker           AudioContext, source,       vòng rAF, vẽ cột,
             │        │            AnalyserNode                ResizeObserver
             ▼        ▼                 ▲  │                         │
        fetchAudio  decodeAudio ────────┘  └── getAnalyser() ◄───────┘
        (fetch +    (decodeAudioData trên AudioContext của engine)
        AbortSignal)
```

Không module engine nào import React. Queue, engine và visualizer chạy được (và test được) mà không cần render.

## 2. Trách nhiệm

| Module | File | Làm gì | Không làm gì |
|---|---|---|---|
| Types | `src/types/queue.ts`, `src/types/audio.ts` | Contract dùng chung | Không có logic |
| Queue | `src/queue/AudioTaskQueue.ts` | Nhận nhiều yêu cầu cùng lúc, xử lý tuần tự FIFO với **1 worker**, settle mọi promise | Không tự tạo AudioContext, không phát nhạc |
| Fetch | `src/audio/fetchAudio.ts` | Kiểm tra URL, `fetch()` với `AbortSignal`, trả `ArrayBuffer` | Không decode |
| Decode | `src/audio/decodeAudio.ts` | `decodeAudioData()` trên context được truyền vào | Không giả vờ hủy được decode |
| Engine | `src/audio/AudioEngine.ts` | Sở hữu `AudioContext`, `AnalyserNode`, `AudioBufferSourceNode` đang phát; play/stop/FFT/dispose | Không vẽ, không xếp hàng |
| Visualizer | `src/visualizer/CanvasVisualizer.ts` | Một vòng `requestAnimationFrame`, đọc analyser, vẽ cột trên Canvas 2D, theo dõi kích thước canvas | Không đưa dữ liệu FFT vào React state |
| React hook | `src/hooks/useAudioController.ts` | Nối 3 module trên, chuyển sự kiện **có ý nghĩa** (hàng đợi đổi, trạng thái phát đổi) thành state | Không đọc FFT từng frame |
| UI | `src/App.tsx` | Form, nút bấm, hiển thị trạng thái | Không gọi Web Audio trực tiếp |

## 3. Sở hữu tài nguyên và dọn dẹp

| Tài nguyên | Chủ sở hữu | Tạo khi | Dọn khi |
|---|---|---|---|
| `AudioContext` | `AudioEngine` (đúng 1 cái) | Lần đầu cần decode/phát (lazy) | `engine.dispose()` → `context.close()` |
| `AnalyserNode` | `AudioEngine` | Cùng lúc tạo context, nối `analyser → destination` **một lần** | `dispose()` → `disconnect()` |
| `AudioBufferSourceNode` | `AudioEngine` | Mỗi lần `play()` tạo **node mới** | `stop()`, kết thúc tự nhiên, hoặc `dispose()` → `onended = null`, `stop()`, `disconnect()` |
| `AbortController` của task | `AudioTaskQueue` | `enqueue()` | Task settle → bỏ tham chiếu |
| Promise của task | `AudioTaskQueue` | `enqueue()` | Luôn settle đúng 1 lần (resolve / reject) |
| Vòng `requestAnimationFrame` | `CanvasVisualizer` (đúng 1 vòng) | `start()` | `stop()` / `dispose()` → `cancelAnimationFrame` |
| `ResizeObserver` | `CanvasVisualizer` | Constructor | `dispose()` → `disconnect()` |
| Bộ đệm `Uint8Array` FFT | `CanvasVisualizer` | Khi số bin thay đổi | Thay bằng bộ đệm mới khi đổi FFT size |
| Toàn bộ engine | `useAudioController` | `useEffect` khi mount | Cleanup của `useEffect` khi unmount |

Mọi hàm dọn dẹp đều **idempotent**: gọi nhiều lần không lỗi.

Engine được tạo trong `useEffect` (không phải trong render), nên React StrictMode mount → unmount → mount sẽ tạo bộ mới và dọn bộ cũ, không bao giờ dùng lại một engine đã dispose.

## 4. Luồng chính

1. Người dùng bấm "Thêm vào hàng đợi" → `queue.enqueue(url)` trả `Promise<AudioBuffer>`.
2. Worker lấy task đầu hàng: `queued → fetching → decoding → (resolve | reject)`.
3. Task xong (thành công hay lỗi) → `finally` trả worker về rảnh → gọi task kế tiếp.
4. Buffer đã decode hiện trong danh sách "Sẵn sàng phát". Bấm Play → `engine.play(buffer)`:
   `AudioBufferSourceNode → AnalyserNode → destination`.
5. Engine báo `playing` → hook gọi `visualizer.start()`. Engine báo `stopped`/`ended` → `visualizer.stop()`.

## 5. Lan truyền hủy tác vụ

| Thời điểm hủy | Điều xảy ra |
|---|---|
| Còn trong hàng (`queued`) | Bị xóa khỏi mảng, promise reject `AbortError`, **không bao giờ fetch** |
| Đang `fetching` | `controller.abort()` → `fetch` nhận signal và dừng request; promise reject `AbortError` ngay |
| Đang `decoding` | `decodeAudioData()` **không hủy được** bằng AbortSignal. Promise reject `AbortError` ngay, worker vẫn chờ decode chạy xong (giữ đúng 1 worker) rồi **bỏ kết quả** |
| Đã xong | Không làm gì (task không còn trong queue) |
| Đang phát | Không phải việc của queue: dùng `engine.stop()` |
| `queue.dispose()` | Hủy tất cả task đang chờ và đang chạy, từ chối `enqueue` mới |

Mỗi task có cờ `settled`, nên dù hủy và kết quả decode đến cùng lúc thì promise vẫn chỉ settle 1 lần.

## 6. Lỗi

- Lỗi của một task chỉ reject promise của task đó. `finally` luôn trả worker về rảnh, nên task sau vẫn chạy.
- Phân loại lỗi (`AudioTaskError.kind`): `invalid-url`, `http` (gồm cả trường hợp server SPA trả 200 + trang HTML cho file không tồn tại), `network` (bao gồm CORS: trình duyệt không cho biết chi tiết), `decode`, `disposed`.
- Hủy dùng `DOMException` tên `AbortError` giống chuẩn của `fetch`, để UI phân biệt "đã hủy" với "lỗi".

## 7. Dữ liệu demo

File WAV tự sinh bằng `scripts/generate-demo-audio.mjs` (sóng sin tổng hợp, không có bản quyền), đặt trong `public/audio/`, phục vụ cùng origin nên không vướng CORS.
`broken.wav` là file hỏng có chủ đích để thử nhánh lỗi decode.
