# Final Verification — Homework 2

**Ngày:** 29/10/2026  
**Môi trường:** Windows 11, Node v24.14.0, Chrome 156 (headless qua puppeteer-core), Vitest 5.0.5 + jsdom 29, Lighthouse 12.8.2  
**Trạng thái dùng:** `PASS` / `FAIL` / `NOT VERIFIED` / `NOT APPLICABLE`

## 1. Lệnh đã chạy

| Lệnh | Kết quả | Trạng thái |
|---|---|---|
| `npx tsc -b --noEmit` | exit 0 | PASS |
| `npm run lint` | exit 0 | PASS |
| `npm run test` | 6 file, 62 test passed | PASS |
| `npm run build` | thành công (JS 232.02 kB, gzip 72.89 kB) | PASS |
| `npx vite preview` + Chrome | chạy được, không có lỗi console | PASS |

| File test | Số test | Task |
|---|---|---|
| `src/test/infrastructure.test.ts` | 1 | G01 |
| `src/queue/AudioTaskQueue.test.ts` | 14 | B01, B04, C01, C02, G02 |
| `src/audio/fetchAudio.test.ts` | 11 | B02, B03 |
| `src/audio/AudioEngine.test.ts` | 14 | D01–D04, G03 |
| `src/visualizer/CanvasVisualizer.test.ts` | 12 | E01–E03, G04 |
| `src/App.test.tsx` | 10 | F01–F03, G04 |

**Test có bắt được lỗi thật không:** tôi cố ý sửa sai 35 chỗ trong code (queue/fetch 12, engine 10, visualizer 6, hook 7). 29 chỗ làm test đỏ ngay.
Một chỗ ban đầu không test nào bắt được: đó là lỗ hổng thật, đã bổ sung test (AI-02 trong `../../AI_FAILURE_AUDIT.md`).
5 chỗ còn lại là lớp phòng thủ dư không quan sát được từ bên ngoài, lý do ghi trong audit.

## 2. Kiểm tra trong Chrome thật

| Kiểm tra | Kết quả | Trạng thái |
|---|---|---|
| Thêm 3 bài cùng lúc | Chỉ 1 bài được tải/giải mã tại một thời điểm, theo thứ tự chord → sweep → beat | PASS |
| Phát → canvas có vẽ | 15 443 pixel cột sáng trên canvas 990×256 | PASS |
| FFT 512 | Hiển thị 256 cột | PASS |
| Dừng | Trạng thái "Đã dừng", rAF = 0 lần/giây | PASS |
| `/audio/broken.wav` | Báo lỗi giải mã | PASS |
| `/audio/missing.wav` | Báo lỗi "Máy chủ trả về trang HTML thay vì audio" (sau khi sửa AI-01) | PASS |
| 375 / 768 / 1440 px | `scrollWidth` bằng đúng viewport, không tràn ngang; canvas 309×192 ở 375px | PASS |
| Chỉ dùng bàn phím ở 375px | Tab: skip link → input → Thêm → Thêm 3 bài → Phát…; Enter thêm bài, Space phát nhạc | PASS |
| Lighthouse Accessibility | **100** (mobile) | PASS |
| Lighthouse Best Practices | **100** (mobile) | PASS |

Ảnh và báo cáo gốc nằm trong `evidence/`: `mobile-375.png`, `desktop-error-state.png`, `lighthouse-report.html`, `browser-audit.json`.

### Contrast màu (WCAG 2.x)

| Cặp màu | Tỉ lệ | Yêu cầu | Trạng thái |
|---|---|---|---|
| Chữ chính `#1e293b` / surface `#ffffff` | 14.63:1 | 4.5:1 | PASS |
| Chữ phụ `#475569` / nền trang `#f8fafc` | 7.24:1 | 4.5:1 | PASS |
| Chữ nút `#ffffff` / nút chính `#1d4ed8` | 6.70:1 | 4.5:1 | PASS |
| Chữ nút phụ `#1e293b` / `#e2e8f0` | 11.87:1 | 4.5:1 | PASS |
| Chữ lỗi `#991b1b` / nền lỗi `#fee2e2` | 6.80:1 | 4.5:1 | PASS |
| Viền focus `#c2410c` / nền trang `#f8fafc` | 4.95:1 | 3:1 | PASS |
| Viền input `#64748b` / surface | 4.76:1 | 3:1 | PASS |
| Cột tần số `#22d3ee` / nền canvas `#0f172a` | 9.88:1 | 3:1 | PASS |

## 3. Đối chiếu Definition of Done

| Tiêu chí | Bằng chứng | Trạng thái |
|---|---|---|
| Contract `AudioTask` có kiểu | `src/types/queue.ts` | PASS |
| Thực thi FIFO | Test G02 + Chrome | PASS |
| Đúng 1 worker | `maxActive = 1` trong test; Chrome | PASS |
| Fetch và decode hoạt động | Test B02/B03 + Chrome | PASS |
| Hủy bằng AbortController | Test C01 (hủy lúc chờ, lúc fetch, lúc vừa fetch xong, lúc decode) | PASS |
| Task đã hủy không resolve thành công về sau | Test "hủy lúc đang decode" | PASS |
| Lỗi không chặn hàng đợi | Test B04 + Chrome (broken → chord) | PASS |
| Dispose settle mọi task | Test C02 | PASS |
| Vòng đời AudioContext | Test D01; Chrome: 1 context | PASS |
| Dọn AudioBufferSourceNode | Test D03; Chrome: 323/323 source đã ngắt | PASS |
| AnalyserNode nối đúng | Test D04 (nối ra loa đúng 1 lần) | PASS |
| FFT 256 → 128 bin | Test + Chrome | PASS |
| FFT 512 → 256 bin | Test + Chrome | PASS |
| Canvas visualization | Test E01 + Chrome (pixel sáng) | PASS |
| Vòng đời rAF | Test E02; Chrome: 0 lần/giây khi dừng | PASS |
| Không có vòng rAF trùng | Chrome: số rAF/giây = FPS | PASS |
| Không đưa FFT vào React state mỗi frame | Test Profiler; Chrome: 0 DOM mutation khi phát | PASS |
| Bàn phím | Chrome, chỉ dùng bàn phím | PASS |
| Responsive | 375 / 768 / 1440 | PASS |
| Automated tests pass | 62/62 | PASS |
| Memory audit | `docs/MEMORY_AUDIT.md` | PASS |
| Đo 60 FPS bằng profiling | `docs/PERFORMANCE_AUDIT.md` (59.7–60.1 FPS) | PASS (headless; xem mục 4) |
| 3 lỗi AI thật | `Homework2/AI_FAILURE_AUDIT.md` | PASS |
| Chuẩn bị vấn đáp | `docs/ORAL_DEFENSE.md` | PASS |
| Production build | `npm run build` | PASS |
| Lịch sử Git atomic | 23 commit (`65c7ffd` → `9c8c575`), mỗi commit một task/module, đã push lên `origin/main` | PASS |
| Người làm tự giải thích được code | Cần tự tập theo `docs/ORAL_DEFENSE.md` | NOT VERIFIED |

## 4. Còn phải tự làm bằng tay

1. **Nghe thử thật:** headless Chrome không có loa. Mở `npm run dev`, bấm Phát và xác nhận có tiếng, không bị rè hay lặp tiếng.
2. **DevTools Performance:** Record khoảng 5 giây khi đang phát, có và không bật CPU 4× slowdown, rồi chụp dải Frames cho FFT 256 và 512.
3. **DevTools Network:** bật "Slow 4G", thêm 3 bài rồi hủy bài đang tải; chụp request ở trạng thái "(canceled)".
4. **Screen reader (NVDA):** nghe thông báo trạng thái khi tải xong, khi hủy và khi gặp lỗi.
