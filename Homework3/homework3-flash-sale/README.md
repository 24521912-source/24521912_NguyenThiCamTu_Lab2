# Flash Sale 11.11 — High-Concurrency Flash-Sale Engine

Lab 02, Homework 3 (Web Application Development 2026, UIT). Mô phỏng một đợt flash sale nửa đêm 11.11 ở Việt Nam:
đồng hồ đếm ngược không bị trôi, giữ hàng bằng optimistic locking, khóa giữ hàng tự hết hạn, và thanh toán đi qua máy trạng thái.
Sản phẩm, thương hiệu đều hư cấu; không có thanh toán thật.

**Công nghệ:** React 19, TypeScript 7 (strict), Vite 8, Vitest 5, oxlint. Không dùng thư viện countdown, kho hàng hay UI bên ngoài.

## Cài đặt và chạy

Cần Node 22 hoặc 24 trở lên.

```powershell
npm install
npm run dev              # http://localhost:5173
```

Bản demo rút ngắn thời gian: sale mở **10 giây** sau khi tải trang, kéo dài **3 phút**, mỗi lần giữ hàng được khóa **30 giây**
(chỉnh trong `src/data/products.ts` → `FLASH_SALE_TIMING`). Tải lại trang thì mọi thứ bắt đầu lại từ đầu.

## Kiểm tra

```powershell
npx tsc -b --noEmit      # kiểm tra kiểu
npm run lint             # oxlint
npm run test -- --run    # 74 test
npm run build            # bản production vào dist/
npx vite preview         # chạy thử bản production
```

## Kiến trúc

```text
src/
  contracts/   kiểu dữ liệu dùng chung (timer, inventory, reservation, checkout, result)
  engines/
    timerEngine.ts              đếm ngược theo mốc tuyệt đối
    reservationStateMachine.ts  bảng chuyển trạng thái (hàm thuần)
    inventoryEngine.ts          chủ sở hữu DUY NHẤT của sổ kho và đơn giữ hàng
    checkoutEngine.ts           thanh toán: kiểm tra → chờ thanh toán → commit
  simulation/  nhiều khách tranh mua cùng lúc, bấm thanh toán nhiều lần
  hooks/       useCountdown, useSalePhase, useInventory (React chỉ đọc engine)
  components/  SaleCountdown, ProductList/ProductCard, ReservationPanel, CheckoutPanel, CompetitionPanel
  tests/       7 file test cho engine, mô phỏng và tích hợp
docs/
  ENGINE_CONTRACTS.md   hợp đồng hành vi chi tiết (đọc trước khi sửa engine)
  evidence/             Lighthouse, ảnh chụp, log chạy thử trong Chrome
```

Engine được tạo một lần trong `main.tsx`, nằm ngoài React. Component chỉ đọc snapshot qua `useSyncExternalStore`
và gọi hàm của engine; không component nào tự sửa số tồn kho.

## Các ý chính

### Đồng hồ không trôi

```typescript
const remaining = Math.max(0, targetTime - Date.now());
```

Mỗi frame (`requestAnimationFrame`) tính lại thời gian còn lại từ **mốc tuyệt đối**, không trừ dần 1 giây hay 16 ms.
Nếu tab bị ẩn 5 giây hoặc máy bận làm frame trễ, frame kế tiếp vẫn ra đúng giá trị, sai số không cộng dồn
(test: *"frame bị trễ (tab ẩn 5 giây) không làm trôi"*). Hook chỉ `setState` khi **số giây hiển thị** đổi,
nên React render khoảng 1 lần/giây chứ không phải 60 lần/giây (đo trong Chrome: 3 lần cập nhật DOM trong 3 giây).

### Bất biến kho

```text
totalStock = availableStock + reservedStock + soldStock     (mọi số đều nguyên, >= 0)
```

| Thao tác | available | reserved | sold | version |
|---|---|---|---|---|
| Giữ hàng | −q | +q | | +1 |
| Hủy / hết hạn | +q | −q | | +1 |
| Thanh toán | | −q | +q | +1 |

Engine kiểm tra lại bất biến sau mỗi lần ghi.

### Optimistic locking

Khi giữ hàng, người mua gửi kèm `expectedVersion` là version kho mà họ đang nhìn thấy. Nếu trong lúc đó có người khác
đã mua (version đã tăng), yêu cầu bị từ chối với `VERSION_CONFLICT` và người mua phải đọc lại.
Hàm `reserve` là hàm đồng bộ, nên việc so version, kiểm tra tồn kho và cập nhật diễn ra trong **một lượt event loop**,
không request nào chen vào giữa được. Phần mô phỏng thử lại **tối đa 3 lần** khi trùng version.

### Máy trạng thái giữ hàng

```text
ACTIVE ──COMMIT──► COMMITTED
       ──CANCEL──► CANCELLED
       ──EXPIRE──► EXPIRED          (3 trạng thái cuối, không quay lại ACTIVE)
```

Chỉ lần chuyển đầu tiên ra khỏi `ACTIVE` mới thành công, vì vậy hàng được trả về kho **đúng một lần**, và không thể thanh toán 2 lần.

### Hết hạn khóa

`expiresAt = createdAt + 30 giây`, là mốc tuyệt đối. Đơn còn hiệu lực khi `now < expiresAt`; **đúng bằng `expiresAt` là đã hết hạn**.
Engine đặt `setTimeout` để tự hết hạn. Ngoài ra **mọi thao tác** lên đơn (hủy, thanh toán) đều kiểm tra lại hạn,
nên timer chạy trễ không thể kéo dài thời gian giữ hàng. Nếu khóa hết hạn **trong lúc đang thanh toán**,
bước commit sẽ phát hiện và thanh toán thất bại, không bán ra hàng.

## Giới hạn

- Chỉ bảo đảm nhất quán trong **một tab trình duyệt, một engine**. Không có server, không đồng bộ giữa nhiều tab hay nhiều thiết bị.
- Thời gian lấy từ `Date.now()` của máy người dùng. Chỉnh giờ máy thì countdown và hạn khóa đổi theo (có test ghi lại hành vi này).
- `requestAnimationFrame` dừng khi tab bị ẩn. Lúc quay lại, đồng hồ tự đúng ngay nhờ mốc tuyệt đối,
  còn việc hết hạn khóa vẫn chính xác vì không phụ thuộc vào đồng hồ hiển thị.
- Thanh toán chỉ là một khoảng chờ 1.2 giây giả lập. Trường hợp "đã trừ tiền nhưng khóa hết hạn" được xử lý như thanh toán thất bại; ngoài đời sẽ phải hoàn tiền.
- Bộ lọc "chỉ hiện đơn của bạn" và việc chặn bấm thanh toán 2 lần ở giao diện **chưa có test tự động** (WBS không có task test UI).
  Hai phần này được kiểm chứng bằng chạy thử trong Chrome (`docs/evidence/browser-smoke.txt`).

## Kết quả kiểm chứng (29/10/2026)

| Kiểm tra | Kết quả |
|---|---|
| `npx tsc -b --noEmit` | Không lỗi |
| `npm run lint` | Không lỗi |
| `npm run test -- --run` | 7 file, 74 test passed |
| `npm run build` | Thành công |
| Lighthouse (Chrome 156, mobile, bản production) | Performance 100 · Accessibility 100 · Best Practices 100 |
| Chạy thử trong Chrome (puppeteer) | Xem `docs/evidence/browser-smoke.txt`: 20 khách tranh 1 chiếc → 1 người giữ được; bấm thanh toán 2 lần → bán 1 suất; khóa hết hạn sau 30 giây → hàng về kho |
| 375px | Không tràn ngang (`scrollWidth` = 375) |
| Kiểm tra tay bằng screen reader, zoom 200% | **Chưa làm** |

Contrast (WCAG 2.x): mọi cặp chữ/nền đều ≥ 4.5:1 (thấp nhất 6.47:1, chữ trắng trên nút đỏ `#b91c1c`).
Viền focus `#1d4ed8` ≥ 6.3:1 trên nền trang và nền thẻ. Riêng trên nền banner chỉ đạt 1.5:1, nhưng banner không chứa phần tử nhận focus nên không áp dụng.

Audit lỗi AI: `../AI_FAILURE_AUDIT.md`.
