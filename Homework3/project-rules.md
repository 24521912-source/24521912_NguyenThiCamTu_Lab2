# Project Rules — Homework 3: Flash Sale 11.11

**Môn:** Web Application Development 2026 — UIT, ĐHQG-HCM  
**Bài:** Lab 02 — Homework 3: High-Concurrency Flash-Sale E-Commerce Engine  
**Bối cảnh:** mô phỏng flash sale nửa đêm 11.11 ở Việt Nam  
**Stack tôi chọn:** React + TypeScript + Vite

Đây là các quy tắc tôi đặt ra cho Homework 3 (và cho AI khi nhờ hỗ trợ).

---

## 1. Yêu cầu của thầy

1. Đồng hồ đếm ngược **không bị trôi**, tính bằng `Date.now()` so với một mốc thời gian tuyệt đối.
2. **Giữ hàng kiểu optimistic locking.**
3. **Máy trạng thái** cho giữ hàng, hết hạn khóa và thanh toán.
4. `AI_FAILURE_AUDIT.md` có **ít nhất 3 lỗi AI thật**.
5. **Ít nhất 8 commit** theo Conventional Commits.

Ngoài ra bài phải: chạy đúng khi nhiều người mua cùng lúc, xử lý bất đồng bộ an toàn, có dọn dẹp và báo lỗi rõ ràng.
Mọi thứ làm thêm phải ghi rõ là **thiết kế** hay **tùy chọn**, không được coi là yêu cầu của thầy.

### Nguồn yêu cầu

Thứ tự ưu tiên: yêu cầu của thầy → contract đã chốt → file này → `TASK_DECOMPOSITION.md` → kinh nghiệm chung.
Không bịa tiêu chí chấm, không tự mở rộng phạm vi bài.

---

## 2. Cách làm việc

1. **Chia nhỏ:** mỗi task có mã, mục tiêu, đầu ra, điều kiện trước, tiêu chí đạt, cách kiểm tra và tên commit.
2. **Contract trước:** kiểu dữ liệu, ai sở hữu state, các chuyển trạng thái hợp lệ, cách xử lý lỗi, đơn vị thời gian, bất biến kho, bảo đảm khi chạy đồng thời.
3. **Mỗi lần một task:** không gộp timer, kho, thanh toán và giao diện vào một lần; không sửa sang module không liên quan.
4. **Tự kiểm tra:** `tsc`, lint, build, test, xem diff. Chỉ khi đã chạy thật mới được nói là pass.

Code phải đầy đủ: không `TODO`, không "phần còn lại giữ nguyên", không dùng pseudocode thay code thật.

---

## 3. Công nghệ

Dùng: React, TypeScript, Vite, npm, Git, HTML5 ngữ nghĩa, CSS hiện đại, API thời gian có sẵn của trình duyệt, Promise và async/await.

Không dùng nếu chưa cân nhắc kỹ: jQuery, Bootstrap, Tailwind, thư viện đếm ngược, thư viện quản lý kho, thư viện UI hay quản lý state không cần thiết, CDN ngoài.

Công cụ test chỉ dùng khi dev (ví dụ Vitest) thì được, nếu có lý do rõ ràng.

---

## 4. Kiến trúc

| Phần | Lo việc gì |
|---|---|
| Timer engine | Mốc tuyệt đối, thời gian còn lại, báo tick, dừng và dọn dẹp |
| Inventory engine | Tồn kho, tạo đơn giữ hàng, định danh đơn, khóa hàng, hết hạn, hủy, giữ bất biến kho |
| Checkout | Chuyển trạng thái thanh toán hợp lệ, thành công hoặc thất bại, chặn thanh toán 2 lần |
| React UI | Hiển thị sản phẩm, đồng hồ, đơn giữ hàng, kết quả thanh toán, lỗi; gửi thao tác của người dùng |
| Test | Kiểm tra cố định (lặp lại được) cho timer, chuyển trạng thái, tranh mua, hết hạn, đua thanh toán, bất biến |

**React không được tự sửa số tồn kho.** Không viết một component khổng lồ chứa hết logic nghiệp vụ.

---

## 5. Đồng hồ không trôi

Ý tưởng mẫu của thầy:

```typescript
export function createAntiDriftTimer(durationMs: number, onTick: (remaining: number) => void) {
  const targetTime = Date.now() + durationMs;
  let rafId: number;

  function tick() {
    const remaining = Math.max(0, targetTime - Date.now());
    onTick(remaining);
    if (remaining > 0) {
      rafId = requestAnimationFrame(tick);
    }
  }

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}
```

- Luôn tính `remaining = Math.max(0, targetTime - Date.now())`. **Không trừ dần** một khoảng cố định, không coi `setInterval` là đồng hồ chính xác.
- Mọi giá trị thời gian đều tính bằng **mili giây**; không trộn giây với mili giây.
- Không bao giờ âm; chạm đúng 0 thì dừng.
- Hủy được; đã hủy thì không còn tick nào; không tạo hai vòng lặp.
- `requestAnimationFrame` sẽ ngừng khi tab bị ẩn. Độ chính xác đến từ **mốc tuyệt đối**, không đến từ số lần callback được gọi.
  Người dùng chỉnh giờ máy thì `Date.now()` đổi theo; không được nói là đồng bộ với giờ server.
- Không cập nhật React theo từng frame; chỉ cập nhật khi con số hiển thị thay đổi (ví dụ mỗi giây).

---

## 6. Dữ liệu flash sale

- Kịch bản hư cấu: Mega Sale 11.11, hàng điện tử và đồ gia dụng.
- Mỗi sản phẩm có: mã, tên tiếng Việt, giá gốc, giá sale, tổng tồn kho, số còn lại, số đang giữ, số đã bán.
- Giá hiển thị theo định dạng tiền Việt (`111.000 ₫`).
- Dữ liệu cố định, không random, để test lặp lại được. Không có thông tin thanh toán thật.

---

## 7. Kho hàng

Bất biến luôn phải đúng:

```text
totalStock = availableStock + reservedStock + soldStock
```

Mọi số lượng là **số nguyên không âm**.

### 7.1 An toàn kho

- Kho chỉ có **một chủ sở hữu** là inventory engine. Bên ngoài chỉ đọc được bản sao chỉ-đọc (snapshot), sửa bản sao đó không ảnh hưởng tới kho thật.
- Mỗi thao tác chỉ **chuyển hàng giữa các ngăn**, không làm hàng tự sinh ra hay biến mất:
  giữ hàng (còn lại → đang giữ), hủy hoặc hết hạn (đang giữ → còn lại), thanh toán (đang giữ → đã bán).
- Từ chối số lượng sai (không phải số nguyên, nhỏ hơn 1, vượt giới hạn mỗi đơn) và sản phẩm không tồn tại.
- Không bao giờ bán lố trong phạm vi một engine.

### 7.2 Optimistic locking

- Mỗi sản phẩm có `version`, **tăng 1 sau mỗi thay đổi thành công**.
- Yêu cầu giữ hàng gửi kèm `expectedVersion`, tức là version mà người mua đang nhìn thấy. Khác version hiện tại thì báo `VERSION_CONFLICT` và **không thay đổi gì**.
- Việc so version, kiểm tra tồn kho và cập nhật phải nằm trong **một bước đồng bộ** (không có `await` ở giữa), để không request nào chen vào được.
- Nếu có thử lại thì **phải có giới hạn** số lần.

---

## 8. Máy trạng thái giữ hàng và thanh toán

```text
ACTIVE ──thanh toán──► COMMITTED
       ──hủy─────────► CANCELLED
       ──hết hạn─────► EXPIRED
```

- Đơn mới luôn bắt đầu ở `ACTIVE`. Ba trạng thái còn lại là **trạng thái cuối**, không quay về `ACTIVE`.
- Chuyển trạng thái không hợp lệ thì trả lỗi rõ ràng, ví dụ: thanh toán 2 lần, hủy sau khi đã thanh toán, hết hạn sau khi đã thanh toán, hủy 2 lần.
- Hàng chỉ được trả về kho **đúng một lần**.

### 8.1 Hết hạn khóa

- Mỗi đơn có hạn giữ hàng là **mốc tuyệt đối** `expiresAt`. Đơn còn hiệu lực khi `now < expiresAt`; đúng bằng `expiresAt` là đã hết hạn.
- Timer hết hạn chạy trễ cũng **không được kéo dài** thời gian giữ hàng. Mỗi thao tác lên đơn phải tự kiểm tra lại hạn.
- Thanh toán **kiểm tra lại hạn và trạng thái ngay lúc chốt đơn**. Hết hạn hoặc bị hủy trong lúc chờ thanh toán thì thanh toán thất bại, không bán ra hàng nào.
- Timer phải hủy được, dọn được; callback chạy muộn không được làm hỏng trạng thái mới.

### 8.2 Nhiều người mua cùng lúc

- Mô phỏng nhiều request gần như cùng lúc bằng Promise và async/await, có độ trễ giả lập.
- Kết quả phải cho thấy: không bán lố, không thanh toán trùng, các lỗi bất đồng bộ được xử lý (không có unhandled rejection).
- Chỉ bảo đảm trong **một tab, một engine**. Không nói là đã nhất quán kiểu hệ thống phân tán.

---

## 9. Giao diện

- Đúng một `h1`, HTML ngữ nghĩa, chủ đề 11.11.
- Hiển thị sản phẩm, giá, tồn kho, đồng hồ (sắp mở / đang mở / đã kết thúc), đơn giữ hàng, kết quả thanh toán.
- Thông báo lỗi và thành công dễ hiểu, không chỉ dựa vào màu; screen reader không bị đọc liên tục theo từng giây của đồng hồ.
- Điều khiển được bằng bàn phím, thấy rõ focus, contrast đạt WCAG 2.2 AA, dùng được ở 375px, tôn trọng `prefers-reduced-motion`.
- Chặn bấm thanh toán nhiều lần. Không thu thập thông tin thanh toán thật.

---

## 10. Test

Test phải cố định (dùng đồng hồ giả, không phụ thuộc thời gian thật), gồm:

- timer: mốc tuyệt đối, frame bị trễ, chạm 0, hủy, đổi giờ máy;
- máy trạng thái: chuyển hợp lệ, không hợp lệ, trạng thái cuối;
- kho: giữ hàng, hết hàng, sai version, số lượng sai, hủy, hủy 2 lần, bất biến;
- hết hạn: đúng mốc, timer chạy trễ, không trả hàng 2 lần, không hết hạn ngược sau khi đã thanh toán;
- thanh toán và tranh mua: đua với hết hạn, đua với hủy, bấm nhiều lần, nhiều khách cùng một version;
- tích hợp cả vòng: mở sale → giữ → thanh toán / hủy / hết hạn → đóng sale.

## 11. Git

Ít nhất **8 commit thật** theo Conventional Commits, mỗi commit một việc, ví dụ `feat(timer): ...`, `feat(inventory): ...`, `test(concurrency): ...`.
Không tạo commit rỗng hoặc commit chỉ đổi chút ít cho đủ số. Trước khi nộp, working tree phải sạch.

## 12. AI Failure Audit

Ít nhất **3 lỗi thật**. Mỗi lỗi có: mã lỗi, code/hành vi sai, nguyên nhân, cách phát hiện, bằng chứng (test hoặc DevTools), cách sửa, kết quả kiểm tra lại.
Ghi lỗi ngay trong lúc làm, đừng đợi đến cuối mới nhớ lại. Lỗi cố ý cài vào thì không tính.

## 13. Chuẩn bị vấn đáp

Phải tự giải thích và sửa được: `Date.now()`, mốc tuyệt đối, vì sao `setInterval` bị trôi, `requestAnimationFrame` khi tab bị ẩn,
bất biến kho, optimistic locking, vì sao kiểm tra và cập nhật phải đi cùng nhau, máy trạng thái, hết hạn khóa, Promise và event loop,
race condition, idempotence, React hooks và cleanup, cách viết commit.

---

## 14. Definition of Done

- [ ] Contract và bất biến đã ghi lại; `tsc`, lint, build, test đều pass
- [ ] Đồng hồ dùng mốc tuyệt đối, không trôi, không âm, hủy được
- [ ] Kho có version; optimistic locking chạy đúng; không bán lố; bất biến luôn đúng
- [ ] Máy trạng thái chặn chuyển sai; hủy và hết hạn trả hàng đúng một lần; thanh toán kiểm tra lại hạn
- [ ] Không thanh toán trùng; đã test các tình huống đua
- [ ] Giao diện 11.11 dùng được bằng bàn phím, ở 375px, thông báo rõ ràng
- [ ] Ít nhất 8 commit thật; audit có ít nhất 3 lỗi thật; README đúng với code
- [ ] Tự giải thích và sửa được code

---

**Tóm lại:** làm từng việc nhỏ, contract trước, thời gian tính từ mốc tuyệt đối, kho chỉ có một chủ sở hữu,
không bịa kết quả test. AI hỗ trợ viết code; tôi là người kiểm tra và chịu trách nhiệm.
