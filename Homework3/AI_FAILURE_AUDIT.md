# AI Failure Audit — Homework 3: Flash Sale 11.11

Đây là những lỗi AI gây ra khi tôi làm Homework 3. Tôi bắt lỗi bằng cách chạy app thật trong Chrome
(chờ sale mở, giữ hàng, cho 20 khách tranh mua, bấm thanh toán 2 lần, chờ khóa hết hạn), và cố tình sửa sai code xem test có đỏ không.
Log chạy thử nằm ở `homework3-flash-sale/docs/evidence/browser-smoke.txt`.

---

## AI-01 — Cùng là "hết hạn giữ hàng" mà báo hai lý do khác nhau

- **Sai ở đâu:** khi khóa giữ hàng hết hạn trong lúc đang thanh toán, kết quả phụ thuộc vào việc timer đã chạy hay chưa:
  timer chưa chạy thì báo `RESERVATION_EXPIRED` (đúng), timer đã chạy thì báo `RESERVATION_NOT_ACTIVE`
  kèm câu *"Không thể COMMIT một đơn ... EXPIRED"*.
- **Vì sao:** logic kiểm tra hết hạn bị viết lặp lại ở **2 chỗ** (`InventoryEngine` và `CheckoutEngine`), và cả hai đều quên trường hợp đơn đã ở trạng thái `EXPIRED`.
- **Bằng chứng:** test báo `- "RESERVATION_EXPIRED"  + "RESERVATION_NOT_ACTIVE"`. Lần đầu tôi chỉ sửa ở `InventoryEngine`;
  đến lúc viết test tích hợp thì **lỗi lại hiện ra** ở `CheckoutEngine`.
- **Sửa:** cả hai chỗ đều coi `EXPIRED` là hết hạn. Bài học: sửa lỗi thì phải tìm hết mọi chỗ có cùng logic.

## AI-02 — Bấm "Thanh toán" 2 lần thì giao diện báo thất bại sai

- **Sai ở đâu:** `CheckoutPanel` chặn bấm lặp bằng state `pending`. Bấm 2 lần nhanh thì hiện *"Thất bại: Đơn này đang được thanh toán"*
  trong khi lần thanh toán đầu vẫn đang chạy, và nút bị bật lại.
- **Vì sao:** `setPending(true)` chỉ có tác dụng ở lần render sau, nên cả 2 cú click đều thấy `pending = false`.
  Engine vẫn chặn đúng (chỉ bán 1 suất); chỉ có giao diện hiển thị sai.
- **Sửa:** dùng thêm `useRef` làm cờ đổi ngay lập tức. Chạy lại trong Chrome thì chỉ hiện "Đang xử lý…" rồi "Thành công".

## AI-03 — Đơn của "khách khác" hiện trong mục "Đơn giữ hàng của bạn"

- **Sai ở đâu:** sau khi bấm "Cho 20 khách tranh mua", đơn của khách mô phỏng hiện lẫn vào danh sách của tôi.
  Tôi còn có thể hủy hoặc thanh toán hộ đơn của họ, và nhận thông báo *"Đơn R-0002 đã hết hạn"* cho một đơn không phải của mình.
- **Vì sao:** contract `Reservation` do AI thiết kế không có thông tin "đơn này của ai".
- **Sửa:** thêm `customerId` vào contract; giao diện chỉ lọc ra đơn của người dùng. TypeScript báo ngay mọi chỗ gọi `reserve()` còn thiếu, nên không sót chỗ nào.

## AI-04 — Test không phát hiện khi engine quên báo cho giao diện

- **Sai ở đâu:** tôi xoá lệnh `publish()` sau khi đơn hết hạn, tức là hàng đã về kho nhưng giao diện không được báo. **65/65 test vẫn xanh.**
- **Vì sao:** test đọc kho qua `getRecord()` (dữ liệu bên trong engine), còn React lại đọc `getSnapshot()`. Test kiểm tra nhầm con đường dữ liệu.
- **Sửa:** thêm test kiểm tra cả `subscribe` lẫn `getSnapshot()` sau khi hết hạn. Xoá `publish()` thì test **fail**.

## AI-05 — Test timer không phát hiện frame thừa sau khi hủy

- **Sai ở đâu:** xoá dòng `if (stopped) return` ngay sau `onTick` thì **11/11 test timer vẫn xanh**,
  dù khi đó timer bị hủy trong `onTick` vẫn lên lịch thêm 1 frame thừa.
- **Vì sao:** test chỉ đếm số lần `onTick` được gọi, không kiểm tra còn frame nào trong hàng chờ hay không.
- **Sửa:** kiểm tra hàng chờ frame phải rỗng ngay sau khi hủy. Xoá dòng kia thì test **fail**.

---

| Mã | Lỗi | Phát hiện bằng | Kết quả |
|---|---|---|---|
| AI-01 | Hết hạn bị báo 2 lý do khác nhau | Test đơn vị + test tích hợp | Đã sửa |
| AI-02 | Bấm thanh toán 2 lần báo sai | Chạy thử trong Chrome | Đã sửa |
| AI-03 | Lẫn đơn của khách khác | Chạy thử trong Chrome | Đã sửa |
| AI-04 | Test không bắt lỗi quên báo UI | Xoá code, chạy lại test | Đã sửa |
| AI-05 | Test không bắt frame thừa | Xoá code, chạy lại test | Đã sửa |
