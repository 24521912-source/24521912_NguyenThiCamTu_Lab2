# Visualizer Performance Audit (H02)

**Ngày đo:** 29/10/2026  
**Môi trường:** Windows 11, Chrome 156.0.8078.49 headless, viewport 1280×900, devicePixelRatio 1, canvas 990×256 px, bản production  
**Script:** `scripts/browser-audit.cjs`. Kết quả gốc: `evidence/browser-audit.json`

## 1. Cách đo

- **FPS của visualizer:** đếm số lần `AnalyserNode.getByteFrequencyData()` được gọi trong 3 giây khi đang phát. Mỗi frame vẽ gọi hàm này đúng 1 lần.
- **Số vòng rAF:** đếm số lần gọi `requestAnimationFrame`. Nếu có 2 vòng chạy song song thì con số này sẽ khoảng 120 lần/giây.
- **Thời gian main thread mỗi frame:** chênh lệch `ScriptDuration` và `TaskDuration` (CDP `Performance.getMetrics`) chia cho số frame.
- **React có render theo frame không:** đếm DOM mutation bằng `MutationObserver` trong lúc phát. Ngoài ra test `App.test.tsx` dùng `<Profiler>` đếm số lần render qua 30 frame.

## 2. Kết quả

| | FFT 256 | FFT 512 |
|---|---|---|
| Số cột tần số (`frequencyBinCount`) | 128 | 256 |
| FPS của visualizer | 59.8 | 59.7 |
| Lần gọi `requestAnimationFrame`/giây | 59.8 | 59.7 |
| Thời gian script mỗi frame | 0.10 ms | 0.15 ms |
| Tổng thời gian task mỗi frame | 0.52 ms | 0.63 ms |
| DOM mutation trong 3 giây phát | 0 | 0 |

Lần đo đầu tiên (`ROUNDS=3`) cho kết quả gần như giống hệt: 60.1 / 60.1 FPS, 0.10 / 0.14 ms script mỗi frame.

- Ngân sách một frame ở 60 FPS là 16.7 ms. Visualizer dùng khoảng 0.5–0.6 ms, tức **dưới 4%**.
- FFT 512 vẽ gấp đôi số cột nên tốn thêm khoảng 0.04 ms script mỗi frame, không ảnh hưởng FPS.
- Số lần gọi rAF bằng đúng FPS, nên chỉ có **một vòng lặp**. Khi dừng: **0** lần gọi/giây.
- **0 DOM mutation** trong lúc phát: dữ liệu FFT không đi qua React state.
  Test `React không render lại theo từng frame của visualizer`: số lần render **không đổi** sau 30 frame.

## 3. Đối chiếu tiêu chí H02

| Tiêu chí | Trạng thái |
|---|---|
| FPS đo bằng profiling trình duyệt | PASS (đo trong Chrome bằng CDP) |
| Đo cả FFT 256 và 512 | PASS |
| Loại trừ vòng rAF trùng lặp | PASS (rAF/giây = FPS; test E02) |
| Kiểm tra tần suất render của React | PASS (0 mutation; test Profiler) |
| Rà soát cấp phát mỗi frame | PASS: `Uint8Array` được dùng lại, chỉ cấp phát lại khi đổi FFT (test `dùng lại cùng Uint8Array`) |
| Ghi nhận điểm nghẽn | Không phát hiện điểm nghẽn nào |

## 4. Giới hạn và việc nên làm thêm bằng tay

- Chrome headless đồng bộ frame theo 60 Hz ảo. Trên màn hình 120/144 Hz thì rAF chạy theo tần số màn hình, nên FPS sẽ cao hơn 60; đó là bình thường.
- Chưa đo trên máy yếu hoặc khi bật CPU throttling. Nên tự đo thêm: DevTools → Performance → CPU **4× slowdown** → Record khoảng 5 giây khi đang phát → xem dải **Frames** và mục **Summary**.
- Chưa có số liệu từ React DevTools Profiler trên trình duyệt (dùng `<Profiler>` trong test thay thế).
- Ý tưởng cải thiện (không bắt buộc): vẽ trục tần số theo thang log để các bài có tần số thấp không bị dồn cột về bên trái.
