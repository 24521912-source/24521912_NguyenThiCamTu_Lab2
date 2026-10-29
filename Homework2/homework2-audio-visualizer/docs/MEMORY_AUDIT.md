# Memory & Resource Audit (H01)

**Ngày đo:** 29/10/2026  
**Môi trường:** Windows 11, Chrome 156.0.8078.49 headless (điều khiển bằng puppeteer-core qua CDP), bản production (`npm run build` + `vite preview`)  
**Script:** `scripts/browser-audit.cjs` (`ROUNDS=8`), `scripts/heap-diff.cjs`. Kết quả gốc: `evidence/browser-audit.json`

## 1. Kịch bản

Mỗi **đợt** gồm:
- 40 lần **Phát → chờ 40 ms → Dừng**;
- 20 lần **Thêm cùng lúc 3 bài demo → bấm Hủy hết các bài trong hàng đợi**, tổng cộng 60 yêu cầu, phần lớn bị hủy ngay lúc đang chờ hoặc đang tải.

Chạy 8 đợt liên tiếp (320 lần phát/dừng, 480 yêu cầu). Trước mỗi lần đo đều gọi `HeapProfiler.collectGarbage`.
Script bọc `AudioContext`, `createBufferSource`, `disconnect`, `requestAnimationFrame` để đếm.

## 2. Kết quả

| Đo | Trước | Sau đợt 1 | Đợt 2 | Đợt 3 | Đợt 4 | Đợt 5 | Đợt 6 | Đợt 7 | Đợt 8 |
|---|---|---|---|---|---|---|---|---|---|
| JS heap (MB) | 1.76 | 2.13 | 2.19 | 2.22 | 2.31 | 2.36 | 2.36 | 2.37 | 2.38 |
| DOM nodes | 151 | 151 | 151 | 151 | 151 | 151 | 151 | 151 | 151 |
| Event listeners | 153 | 153 | 153 | 153 | 153 | 153 | 153 | 153 | 153 |

| Tài nguyên audio | Giá trị |
|---|---|
| AudioContext được tạo | 1 (không tạo lại khi phát nhiều lần) |
| AudioBufferSourceNode được tạo | 323 |
| AudioBufferSourceNode được `disconnect()` | 323 |
| Lần gọi `requestAnimationFrame` trong 1 giây sau khi dừng | 0 |
| Lỗi trên trang / console | 0 |
| Bài đã giải mã được giữ lại | 3 (giới hạn tối đa 5, `MAX_TRACKS`) |

### Heap tăng nhẹ có phải rò rỉ không?

Heap tăng nhiều nhất ở đợt đầu (+0.37 MB, chủ yếu do JIT và khởi tạo lần đầu), sau đó chậm dần và gần như dừng
(+0.00 → +0.01 MB/đợt ở các đợt cuối). Để kiểm tra chắc chắn, tôi chụp **2 heap snapshot** (sau đợt 2 và sau đợt 8)
rồi đếm số object theo từng constructor:

```text
Tăng/giảm số object sau thêm 6 đợt (240 lần phát/dừng, 360 yêu cầu bị hủy):
  object:AudioBufferSourceNode: 1 → 1
  object:AudioBuffer: 1 → 1
  object:DOMException: 0 → 0
  object:AbortController: 0 → 0
  object:AbortSignal: 1 → 1
  object:Promise: 4 → 4
```

Danh sách chênh lệch của **toàn bộ** object và closure là **rỗng**: không loại object nào tăng số lượng.
Phần heap tăng thêm không đến từ object JS bị giữ lại (khả năng là code đã tối ưu, inline cache của V8).
Kết luận: **không phát hiện rò rỉ**.

## 3. Đối chiếu với tiêu chí H01

| Tiêu chí | Bằng chứng | Trạng thái |
|---|---|---|
| Phát lặp lại | 320 lần phát/dừng, source tạo = source ngắt (323/323) | PASS |
| Hủy lặp lại | 480 yêu cầu, `AbortController`/`DOMException` không tích lũy (0 → 0) | PASS |
| Dispose hàng đợi | Test `C02: dispose` (4 test) + unmount test trong `App.test.tsx` | PASS (test) |
| Unmount khi đang phát | Test `F01: unmount...`: request bị abort, rAF = 0, source dừng, context `close()` | PASS (test) |
| Vòng đời AudioContext/AudioNode | 1 context; analyser nối ra loa đúng 1 lần (test D04) | PASS |
| Hủy animation frame | 0 lần gọi rAF/giây sau khi dừng | PASS |
| Dọn event listener | Số listener giữ nguyên 153 qua 8 đợt; `ResizeObserver.disconnect()` khi dispose (test E03) | PASS |
| Không còn rò rỉ đã biết | Heap snapshot diff rỗng | PASS |

## 4. Giới hạn

- Đo bằng Chrome headless, chưa đo trên Firefox/Safari.
- Lúc trình duyệt thật đóng tab thì `AudioContext` được trình duyệt tự giải phóng. Việc **unmount component** đóng context chỉ kiểm chứng được bằng test (`context.close` được gọi đúng 1 lần), vì demo không có nút unmount.
- Nên tự kiểm tra lại bằng tay: DevTools → Memory → Heap snapshot → bấm Phát/Dừng khoảng 20 lần → chụp snapshot lần 2 → chọn **Comparison**.
