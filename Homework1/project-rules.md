# Project Rules — Homework 1: Enterprise Data-Grid

**Môn:** Web Application Development 2026 — UIT, ĐHQG-HCM  
**Bài:** Lab 02 — Homework 1  
**Mục tiêu:** WCAG 2.2 AA, Lighthouse Accessibility 100 và Best Practices 100

Đây là các quy tắc tôi đặt ra cho chính mình (và cho AI khi nhờ hỗ trợ) trong suốt quá trình làm bài.
Mục đích là để bài làm đi đúng yêu cầu, từng bước một, và lúc vấn đáp tôi giải thích được mọi dòng code.

---

## 1. Làm cái gì

Một DataGrid dùng lại được, viết bằng React + TypeScript, có:

- contract TypeScript generic (`ColumnDef<T>`, `DataGridProps<T>`);
- sắp xếp, lọc, phân trang, chọn dòng;
- bảng HTML đúng ngữ nghĩa và ARIA grid;
- điều hướng bằng bàn phím, quản lý focus rõ ràng;
- đạt WCAG 2.2 AA, chạy tốt ở màn hình 375px;
- điểm Lighthouse đo thật, không tự ghi.

Không thêm tính năng nào mà đề không cần.

### Nguồn yêu cầu

Thứ tự ưu tiên khi có mâu thuẫn:

1. Yêu cầu của thầy.
2. Contract TypeScript đã chốt.
3. File quy tắc này.
4. `TASK_DECOMPOSITION.md`.
5. Kinh nghiệm làm nghề nói chung.

Không tự bịa thêm tiêu chí chấm. Cái gì là yêu cầu bắt buộc, cái gì là tôi tự chọn thêm thì ghi rõ.

---

## 2. Cách làm việc: 4 bước

1. **Chia nhỏ:** mỗi task chỉ làm một việc, kiểm tra được riêng.
2. **Contract trước, code sau:** trước khi viết module nào thì phải rõ đầu vào, đầu ra, trường hợp biên và cách kiểm tra.
3. **Làm từng task một:** không làm cả bài trong một lần, không sửa lan sang module không liên quan, không tự thêm thư viện.
4. **Tự kiểm tra:** xem diff, chạy `tsc`, chạy test, đối chiếu tiêu chí. Xong mới commit.

Code trông "có vẻ đúng" thì chưa phải là đúng; phải chạy thử mới biết.

---

## 3. Tài liệu cần có

- `project-rules.md`: file này.
- `TASK_DECOMPOSITION.md`: danh sách task. Mỗi task có mã, mục tiêu, đầu ra, điều kiện trước, tiêu chí đạt, cách kiểm tra và tên commit.
- Ghi chép kiểm chứng khi cần: đã test gì, kết quả thật ra sao, cái gì chưa kiểm tra.
- `AI_FAILURE_AUDIT.md`: lỗi AI gây ra mà tôi bắt được. Chỉ ghi lỗi thật.

---

## 4. Công nghệ

Dùng: React, TypeScript, Vite, HTML5 ngữ nghĩa, CSS hiện đại, API có sẵn của trình duyệt, Git.

Không dùng: jQuery, Bootstrap, Tailwind, thư viện DataGrid có sẵn, CDN ngoài, thư viện quản lý state không cần thiết.

Công cụ test và lint thì được thêm, nhưng phải có lý do. Trước khi cài gói nào, tự hỏi: API gốc có làm được không? Có gói nhỏ hơn không?

---

## 5. Contract của thầy (giữ nguyên)

```typescript
export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  sortable?: boolean;
}

export interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowSelect?: (item: T) => void;
  ariaLabel: string;
}
```

- Không đổi ý nghĩa, không thay contract một cách âm thầm.
- `accessorKey` dùng `keyof T`. Không dùng `any`, không ép kiểu để né lỗi.
- Nếu cần mở rộng (định danh dòng, cấu hình phân trang...) thì phải có lý do, phải tương thích với bản gốc và phải có test.
- Grid không được biết gì về dữ liệu sinh viên (`studentId`, `gpa`...). Dữ liệu sinh viên chỉ dùng cho trang demo.

---

## 6. Kiến trúc

- Tách riêng: dữ liệu demo, contract, hàm xử lý dữ liệu, phần render, logic bàn phím, CSS và test.
- Function component; props là bất biến; không mutate mảng `data`.
- Thứ tự xử lý luôn là: **Dữ liệu gốc → Lọc → Sắp xếp → Phân trang → Dòng hiển thị**.
- Dòng được chọn gắn với **bản ghi**, không gắn với vị trí trên màn hình.
- Chỉ chạm DOM trực tiếp khi thật sự cần, ví dụ để chuyển focus.
- Không tối ưu sớm khi chưa có số liệu chứng minh.

---

## 7. HTML

- `lang`, UTF-8, meta viewport; đúng một `h1`; có landmark và skip link.
- Dùng `table`, `thead`, `tbody`, `th`, `td` thật, không dùng chồng `div` để giả bảng.
- Ô tìm kiếm có `label` hiển thị; không dùng placeholder thay cho label.
- Hành động thì dùng `button` thật.

---

## 8. Chức năng của grid

**Sắp xếp:** chỉ áp dụng cho cột `sortable`; có tăng dần và giảm dần; số so sánh theo số, chuỗi so sánh theo locale; không đụng vào mảng gốc.

**Lọc:** không phân biệt hoa thường, xử lý đúng tiếng Việt có dấu; không có kết quả thì báo rõ ràng.

**Phân trang:** cắt đúng trang; trang cuối thiếu dòng vẫn đúng; dữ liệu rỗng vẫn đúng; lọc xong thì không còn trang nào không hợp lệ.

**Chọn dòng:** chọn và bỏ chọn được; sort xong vẫn đúng bản ghi; giữ nguyên chữ ký `onRowSelect`; không gọi callback thừa.

**Trường hợp biên:** dữ liệu rỗng, lọc không ra kết quả, bảng chỉ có 1 dòng, giá trị bị thiếu, dữ liệu thay đổi, bản ghi đang chọn bị xoá.

---

## 9. Accessibility (bắt buộc, không phải "trang trí")

**ARIA grid:** `role="grid"`, `row`, `gridcell`, column header, `aria-sort`, `aria-selected`. Mọi giá trị ARIA phải đúng với trạng thái thật.

**Bàn phím:**

| Phím | Hành vi |
|---|---|
| ↑ ↓ ← → | Di chuyển focus giữa các ô |
| Enter | Chọn dòng đang focus |
| Space | Bật/tắt chọn dòng đang focus |
| Tab / Shift+Tab | Vào và ra khỏi grid, không bị kẹt |

**Focus:** dùng roving tabindex; luôn thấy rõ viền focus; không có keyboard trap; sau khi sort, lọc hay đổi trang thì focus vẫn ở chỗ hợp lý; không đụng tới cách bàn phím hoạt động bên trong ô input.

**Screen reader:** đọc được tên grid, tiêu đề cột, trạng thái sort, trạng thái chọn, số kết quả và các thông báo; không đọc lặp lại quá nhiều.

**Thị giác:** chữ thường có contrast ≥ 4.5:1; không dùng riêng màu sắc để thể hiện trạng thái; zoom lớn vẫn dùng được; tôn trọng `prefers-reduced-motion`.

Điểm của công cụ tự động không chứng minh được toàn bộ WCAG. Vẫn phải tự thử bằng bàn phím và screen reader.

---

## 10. CSS và responsive

- Thiết kế cho 375px trước, rồi mới mở rộng lên tablet và desktop.
- Dùng Flexbox và Grid, đơn vị tương đối. Bảng rộng thì cho cuộn ngang trong vùng của bảng, không làm cả trang cuộn ngang.
- Màu, khoảng cách, font, viền và focus khai báo bằng biến trong `:root`.
- Hạn chế style inline và `!important`; không để layout bị nhảy khi nội dung thay đổi.

---

## 11. Viết code

- Dùng `const`, không dùng `var`; dùng `event.key`, không dùng `keyCode` hay `keypress`.
- Hàm ngắn, làm một việc; ưu tiên hàm thuần; xử lý `null`/`undefined` có chủ đích.
- Comment bằng tiếng Việt, chỉ ở những chỗ khó hiểu; không viết comment lặp lại đúng điều code đã nói.

---

## 12. Bảo mật

- Không dùng `innerHTML` hay `dangerouslySetInnerHTML` với dữ liệu không tin được; để React tự render chữ.
- Dữ liệu demo là hư cấu; không có secret trong code frontend.
- Kiểm tra `package.json` và lockfile trước khi commit.

---

## 13. Hiệu năng và Lighthouse

- Đúng trước, nhanh sau. Không làm virtual scrolling hay memo phức tạp khi chưa cần.
- Thầy yêu cầu Lighthouse **Accessibility 100** và **Best Practices 100**. Phải đo thật trong trình duyệt; không bao giờ tự điền điểm.

---

## 14. Kiểm tra

Cần kiểm tra: sắp xếp, lọc, phân trang, chọn dòng, phối hợp các thao tác, trường hợp biên, không mutate input, TypeScript, DOM, console, accessibility tree, bàn phím và responsive.

Chỉ dùng 4 trạng thái: `PASS` (đã chạy và đạt), `FAIL` (đã chạy và trượt), `NOT VERIFIED` (chưa chạy hoặc thiếu bằng chứng), `NOT APPLICABLE` (không áp dụng).

---

## 15. Git

- Mỗi commit là một việc, đặt tên theo Conventional Commits, ví dụ `feat(grid): implement column sorting`.
- Trước khi commit: xem `git status` và `git diff`, chạy kiểm tra, không đưa file thừa vào.
- Không viết lại lịch sử, không force-push, không dựng lịch sử giả.

---

## 16. AI Failure Audit

Mỗi lỗi ghi: mô tả, hành vi sai, nguyên nhân, cách phát hiện, cách sửa, kết quả kiểm tra lại. Chỉ ghi lỗi có thật, không bịa thêm cho đủ số.

---

## 17. Chuẩn bị vấn đáp

Phải tự giải thích và sửa được: HTML ngữ nghĩa, box model, responsive, generics và `keyof T`, props/state, dữ liệu dẫn xuất,
thuật toán sort, lọc, phân trang, định danh dòng, ARIA grid, roving tabindex, sự kiện bàn phím, focus, chống XSS, đọc git diff.

---

## 18. Definition of Done

- [ ] Contract generic đúng như thầy cho
- [ ] Sort, lọc, phân trang, chọn dòng chạy đúng
- [ ] Bảng đúng ngữ nghĩa, ARIA grid đúng
- [ ] Phím mũi tên, Enter, Space hoạt động; focus ổn định; không có keyboard trap
- [ ] Đã thử với screen reader; đã rà các tiêu chí WCAG 2.2 AA
- [ ] Dùng được ở 375px; không còn lỗ hổng XSS
- [ ] `tsc`, build và test đều pass
- [ ] Lighthouse Accessibility 100 và Best Practices 100 (đo thật)
- [ ] Commit nhỏ, rõ ràng; `TASK_DECOMPOSITION.md` khớp với tiến độ thật
- [ ] Ghi rõ những gì chưa kiểm chứng được
- [ ] Tự giải thích và sửa được code

Mục nào chưa có bằng chứng thì ghi đúng là chưa có, không đánh dấu cho đẹp.

---

**Tóm lại:** làm từng việc nhỏ, contract trước, accessibility là bắt buộc, không chèn HTML không an toàn,
không dùng API bàn phím đã lỗi thời, kiểm tra xong mới commit, không bịa kết quả test hay điểm Lighthouse.
AI chỉ hỗ trợ viết code; người chịu trách nhiệm kiểm tra cuối cùng là tôi.
