# AI Failure Audit — Homework 2: Concurrent FIFO Audio Visualizer

Đây là 3 lỗi AI gây ra khi tôi làm Homework 2. Tôi bắt lỗi bằng cách chạy app thật trong Chrome chứ không chỉ tin test,
cố tình sửa sai code xem test có đỏ không, và chạy `tsc` riêng kể cả khi test đã xanh.

---

## AI-01 — File không tồn tại lại bị báo là "file hỏng"

- **Sai ở đâu:** `fetchAudio.ts` chỉ kiểm tra `response.ok`, vì AI giả định file không tồn tại thì server sẽ trả về 404.
  Khi tôi nhập `/audio/missing.wav`, app báo *"Không giải mã được file audio (... file hỏng)"*.
- **Vì sao:** `vite preview` (và cả Vercel) là server SPA, nên với file không có thật nó trả **200 kèm trang `index.html`**.
  Trang HTML đó bị đem đi `decodeAudioData` và tất nhiên thất bại.
- **Bằng chứng:** `curl` cho ra `status=200 type=text/html`. Trong DevTools → Network, request `missing.wav` cũng hiện 200 với kiểu `text/html`.
- **Sửa:** response có `content-type` là `text/html` thì báo *"Máy chủ trả về trang HTML thay vì audio (file có thể không tồn tại)"*. Thêm test cho trường hợp này.

## AI-02 — Test hàng đợi không bảo vệ trường hợp "hủy đúng lúc vừa tải xong"

- **Sai ở đâu:** worker có dòng `signal.throwIfAborted()` ngay sau `await fetchAudio(...)`. Tôi xoá dòng đó thì cả **13 test queue vẫn xanh**.
- **Vì sao:** test chỉ thử hủy khi fetch **đang chạy**. Nếu người dùng bấm Hủy đúng lúc response vừa về,
  worker vẫn mang dữ liệu của task đã hủy đi giải mã, vừa tốn công vừa bắt task sau phải chờ.
- **Sửa:** thêm test *"hủy đúng lúc fetch vừa trả dữ liệu"*. Xoá dòng kiểm tra thì test này **fail** (`1 failed | 13 passed`).

## AI-03 — Test vẫn xanh nhưng `npm run build` bị hỏng

- **Sai ở đâu:** `vitest.config.ts` có dòng `import viteConfig from './vite.config'`. Chạy `vitest` vẫn pass,
  nhưng `tsc` báo `TS2307: Cannot find module './vite.config'`.
- **Vì sao:** `tsconfig.node.json` dùng `"module": "nodenext"`, chế độ bắt buộc import phải có đuôi file. Vitest tự xử lý được nên không báo lỗi.
  Còn `npm run build` chạy `tsc` trước, nên build bị hỏng.
- **Sửa:** đổi thành `'./vite.config.ts'`. Từ đó tôi luôn chạy `tsc` riêng, kể cả khi test đã xanh.

---

| Mã | Lỗi | Phát hiện bằng | Kết quả |
|---|---|---|---|
| AI-01 | File thiếu bị báo là file hỏng | Chạy app trong Chrome, DevTools Network | Đã sửa |
| AI-02 | Test queue thiếu trường hợp hủy | Xoá code, chạy lại test | Đã sửa |
| AI-03 | Thiếu đuôi `.ts`, build hỏng | Chạy `tsc` riêng | Đã sửa |
