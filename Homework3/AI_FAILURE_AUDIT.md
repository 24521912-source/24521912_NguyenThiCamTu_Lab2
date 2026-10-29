# AI Failure Audit — Homework 3: Flash Sale 11.11

File này ghi lại những lần AI viết sai trong lúc làm Homework 3. Đề yêu cầu ít nhất 3 lỗi thật.
Dưới đây có 5 lỗi, lỗi nào cũng xảy ra thật trong lúc làm và có output để đối chiếu. Không có lỗi nào được cố ý cài vào cho đủ số.

**Cách tìm lỗi:**
- Test nào xanh ngay lần đầu thì tôi cố ý sửa sai code rồi chạy lại. Nếu test vẫn xanh thì test đó không bảo vệ được gì.
- Chạy app thật trong Chrome (điều khiển bằng puppeteer), bấm như người dùng: chờ sale mở, giữ hàng, cho 20 khách tranh mua,
  bấm thanh toán 2 lần liên tiếp, để khóa giữ hàng tự hết hạn. Log đầy đủ ở `homework3-flash-sale/docs/evidence/browser-smoke.txt`.
- Test tích hợp chạy timer và kho trên cùng một đồng hồ giả, để thấy các thứ tự sự kiện mà test đơn vị bỏ sót.

Mỗi lỗi ghi theo mẫu: mã lỗi, code/hành vi sai, nguyên nhân, cách tái hiện, bằng chứng, cách sửa, kết quả kiểm tra lại.

---

## AI-01: Cùng là "hết hạn giữ hàng" nhưng báo 2 lý do khác nhau, lần sửa đầu còn sót

**Task:** H3-D03, H3-E01, phát hiện ở H3-E03 và H3-G02  
**File:** `src/engines/inventoryEngine.ts`, `src/engines/checkoutEngine.ts`

**1. Code / hành vi sai**

Khi khóa giữ hàng hết hạn trong lúc khách đang thanh toán, kết quả trả về phụ thuộc vào việc timer đã kịp chạy hay chưa:
- timer chạy trễ (đơn vẫn `ACTIVE` nhưng đã quá giờ): `RESERVATION_EXPIRED`, đúng;
- timer đã chạy (đơn đã là `EXPIRED`): máy trạng thái thấy `EXPIRED + COMMIT` là không hợp lệ và trả `INVALID_TRANSITION`,
  `CheckoutEngine` đổi thành `RESERVATION_NOT_ACTIVE`. Người mua đọc được *"Không thể COMMIT một đơn giữ hàng đang ở trạng thái EXPIRED"*,
  thay vì "hết thời gian giữ hàng".

**2. Nguyên nhân**

Logic "đơn đã hết hạn chưa" bị AI viết **lặp lại ở 2 nơi** (`InventoryEngine.apply()` và bước kiểm tra trước của `CheckoutEngine.checkout()`),
và cả hai chỉ xét trường hợp `ACTIVE && now >= expiresAt`. Trường hợp đơn đã ở trạng thái `EXPIRED` thì rơi xuống nhánh lỗi chung.

**3. Cách tái hiện**

Giữ 1 sản phẩm, bấm thanh toán, rồi để khóa hết hạn (`vi.advanceTimersByTime(LOCK_MS)`) trước khi thanh toán xong.
Test: `checkoutEngine.test.ts` → *"đua với hết hạn: khóa hết hạn trong lúc chờ thanh toán"*.

**4. Bằng chứng**

Lần 1 (test đơn vị):

```text
FAIL  src/tests/checkoutEngine.test.ts > H3-E03: thanh toán chạy đua > đua với hết hạn ...
-   "error": "RESERVATION_EXPIRED",
+   "error": "RESERVATION_NOT_ACTIVE",
```

Tôi sửa trong `InventoryEngine.apply()` và test đó xanh. Nhưng đến lúc viết test tích hợp:

```text
FAIL  src/tests/integration.test.ts > ... giữ → không thanh toán → hết hạn đúng mốc → thanh toán sau đó thất bại
-   "error": "RESERVATION_EXPIRED",
+   "error": "RESERVATION_NOT_ACTIVE",
```

Lần này lỗi nằm ở bước kiểm tra trước của `CheckoutEngine`, chỗ có cùng logic sai nhưng lần sửa đầu không đụng tới.

**5. Cách sửa**

Cả hai nơi đều coi `EXPIRED` là hết hạn:

```typescript
// inventoryEngine.ts
if (reservation.status === 'EXPIRED') {
  return failure('RESERVATION_EXPIRED', `Đơn ${id} đã hết thời gian giữ hàng`);
}

// checkoutEngine.ts
const expired =
  reservation.status === 'EXPIRED' || (reservation.status === 'ACTIVE' && this.now() >= reservation.expiresAt);
```

Ghi thêm vào `docs/ENGINE_CONTRACTS.md` §9 rằng quy tắc này áp dụng cho cả hai engine.

**6. Kết quả kiểm tra lại**

74/74 test pass. Xoá nhánh `EXPIRED` trong checkout thì test *"đơn đã bị timer chuyển sang EXPIRED: vẫn báo RESERVATION_EXPIRED"* fail (`1 failed | 9 passed`).

**Rút kinh nghiệm:** sửa lỗi thì phải tìm **mọi chỗ** có cùng logic, không chỉ chỗ test vừa báo.

---

## AI-02: Bấm "Thanh toán" 2 lần thì giao diện báo thất bại dù thanh toán vẫn đang chạy

**Task:** H3-F04  
**File:** `src/components/CheckoutPanel.tsx`

**1. Code / hành vi sai**

AI chặn bấm lặp bằng state của React:

```typescript
const canSubmit = !pending && selected !== undefined;
async function handleSubmit(event) {
  event.preventDefault();
  if (!canSubmit) return;
  setPending(true);
  setResult(await onCheckout(selected.id));
  ...
```

Khi bấm 2 lần thật nhanh, giao diện hiện **"Thất bại: Đơn này đang được thanh toán"** và nút bị bật lại,
trong khi lần thanh toán đầu vẫn đang chạy. Khoảng 1 giây sau mới chuyển thành "Thành công".

**2. Nguyên nhân**

`setPending(true)` chỉ có tác dụng ở **lần render sau**. Hai cú click xảy ra trước khi React render lại, nên cả hai đều thấy `pending = false`.
Lần click thứ 2 vào tới engine, engine trả `CHECKOUT_IN_PROGRESS` (engine chặn đúng, chỉ bán 1 suất), nhưng handler của lần 2
vẫn ghi kết quả thất bại đó lên màn hình và `setPending(false)`.

**3. Cách tái hiện**

Trong Chrome: giữ một sản phẩm, rồi gọi `click()` 2 lần liên tiếp lên nút Thanh toán (puppeteer làm vậy; bấm double-click thật nhanh cũng được).

**4. Bằng chứng**

Log smoke test trước khi sửa:

```text
checkout pending: Thất bại: Đơn này đang được thanh toán
checkout: Thành công: đã thanh toán 1.911.000 ₫ cho đơn R-0001.
```

Test đơn vị của engine không thấy lỗi này, vì engine hoạt động đúng; lỗi nằm ở giao diện.

**5. Cách sửa**

Dùng `useRef` làm cờ **đồng bộ** (đổi ngay, không chờ render):

```typescript
const submitting = useRef(false);
...
if (!canSubmit || submitting.current) return;
submitting.current = true;
...
finally {
  submitting.current = false;
  setPending(false);
}
```

**6. Kết quả kiểm tra lại**

Smoke test sau khi sửa: `checkout pending: Đang xử lý thanh toán…`, rồi `Thành công`, kho ghi `Đã bán 1`.
Giới hạn: phần này chưa có test tự động (WBS không có task test UI), chỉ có bằng chứng từ trình duyệt.

---

## AI-03: Đơn giữ hàng của "khách khác" hiện trong mục "Đơn giữ hàng của bạn"

**Task:** H3-A02 (contract), lộ ra ở H3-F03/F04  
**File:** `src/contracts/reservation.ts`, `src/App.tsx`, `src/simulation/concurrentRequests.ts`

**1. Code / hành vi sai**

Contract `Reservation` do AI định nghĩa không có thông tin **đơn này của ai**. Panel "Đơn giữ hàng của bạn" hiển thị toàn bộ
`engine.getReservations()`. Sau khi bấm "Cho 20 khách tranh mua", đơn của khách mô phỏng hiện lẫn vào danh sách của người dùng.
Người dùng còn có thể **hủy hoặc thanh toán hộ** đơn của người khác, và nhận thông báo *"Đơn R-0002 đã hết 30 giây giữ hàng"* cho một đơn không phải của mình.

**2. Nguyên nhân**

Lúc thiết kế contract, AI chỉ nghĩ tới 1 người dùng. Khi thêm phần mô phỏng nhiều khách dùng chung engine, contract không đủ thông tin để phân biệt.

**3. Cách tái hiện**

Chờ sale mở, giữ 1 sản phẩm, bấm "Cho 20 khách tranh mua" trên cùng sản phẩm, rồi chờ 30 giây.

**4. Bằng chứng**

Log smoke test trước khi sửa: thông báo hết hạn là của **R-0002**, đơn do khách mô phỏng giữ, trong khi đơn của người dùng là R-0001 và R-0003:

```text
competition FS-004: Giữ được: 1 · Hết hàng: 19 · ...
after lock expiry: Đơn R-0002 đã hết 30 giây giữ hàng, sản phẩm đã trả về kho. | stock FS-001: Còn lại4/5Đang được giữ1Đã bán0
```

**5. Cách sửa**

Thêm `customerId` vào contract (`ReserveRequest` và `Reservation`). Engine lưu lại, phần mô phỏng dùng `khach-N`,
người dùng là `ban`, và `App.tsx` lọc `reservations.filter((r) => r.customerId === ME)` trước khi đưa vào các panel.
Nhờ có contract, TypeScript báo lỗi ngay ở mọi nơi gọi `reserve()` còn thiếu `customerId`, nên không sót chỗ nào.

**6. Kết quả kiểm tra lại**

Smoke test sau khi sửa: danh sách chỉ có đơn của người dùng, thông báo hết hạn là của đơn R-0003 (của người dùng), kho về `5/5`.
Thêm test *"đơn của khách mô phỏng mang customerId riêng"*. Riêng phần lọc trong `App.tsx` chưa có test tự động.

---

## AI-04: Test không phát hiện khi engine quên báo cho giao diện lúc đơn hết hạn

**Task:** H3-D04  
**File:** `src/tests/lockExpiry.test.ts`, `src/engines/inventoryEngine.ts`

**1. Code / hành vi sai**

AI viết 9 test cho phần hết hạn khóa và tất cả đều xanh. Tôi thử xoá lệnh `this.publish()` sau khi hết hạn
(tức là engine vẫn trả hàng về kho nhưng không báo cho ai):

```text
expireDue không publish => Tests  65 passed (65)
hết hạn lười không publish => Tests  65 passed (65)
```

Test vẫn **xanh hoàn toàn**. Nếu lỗi này lọt vào thật, giao diện sẽ không biết đơn đã hết hạn: vẫn hiện "Đang giữ" và số tồn kho cũ.

**2. Nguyên nhân**

Mọi test đều kiểm tra kho qua hàm hỗ trợ `record()`, tức là đọc `engine.getRecord()` (dữ liệu bên trong engine).
Nhưng React lại đọc `getSnapshot()` và chờ `subscribe()` báo. Snapshot chỉ được làm mới trong `publish()`.
Test kiểm tra một con đường dữ liệu khác với con đường giao diện thật sự dùng.

**3. Cách tái hiện**

Xoá `if (expired > 0) this.publish();` trong `expireDue()` rồi chạy `npx vitest run`.

**4. Bằng chứng**

Output ở mục 1.

**5. Cách sửa**

Thêm test *"hết hạn (do timer hoặc do thao tác) đều báo cho subscriber và cập nhật snapshot mà React đọc"*,
kiểm tra cả `listener` lẫn `getSnapshot()` / `getReservations()` cho hai cách hết hạn.

**6. Kết quả kiểm tra lại**

Xoá `publish()` ở từng chỗ thì test mới fail (`1 failed | 65 passed`). Code đúng: pass.

---

## AI-05: Test "hủy timer trong onTick" không phát hiện frame thừa

**Task:** H3-B02  
**File:** `src/tests/timerEngine.test.ts`, `src/engines/timerEngine.ts`

**1. Code / hành vi sai**

Trong `createDeadlineTimer` có một dòng kiểm tra sau `onTick`:

```typescript
onTick(remaining);
if (stopped) return;   // onTick có thể tự hủy timer
```

Xoá dòng này đi thì cả 11 test timer vẫn xanh:

```text
không kiểm tra hủy sau onTick => Tests  11 passed (11)
```

Thiếu dòng này, nếu code gọi `cancel()` ngay trong `onTick` (ví dụ: dừng đồng hồ khi sale mở), timer vẫn lên lịch thêm **một frame thừa** sau khi đã hủy.

**2. Nguyên nhân**

Test chỉ đếm số lần `onTick` được gọi. Frame thừa đó gặp `if (stopped) return` ở **đầu** hàm `tick` nên không gọi `onTick`,
và số lần gọi vẫn đúng. Test không kiểm tra **có còn frame nào trong hàng chờ** ngay sau khi hủy hay không.

**3. Cách tái hiện**

Xoá dòng `if (stopped) return;` ngay sau `onTick(remaining)` rồi chạy `npx vitest run src/tests/timerEngine.test.ts`.

**4. Bằng chứng**

Output ở mục 1.

**5. Cách sửa**

Sửa test, kiểm tra hàng chờ frame ngay sau frame có lệnh hủy:

```typescript
h.frame();
// Kiểm tra NGAY sau frame đó: không được còn frame nào trong hàng chờ
expect(h.pending.size).toBe(0);
```

**6. Kết quả kiểm tra lại**

Xoá dòng kiểm tra thì test fail (`1 failed | 10 passed`). Code đúng: pass.

---

## Đã kiểm tra nhưng KHÔNG tính là lỗi

| Hiện tượng | Vì sao không tính |
|---|---|
| Template Vite mới dùng TypeScript 7 và oxlint thay vì ESLint | Do template chính thức, không phải AI chọn. Không có xung đột phiên bản. |
| Test tích hợp bị timeout lần đầu | Lỗi của chính test: chỉ cho fake timer chạy 100 ms trong khi 15 khách, mỗi khách thử tối đa 4 lần, cần khoảng 220 ms. Không phải lỗi code. |
| Ảnh 375px hiện "Sắp mở bán", Tab bỏ qua ô số lượng | Puppeteer tải lại trang khi bật chế độ điện thoại, nên engine mới được tạo và sale chưa mở, các ô bị `disabled`. Kiểm tra lại trên desktop thì thứ tự Tab đúng. |
| Xoá `if (stopped) return` đầu `cancel()`, xoá `stopped = true` khi hoàn thành: test vẫn xanh | Không quan sát được: các field đã ở trạng thái cuối nên gọi lại không làm gì thêm. |
| Đổi bộ lọc `customerId` trong `App.tsx`: test vẫn xanh | Đúng là chưa có test tự động cho UI (ghi trong README). Đây là giới hạn đã biết, không phải lỗi đang tồn tại. |

## Tổng kết

| Mã | Lỗi | Phát hiện bằng | Trạng thái |
|---|---|---|---|
| AI-01 | Hết hạn bị báo 2 lý do khác nhau, lần sửa đầu sót một chỗ | Test đơn vị + test tích hợp | Đã sửa, PASS |
| AI-02 | Bấm thanh toán 2 lần → báo thất bại sai | Chạy thử trong Chrome | Đã sửa, kiểm chứng trên Chrome |
| AI-03 | Đơn của khách khác lẫn vào đơn của người dùng | Chạy thử trong Chrome | Đã sửa, PASS + Chrome |
| AI-04 | Test không phát hiện engine quên báo cho UI khi hết hạn | Xoá code, chạy lại test | Đã sửa test, PASS |
| AI-05 | Test không phát hiện frame thừa sau khi hủy timer | Xoá code, chạy lại test | Đã sửa test, PASS |

**5 lỗi thật** (đề yêu cầu ít nhất 3).
