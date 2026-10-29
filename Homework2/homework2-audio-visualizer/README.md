# FIFO Audio Visualizer — Homework 2

Lab 02, Homework 2 (Web Application Development 2026, UIT). Hàng đợi FIFO tải và giải mã audio an toàn khi có nhiều yêu cầu cùng lúc,
phát bằng Web Audio API và hiển thị phổ tần số trên Canvas 2D với `requestAnimationFrame`.

- Một worker FIFO duy nhất; hủy bằng `AbortController` ở mọi giai đoạn (chờ, tải, giải mã).
- `AnalyserNode` với FFT 256 (128 cột) hoặc 512 (256 cột).
- Không dùng thư viện audio, queue hay visualizer bên ngoài; chỉ React + TypeScript + Vite.

## Cài đặt và chạy

Cần Node 22 hoặc 24 trở lên.

```powershell
npm install
npm run dev          # http://localhost:5173
```

## Kiểm tra

```powershell
npx tsc -b --noEmit  # kiểm tra kiểu
npm run lint
npm run test         # 62 test (Vitest + jsdom, Web Audio được giả lập)
npm run build        # bản production vào dist/
npx vite preview     # chạy thử bản production
```

## Cách dùng

1. Bấm **Thêm cùng lúc 3 bài demo** để gửi 3 yêu cầu một lúc. Ô **Hàng đợi** cho thấy chỉ một bài được xử lý tại một thời điểm.
2. Bấm **Hủy** ở một bài đang chờ hoặc đang tải.
3. Bấm **Phát** ở một bài trong **Sẵn sàng phát**. Đổi **FFT size** để xem 128 hoặc 256 cột.
4. Thử các URL lỗi trong ô gợi ý: `/audio/broken.wav` (file hỏng) và `/audio/missing.wav` (không tồn tại).
   Có thể nhập URL `http(s)` khác, nhưng server đó phải cho phép CORS.

File demo trong `public/audio/` được sinh bằng `node scripts/generate-demo-audio.mjs` (sóng tổng hợp, không có bản quyền).

## Cấu trúc

```text
src/
  types/        contract: AudioTask, QueueItem, AudioTaskError, FftSize, PlaybackState
  queue/        AudioTaskQueue: FIFO, 1 worker, hủy, dispose
  audio/        fetchAudio, decodeAudio, AudioEngine (AudioContext, source, analyser)
  visualizer/   CanvasVisualizer: vẽ cột, vòng rAF, ResizeObserver
  hooks/        useAudioController: nối các module trên vào React
  test/         giả lập Web Audio, Canvas, rAF cho jsdom
  App.tsx       giao diện
docs/
  ARCHITECTURE.md        trách nhiệm module, sở hữu tài nguyên, luồng hủy
  MEMORY_AUDIT.md        đo rò rỉ bộ nhớ trong Chrome
  PERFORMANCE_AUDIT.md   đo FPS với FFT 256/512
  ORAL_DEFENSE.md        chuẩn bị vấn đáp
  FINAL_VERIFICATION.md  kết quả kiểm tra cuối
  evidence/              Lighthouse, ảnh chụp, số liệu đo gốc
scripts/
  generate-demo-audio.mjs   sinh file WAV demo
  browser-audit.cjs         đo bộ nhớ/FPS bằng Chrome (cần cài tạm puppeteer-core)
  heap-diff.cjs             so sánh 2 heap snapshot
```

Audit lỗi AI nằm ở `../AI_FAILURE_AUDIT.md`.
