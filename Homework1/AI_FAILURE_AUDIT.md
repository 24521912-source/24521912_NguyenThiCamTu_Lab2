# AI Failure Audit — Homework 1: Enterprise Data-Grid

Đây là những lần AI làm sai (hoặc suýt sai) khi tôi làm Homework 1. Cách tôi bắt lỗi khá đơn giản:
test nào xanh ngay lần đầu thì tôi cố tình sửa sai code rồi chạy lại. Nếu test vẫn xanh thì test đó chưa chứng minh được gì.

---

## Lỗi 1 — Test "so sánh số" vẫn xanh dù đã xoá code so sánh số

- **Sai ở đâu:** `sortRows.test.ts`. AI viết test sắp xếp điểm `9, 10, 2` và khẳng định là "so sánh theo số".
  Tôi xoá dòng `return a - b` thì test vẫn **22/22 pass**.
- **Vì sao:** `Intl.Collator({ numeric: true })` vốn đã sắp `"9" < "10"` đúng, nên test với số nguyên không phân biệt được hai cách so sánh.
  Collator chỉ sai với số thập phân: nó cho `"2.5"` đứng trước `"2.25"`.
- **Sửa:** thêm test GPA `[2.5, 10, 2.25]`, kết quả mong đợi `[2.25, 2.5, 10]`.
- **Kiểm tra lại:** xoá nhánh so sánh số thì test mới **fail** (`1 failed | 22 passed`).

## Lỗi 2 — Test pipeline không phát hiện sai thứ tự Filter → Sort → Paginate

- **Sai ở đâu:** `pipeline.test.ts` chỉ kiểm tra dòng đầu của trang 1 là dòng có điểm cao nhất.
  Tôi cố ý đổi thành "cắt trang trước rồi mới sort", test vẫn **5/5 pass**.
- **Vì sao:** dữ liệu mẫu tình cờ có điểm 9 nằm sẵn ở trang 1, nên sort trong trang hay sort toàn bộ đều ra cùng dòng đầu.
- **Sửa:** so sánh cả trang: `[9, 8, 7, 4, 3]`. Nếu sai thứ tự sẽ ra `[9, 8, 7, 1, 0]`.
- **Kiểm tra lại:** đổi sai thứ tự thì test **fail**.

## Lỗi 3 — Test "giữ focus sau khi sort" cũng pass nhờ trùng hợp

- **Sai ở đâu:** `DataGrid.test.tsx`. Tôi sửa code cho lưu ô đang focus theo **vị trí** thay vì theo **bản ghi**, test vẫn xanh.
- **Vì sao:** với dữ liệu mẫu, P03 đứng ở vị trí số 2 cả trước lẫn sau khi sort, nên lưu theo vị trí hay theo bản ghi đều trỏ vào P03.
- **Sửa:** dùng 5 sản phẩm đầu, focus vào P02, rồi kiểm tra P02 thật sự bị đẩy từ vị trí 1 xuống vị trí 3.
- **Kiểm tra lại:** lưu theo vị trí thì test **fail** (`3 failed | 21 passed`).

## Suýt lỗi 4 — Suýt cài jsdom không chạy được trên máy

- Bản jsdom mới nhất (30.1.3) yêu cầu Node `^24.15.0`, trong khi máy tôi chạy Node `24.14.0`.
  Tôi phát hiện bằng `npm view jsdom engines` **trước khi cài**, nên chuyển sang `jsdom@29`. Cài xong không có cảnh báo engine nào.

## Suýt lỗi 5 — Suýt "sửa" một lỗi tràn layout không có thật

- Ảnh chụp bằng `chrome --window-size=375,900` trông như trang bị tràn ngang ở 375px, và tôi đã định thêm CSS để sửa.
- Nhìn kỹ thì chữ xuống dòng ở khoảng 450px, tức là Chrome desktop có chiều rộng cửa sổ tối thiểu, chứ trang không lỗi.
  Đo lại bằng chế độ giả lập điện thoại: `document.scrollWidth = 375`, **không tràn**. Ảnh đúng nằm ở `docs/evidence/mobile-375.png`.

---

| # | Vấn đề | Phát hiện bằng | Kết quả |
|---|---|---|---|
| 1 | Test số không kiểm tra nhánh số | Xoá code, chạy lại test | Đã sửa |
| 2 | Test pipeline không bắt sai thứ tự | Đổi thứ tự, chạy lại test | Đã sửa |
| 3 | Test focus pass nhờ trùng hợp | Đổi cách lưu focus, chạy lại test | Đã sửa |
| 4 | jsdom không hợp phiên bản Node | `npm view ... engines` | Đã tránh |
| 5 | Đọc nhầm ảnh 375px | Đo `scrollWidth` | Đã tránh |
