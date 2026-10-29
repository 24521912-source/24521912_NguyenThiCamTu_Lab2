# Engine Contracts — Flash Sale 11.11

Task H3-A03. Hợp đồng hành vi cho kho hàng, giữ hàng (reservation), hết hạn khóa và thanh toán. Viết **trước** khi code engine.
Kiểu dữ liệu nằm trong `src/contracts/`.

## 1. Chủ sở hữu trạng thái

| Trạng thái | Chủ sở hữu duy nhất | Ai được đọc |
|---|---|---|
| Sổ kho (`InventoryRecord`) | `InventoryEngine` | React qua `getSnapshot()` (đã freeze) |
| Đơn giữ hàng (`Reservation`) | `InventoryEngine` | React qua `getReservations()` (đã freeze) |
| Timer hết hạn khóa | `InventoryEngine` | — |
| Checkout đang chạy | `CheckoutEngine` | — |
| Countdown hiển thị | `timerEngine` + hook `useCountdown` | React |

React **không bao giờ** sửa sổ kho. Mọi thay đổi đi qua các hàm `reserve / cancel / expireDue / commit` của engine.

Mỗi đơn giữ hàng mang `customerId` của người giữ. Bản demo có một người dùng thật (`ban`) và các khách mô phỏng (`khach-N`).
Giao diện chỉ hiển thị và cho thao tác trên đơn của người dùng; đơn của khách mô phỏng vẫn chiếm hàng trong kho như bình thường.

## 2. Bất biến kho

Với mọi sản phẩm, tại mọi thời điểm:

```text
totalStock = availableStock + reservedStock + soldStock
availableStock, reservedStock, soldStock, totalStock là số nguyên >= 0
```

Mỗi thao tác chỉ chuyển số lượng giữa các ngăn, không tạo ra hay làm mất hàng:

| Thao tác | available | reserved | sold | version |
|---|---|---|---|---|
| Giữ hàng q cái | −q | +q | 0 | +1 |
| Hủy giữ hàng | +q | −q | 0 | +1 |
| Hết hạn khóa | +q | −q | 0 | +1 |
| Thanh toán thành công | 0 | −q | +q | +1 |
| Bất kỳ thao tác thất bại nào | 0 | 0 | 0 | 0 |

Engine kiểm tra lại bất biến sau mỗi thay đổi; nếu vi phạm thì ném `Error`. Đây là lỗi lập trình, không phải lỗi nghiệp vụ.

## 3. Máy trạng thái giữ hàng

```text
                 COMMIT
          ┌──────────────► COMMITTED   (trạng thái cuối)
          │      CANCEL
 ACTIVE ──┼──────────────► CANCELLED   (trạng thái cuối)
          │      EXPIRE
          └──────────────► EXPIRED     (trạng thái cuối)
```

- Đơn giữ hàng được **tạo ra** ở trạng thái `ACTIVE` (không phải chuyển trạng thái).
- Chỉ `ACTIVE` mới nhận được sự kiện. Mọi sự kiện gửi tới trạng thái cuối đều trả `INVALID_TRANSITION`.
  Ví dụ: thanh toán 2 lần, hủy sau khi đã thanh toán, hết hạn sau khi đã thanh toán, hủy 2 lần.
- Trạng thái cuối không bao giờ quay về `ACTIVE`.
- Hàng được trả về kho **đúng một lần**, vì chỉ lần chuyển đầu tiên ra khỏi `ACTIVE` mới thành công.

## 4. Optimistic locking (khóa lạc quan)

- Mỗi sản phẩm có `version`, tăng 1 sau mỗi thay đổi thành công của bản ghi đó.
- `reserve({ productId, quantity, expectedVersion })` chỉ thành công khi `expectedVersion === version` hiện tại.
  Nếu khác, trả `VERSION_CONFLICT` và không thay đổi gì.
- Thứ tự kiểm tra: sale đang mở → sản phẩm tồn tại → số lượng hợp lệ → **version** → còn đủ hàng.
- Ý nghĩa: người mua chỉ được giữ hàng dựa trên số tồn kho **mới nhất** mà họ đã thấy. Nếu kho đổi trong lúc họ đang bấm,
  họ phải đọc lại rồi mới thử lại.

## 5. Ranh giới atomic

Ứng dụng chạy trong **một** JavaScript runtime đơn luồng. Mỗi hàm của engine (`reserve`, `cancel`, `expireDue`, `commit`)
là **đồng bộ** và không có `await` bên trong, nên phần "kiểm tra version + kiểm tra tồn kho + cập nhật" chạy trọn trong một lượt
của event loop. Không request nào khác chen vào giữa được.

Race condition chỉ xảy ra ở **khoảng hở bất đồng bộ** giữa lúc *đọc* snapshot và lúc *ghi*, ví dụ do mạng chậm hoặc chờ thanh toán.
Khoảng hở này được xử lý bằng `expectedVersion` (khi giữ hàng) và bằng việc kiểm tra lại trạng thái lúc commit (khi thanh toán).

## 6. Thời gian

- Mọi mốc thời gian là **epoch ms tuyệt đối** (`Date.now()`): `saleWindow.startsAt`, `saleWindow.endsAt`, `reservation.expiresAt`.
- Sale mở trong khoảng `[startsAt, endsAt)`: tại đúng `startsAt` đã mở, tại đúng `endsAt` đã đóng.
- `expiresAt = createdAt + lockDurationMs`. Đơn giữ hàng còn hiệu lực khi `now < expiresAt`; **tại đúng `expiresAt` là đã hết hạn**.
- Hết hạn được áp dụng theo 2 cách, cách nào đến trước thì dùng cách đó:
  1. Timer `setTimeout` của engine gọi `expireDue()` khi tới hạn.
  2. **Mọi thao tác trên một đơn** (`cancel`, `commit`) đều kiểm tra hạn trước. Đơn đã quá hạn thì chuyển sang `EXPIRED`
     rồi mới trả `RESERVATION_EXPIRED`.
- Vì vậy timer chạy trễ (tab bị treo, máy bận) **không thể kéo dài** thời gian giữ hàng. Khả năng thanh toán cũng không phụ thuộc
  vào việc UI đã cập nhật đồng hồ hay chưa.
- Callback hết hạn chạy trễ hoặc chạy lặp lại thì vô hại: nó chỉ hết hạn những đơn còn `ACTIVE` và đã quá hạn.
- Giới hạn: `Date.now()` là đồng hồ của máy người dùng. Nếu người dùng chỉnh giờ máy thì countdown và hạn khóa đổi theo.
  Ứng dụng không đồng bộ với đồng hồ server.

## 7. Thanh toán

`CheckoutEngine.checkout(reservationId)`:

1. Đơn đang được thanh toán dở thì trả `CHECKOUT_IN_PROGRESS` (chặn bấm 2 lần).
2. Kiểm tra trước: đơn tồn tại, đang `ACTIVE`, chưa quá hạn.
3. Gọi `processPayment` (bất đồng bộ, giả lập độ trễ; không có thông tin thanh toán thật).
4. Gọi `inventory.commit(reservationId)`. Hàm này **kiểm tra lại hạn và trạng thái tại thời điểm commit**.
   Nếu đơn đã hết hạn hoặc bị hủy trong lúc chờ thanh toán thì thanh toán **thất bại** và không bán ra hàng nào.
5. Mỗi lần gọi `checkout()` luôn trả `Result`, không bao giờ reject: lỗi của `processPayment` được chuyển thành `PAYMENT_FAILED`.

Sau khi sale đóng (`endsAt`), **không giữ hàng mới được**, nhưng đơn đang `ACTIVE` vẫn thanh toán được cho tới `expiresAt`.

## 8. Mô hình đồng thời và retry

- Mô phỏng nhiều khách mua cùng lúc bằng nhiều `Promise` chạy song song, mỗi khách: đọc version → chờ (độ trễ mạng giả lập) → `reserve`.
- `VERSION_CONFLICT`: đọc lại version mới và thử lại, **tối đa 3 lần** (retry có giới hạn). Hết lượt thì báo thất bại.
- `INSUFFICIENT_STOCK`, `SALE_NOT_ACTIVE`, `INVALID_QUANTITY`: không retry vì thử lại cũng không thay đổi kết quả.
- Kết quả được gom bằng `Promise.allSettled`, nên một khách lỗi không làm hỏng cả đợt và không có unhandled rejection.
- **Giới hạn:** chỉ bảo đảm nhất quán **trong một engine, một tab trình duyệt**. Không có bảo đảm giữa nhiều tab, nhiều thiết bị hay hệ thống phân tán.

## 9. Lỗi nghiệp vụ

| Mã | Khi nào |
|---|---|
| `SALE_NOT_ACTIVE` | Giữ hàng ngoài khung `[startsAt, endsAt)` |
| `UNKNOWN_PRODUCT` | Mã sản phẩm không tồn tại |
| `INVALID_QUANTITY` | Không phải số nguyên, `< 1` hoặc vượt `maxPerReservation` |
| `VERSION_CONFLICT` | `expectedVersion` khác version hiện tại |
| `INSUFFICIENT_STOCK` | `availableStock < quantity` |
| `UNKNOWN_RESERVATION` | Mã đơn giữ hàng không tồn tại |
| `INVALID_TRANSITION` | Gửi sự kiện tới đơn đã ở trạng thái cuối |
| `RESERVATION_EXPIRED` | Thao tác lên đơn đã quá hạn, **dù timer đã chuyển đơn sang `EXPIRED` hay chưa** (cả `InventoryEngine` lẫn `CheckoutEngine`) |
| `CHECKOUT_IN_PROGRESS` | Đang thanh toán dở chính đơn đó |
| `RESERVATION_NOT_ACTIVE` | Thanh toán đơn không còn `ACTIVE` |
| `PAYMENT_FAILED` | `processPayment` báo lỗi |
