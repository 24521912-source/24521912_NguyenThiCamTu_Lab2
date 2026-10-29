# Chuẩn bị vấn đáp — Homework 2

Mỗi phần gồm: **ý chính** (nói trong khoảng 30 giây), **chỉ vào code ở đâu**, và **câu hỏi có thể gặp**.

---

## 1. FIFO và một worker duy nhất

**Ý chính.** `AudioTaskQueue` giữ một mảng `queue`. `enqueue()` dùng `push` để thêm vào cuối, worker dùng `shift()` để lấy từ đầu, vì vậy vào trước thì ra trước.
Cờ `isProcessing` bảo đảm chỉ có một worker: mỗi lần `enqueue()` đều gọi `processNext()`, nhưng nếu đang có task chạy thì lời gọi đó `return` ngay.
Khi task xong, khối `finally` trả cờ về `false` rồi gọi `processNext()` để lấy task kế tiếp.

**Code:** `src/queue/AudioTaskQueue.ts` → `processNext()`.

**Câu hỏi có thể gặp**
- *Tại sao không tải 3 bài song song cho nhanh?* Đề yêu cầu FIFO và an toàn khi có nhiều yêu cầu cùng lúc. Một worker giúp thứ tự hoàn thành luôn đúng thứ tự gửi, và mỗi lúc chỉ giữ một bộ dữ liệu đang giải mã trong bộ nhớ.
- *Bỏ `isProcessing` thì sao?* Ba `enqueue()` liền nhau sẽ tạo ba worker chạy song song, và thứ tự hoàn thành sẽ phụ thuộc vào bài nào tải xong trước. Test `nhiều enqueue cùng lúc...` sẽ fail (6 test đỏ khi xoá cờ này).
- *Sửa trực tiếp:* muốn cho 2 worker thì đổi `isProcessing` thành bộ đếm `active < 2`. Khi đó phải sửa test `maxActive` thành 2 và chấp nhận thứ tự hoàn thành không còn đúng FIFO.

## 2. Promise, async/await và event loop

**Ý chính.** `enqueue()` trả về một `Promise`. Hàm `resolve`/`reject` của promise đó được cất vào task, để **worker** settle nó sau, khi task thực sự xong.
`await fetch(...)` không chặn trình duyệt: hàm tạm dừng, trình duyệt tiếp tục vẽ và xử lý click, khi có kết quả thì phần còn lại chạy tiếp như một microtask.

**Câu hỏi có thể gặp:** *Có promise nào bị treo mãi không?* Không. Mọi đường đi (thành công, lỗi, hủy, dispose) đều đi qua `settle()`. Test `C02: dispose` kiểm tra cả các task đang chờ.

## 3. AbortController và hủy tác vụ

**Ý chính.** Mỗi task có một `AbortController` riêng. `cancel(id)` xử lý tùy giai đoạn:

| Giai đoạn | Điều xảy ra |
|---|---|
| Đang chờ | Xoá khỏi mảng, reject `AbortError`, không bao giờ fetch |
| Đang fetch | `controller.abort()`; `fetch` nhận signal nên tự dừng request (thấy "(canceled)" trong tab Network) |
| Đang decode | Reject ngay; worker chờ decode xong rồi **bỏ kết quả** |

**Câu hỏi có thể gặp:** *Tại sao không abort được `decodeAudioData`?* Vì API này không nhận `AbortSignal`, nên không có cách nào dừng nó giữa chừng.
Code chỉ kiểm tra `signal.throwIfAborted()` sau khi decode xong và vứt kết quả đi (xem `docs/ARCHITECTURE.md` §5).

## 4. Race condition

**Ý chính.** Có ba chỗ dễ xảy ra race:
1. **Hủy đúng lúc fetch vừa xong:** kiểm tra `signal.throwIfAborted()` ngay sau `await fetch`. Đây là lỗi AI-02 trong audit.
2. **Hủy và decode xong cùng lúc:** cờ `settled` đảm bảo promise chỉ settle một lần.
3. **Callback `onended` của bài cũ** chạy sau khi đã phát bài mới: `playbackId` tăng mỗi lần `play()`, nên callback cũ thấy `id !== this.playbackId` và bỏ qua.

## 5. Web Audio: AudioContext, source, analyser

**Ý chính.** `AudioEngine` là chủ sở hữu **duy nhất** của `AudioContext`. Context được tạo lazy ở lần đầu cần dùng và được dùng lại cho các lần sau.
Đồ thị âm thanh: `AudioBufferSourceNode → AnalyserNode → destination`. Analyser được nối ra loa **một lần**; mỗi source mới chỉ nối vào analyser, nên âm thanh không bị phát đôi.
`AudioBufferSourceNode` chỉ `start()` được một lần, vì vậy mỗi lần phát đều tạo một node mới.

**Câu hỏi có thể gặp**
- *Autoplay?* Context có thể ở trạng thái `suspended`, nên `resume()` được gọi trong `play()`, tức là ngay sau khi người dùng bấm nút.
- *Dừng bài thì dọn gì?* `onended = null`, `stop()` (bọc trong `try` vì node đã dừng rồi sẽ ném `InvalidStateError`), rồi `disconnect()`.

## 6. FFT 256 / 512 và frequency bins

**Ý chính.** `frequencyBinCount = fftSize / 2`, nên FFT 256 cho 128 cột và FFT 512 cho 256 cột.
Mỗi bin ứng với một dải `sampleRate / fftSize` Hz. Ví dụ với 48 kHz và FFT 256, mỗi bin rộng khoảng 187.5 Hz.
FFT lớn hơn cho độ phân giải tần số mịn hơn nhưng phản ứng chậm hơn theo thời gian.

**Demo:** đổi FFT trong lúc đang phát, ô "Số cột tần số" đổi từ 128 sang 256 và các cột trên canvas mảnh hơn.

## 7. Canvas và requestAnimationFrame

**Ý chính.** `CanvasVisualizer` chỉ có **một** vòng rAF (`start()` kiểm tra `frameId !== null`). Mỗi frame chạy `getByteFrequencyData()` vào một `Uint8Array` được dùng lại, rồi vẽ cột.
Bộ đệm của canvas có kích thước bằng kích thước CSS nhân `devicePixelRatio`, và được cập nhật bằng `ResizeObserver`.
Kết quả đo thực tế: khoảng 60 FPS, khoảng 0.5 ms mỗi frame (`docs/PERFORMANCE_AUDIT.md`).

**Câu hỏi có thể gặp:** *Tại sao không đưa dữ liệu FFT vào `useState`?* Vì làm vậy React sẽ render lại 60 lần mỗi giây (state thrashing).
Dữ liệu đi thẳng `analyser → Uint8Array → canvas`; React chỉ biết các sự kiện như "đang phát", "đã dừng". Test Profiler chứng minh số lần render không đổi qua 30 frame.

## 8. React lifecycle và cleanup

**Ý chính.** `useAudioController` tạo engine, queue và visualizer **trong `useEffect`**, và cleanup của effect gọi `dispose()` cả ba.
Ở chế độ StrictMode khi dev, React cố ý chạy mount → unmount → mount: bộ thứ nhất bị dọn hoàn toàn, bộ thứ hai được tạo mới. Có test kiểm tra lúc đó chỉ còn **một** context đang mở.
Sau `await`, code kiểm tra `enginesRef.current !== engines` để không cập nhật một UI đã unmount.

## 9. Memory leak

**Ý chính.** Mỗi tài nguyên đều có một chủ sở hữu và một hàm dọn dẹp idempotent (bảng ở `docs/ARCHITECTURE.md` §3).
Đo thực tế với 320 lần phát/dừng và 480 yêu cầu bị hủy: 323/323 source đã được ngắt, DOM nodes và listeners giữ nguyên, heap snapshot so sánh không có object nào tăng (`docs/MEMORY_AUDIT.md`).

---

## Các thao tác demo nên tập

1. **FIFO:** bấm "Thêm cùng lúc 3 bài demo" → trong ô Hàng đợi, chỉ một bài ở trạng thái "Đang tải/Đang giải mã", các bài khác "Đang chờ".
   Bật DevTools → Network → Throttling "Slow 4G" để kịp nhìn thấy.
2. **Hủy:** khi đang Slow 4G, bấm "Hủy" ở một bài đang chờ → trạng thái báo "Đã hủy", Network không có request cho bài đó.
   Hủy bài đang tải → request hiện "(canceled)".
3. **Lỗi không chặn hàng đợi:** thêm `/audio/broken.wav` rồi `/audio/chord.wav` → bài đầu báo lỗi, bài sau vẫn tải bình thường.
4. **FFT:** đổi 256 ↔ 512 khi đang phát.
5. **Dọn dẹp:** DevTools → Performance → Record khi đang phát → bấm Dừng → không còn frame nào của visualizer.

## Câu hỏi "sửa trực tiếp" thường gặp

| Yêu cầu | Sửa ở đâu |
|---|---|
| Thêm FFT 1024 | `FFT_SIZES` và kiểu `FftSize` trong `src/types/audio.ts` (thêm `1024`) |
| Đổi màu cột | `--viz-bar` trong `src/index.css` |
| Giữ 10 bài thay vì 5 | `MAX_TRACKS` trong `src/hooks/useAudioController.ts` |
| Tự phát khi giải mã xong | Trong `enqueue()` của hook, sau `setTracks(...)` gọi `play(track)` |
| Thêm nút "Hủy tất cả" | Thêm `cancelAll()` vào queue: duyệt snapshot rồi gọi `cancel(id)`; thêm nút trong `App.tsx` |
| Vẽ sóng âm (waveform) thay cột | Dùng `getByteTimeDomainData` và vẽ `lineTo` trong `drawFrequencyBars` |
