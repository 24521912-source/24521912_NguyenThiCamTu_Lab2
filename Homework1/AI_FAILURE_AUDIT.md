# AI Failure Audit — Homework 1: Enterprise Data-Grid

Ghi lại những chỗ AI làm sai (hoặc suýt làm sai) trong lúc phát triển Homework 1.
Mỗi mục đều có cách tái hiện lại được, không có mục nào viết cho đủ số lượng.
Phần nào chưa kiểm chứng thì mình ghi rõ là chưa kiểm chứng.

**Giai đoạn đã audit:** A04 → I04 (test infrastructure, data logic, DataGrid component, accessibility, Lighthouse)  
**Ngày:** 29/10/2026

---

## Lỗi 1: Test "so sánh số" pass kể cả khi đã xoá code so sánh số

**File:** `src/utils/sortRows.ts`, `src/utils/sortRows.test.ts` (task B01)

Hàm `compareValues` có một nhánh riêng cho số:

```typescript
if (typeof a === 'number' && typeof b === 'number') return a - b;
return collator.compare(String(a), String(b));
```

AI viết kèm test tên là *"so sánh số theo giá trị số, không theo chuỗi ("10" < "9")"*,
dữ liệu điểm là 9, 10, 2, 9. Test chạy xanh ngay lần đầu, nhìn thì có vẻ ổn.

Vì test xanh quá dễ nên mình thử xoá hẳn dòng `return a - b;` rồi chạy lại.
Kết quả: **22/22 vẫn pass**. Tức là test không hề kiểm tra cái nhánh nó tự nhận là đang kiểm tra.

**Nguyên nhân:** `Intl.Collator('vi', { numeric: true })` vốn đã so `"9" < "10"` đúng
khi gặp số nguyên, nên dù có nhánh số hay không thì kết quả vẫn giống nhau. Collator chỉ sai
khi gặp số thập phân: nó tách `"2.5"` thành 2 / . / 5 và `"2.25"` thành 2 / . / 25, rồi kết luận
`2.5 < 2.25`. Với điểm GPA thì đây là lỗi thật.

**Cách phát hiện:** sửa code cho sai một cách cố ý (mutation thủ công) rồi xem test có đỏ không.

**Sửa:** thêm test với số thập phân:

```typescript
const gpas = [{ gpa: 2.5 }, { gpa: 10 }, { gpa: 2.25 }];
// mong đợi [2.25, 2.5, 10]
```

**Kiểm chứng:**
- Có nhánh số: `npm test` → 23 passed.
- Xoá nhánh số: test thập phân **fail** (`1 failed | 22 passed`). Đúng như mong muốn.

---

## Lỗi 2: Test pipeline không phát hiện được khi sai thứ tự xử lý

**File:** `src/utils/pipeline.test.ts` (task B04)

Spec A03 bắt buộc thứ tự **Filter → Sort → Paginate**. Lỗi hay gặp nhất là sort sau khi đã
cắt trang, khi đó chỉ 5 dòng của trang hiện tại được sắp xếp chứ không phải toàn bộ.

Bản test đầu tiên AI viết chỉ kiểm tra: *dòng đầu trang 1 có điểm bằng điểm lớn nhất*.
Mình thử đổi hàm `run()` trong test thành paginate trước rồi mới sort:

```typescript
const pg = paginateRows(filterRows(rows, columns, query), page, pageSize);
return { ...pg, rows: sortRows(pg.rows, sort) };
```

Kết quả: **5/5 vẫn pass**.

**Nguyên nhân:** do dữ liệu mẫu trùng hợp. 8 dòng "Huế" có điểm theo thứ tự gốc là
7, 8, 9, 0, 1 | 2, 3, 4. Điểm cao nhất (9) đã nằm sẵn ở trang 1, nên sort trong trang hay sort
toàn bộ thì dòng đầu vẫn là 9. Test chỉ nhìn một phần tử nên không thấy khác biệt.

**Sửa:** so sánh cả trang thay vì chỉ phần tử đầu:

```typescript
expect(firstPage.rows.map((row) => row.score)).toEqual([9, 8, 7, 4, 3]);
// nếu sai thứ tự sẽ ra [9, 8, 7, 1, 0]
```

**Kiểm chứng:** thứ tự đúng → 30 passed. Thứ tự sai → `1 failed | 4 passed`.

**Rút kinh nghiệm:** cả lỗi 1 và lỗi 2 đều giống nhau, test xanh nhưng không chứng minh được gì.
Từ giờ test nào pass ngay lần đầu thì mình sẽ thử phá code xem nó có đỏ không rồi mới tin.

---

## Suýt lỗi 3: Phiên bản jsdom mới nhất không chạy được trên máy

**File:** `package.json` (task A04)

Khi chọn môi trường DOM cho test, bản mới nhất trên npm là `jsdom@30.1.3`, nhưng bản này yêu cầu
`node: ^22.22.2 || ^24.15.0 || >=26.0.0`. Máy mình đang chạy Node `v24.14.0`, không thỏa điều kiện.
Nếu cứ cài bản mới nhất thì npm sẽ báo `EBADENGINE`, và có thể lỗi khi chạy test.

Lỗi này **chưa xảy ra**, mình bắt được trước khi cài bằng:

```bash
node -v                                  # v24.14.0
npm view jsdom version engines --json     # 30.1.3 cần ^24.15.0
npm view jsdom@29 version engines --json  # 29.1.1 chỉ cần >=24.0.0
```

**Xử lý:** dùng `jsdom@^29.1.1`. Sau khi cài, `npm install` báo `found 0 vulnerabilities`
và không có cảnh báo engine. Mình còn viết một test tạm render `<p>` hai lần để chắc
`@testing-library/react` tự dọn DOM giữa các test (nếu không dọn thì lần 2 sẽ tìm thấy 2 phần tử).
Test tạm đó đã xoá, không commit.

---

## Lỗi 4: Test "sort giữ focus trên cùng bản ghi" cũng pass nhờ trùng hợp

**File:** `src/components/DataGrid.tsx`, `src/components/DataGrid.test.tsx` (task F06)

Spec A03 §8 yêu cầu: sau khi sort, tab stop của grid phải đi theo **bản ghi** đang active chứ không ở lại
**vị trí** cũ. Trong code, ô active được lưu bằng tham chiếu tới bản ghi (`active.row`), rồi mỗi lần render
mới tìm lại vị trí bằng `rows.indexOf(active.row)`.

Bản test đầu tiên: đưa focus tới dòng P03, cột Tên, bấm sort theo Giá, rồi kiểm tra tab stop vẫn ở P03.
Test pass. Mình sửa code cho sai: lưu vị trí dòng (`posRef.current = rowIndex`) thay vì bản ghi, chạy lại.
Kết quả: test đó **vẫn pass** (chỉ có 2 test khác về lọc và chuyển trang đỏ).

**Nguyên nhân:** lại là dữ liệu mẫu. Giá của P01..P05 là 5, 75, 25, 95, 45. Khi sort tăng dần trên toàn bộ
12 sản phẩm, trang 1 thành P01, P08, P03, P10, P05, và P03 tình cờ vẫn ở vị trí số 2 giống như trước khi sort.
Giữ theo vị trí hay theo bản ghi thì đều trỏ vào P03.

Đây là lần thứ hai gặp đúng kiểu lỗi của lỗi 2: dữ liệu test làm cho đáp án đúng và đáp án sai trùng nhau.

**Sửa:** dùng 5 sản phẩm đầu, focus vào P02, rồi kiểm tra thêm là P02 thật sự bị đẩy từ vị trí 1 xuống vị trí 3:

```typescript
expect(skus()).toEqual(['P01', 'P03', 'P05', 'P02', 'P04']);
expect(tabStops()[0]).toBe(cell('P02', 1));
```

**Kiểm chứng:** code đúng → 24/24 test component pass. Code lưu theo vị trí → test này **fail**
(`3 failed | 21 passed`).

---

## Suýt lỗi 5: Đọc nhầm ảnh chụp 375px thành lỗi tràn layout

**Task:** G01

Để kiểm tra mobile, mình chụp màn hình bằng `chrome --headless=new --window-size=375,900`. Trong ảnh,
khung trắng của section và ô tìm kiếm bị cắt ở mép phải, nhìn rất giống lỗi trang bị tràn ngang.
Hướng sửa đầu tiên định làm là thêm `min-width: 0` hoặc `grid-template-columns: minmax(0, 1fr)` cho `.data-grid`.

Trước khi sửa, mình để ý câu mô tả ở header xuống dòng ở khoảng 450–480px chứ không phải 375px. Như vậy trang
đang được layout rộng hơn 375px, còn ảnh thì chỉ cắt lấy 375px bên trái. Mình đo lại bằng puppeteer
`setViewport({ width: 375, isMobile: true })`:

```text
375  {"innerWidth":375,"docScroll":375,"gridBox":307,"gridScroll":576}
```

`document.scrollWidth` = 375, tức là trang **không** bị tràn. Chỉ vùng bảng cuộn ngang bên trong (576px trong
khung 307px), và đây đúng là thiết kế. Ảnh sai là do Chrome desktop có chiều rộng cửa sổ tối thiểu.

Nếu cứ sửa theo ảnh đầu thì sẽ thêm CSS không cần thiết cho một lỗi không tồn tại. Ảnh đúng nằm ở
`enterprise-data-grid/docs/evidence/mobile-375.png`.

---

## Ghi chú: lỗi `ERESOLVE` lúc khởi tạo dự án (không phải lỗi trong đợt này)

Trong thư mục dự án còn sót file `npm-error.txt` từ lúc khởi tạo (14:27, 29/10). Log cho thấy
`typescript@7.0.2` xung đột với peer dependency của `typescript-eslint@8.72.1`
(chỉ hỗ trợ `>=4.8.4 <6.1.0`).

Lỗi này đã được xử lý **trước** commit `chore: initialize React TypeScript Vite project`
(commit đó đã ghi `"typescript": "~5.9.3"`). Mình kiểm tra lại thì `npm ls` không còn lỗi,
`typecheck`, `lint`, `build` đều chạy được, nên đã xoá file log cũ đi để không lỡ commit nhầm.
Mình không chắc lúc đó phiên bản TS 7 là do AI chọn hay do template, nên không xếp vào lỗi AI.

---

## Tổng kết

| # | Vấn đề | Task | Phát hiện bằng | Trạng thái |
|---|---|---|---|---|
| 1 | Test số không kiểm tra nhánh số | B01 | Xoá code, chạy lại test | Đã sửa, PASS |
| 2 | Test pipeline không bắt được sai thứ tự | B04 | Đổi thứ tự trong test, chạy lại | Đã sửa, PASS |
| 3 | jsdom mới nhất không hợp Node 24.14 | A04 | `npm view ... engines` trước khi cài | Đã tránh |
| 4 | Test sort-giữ-focus không bắt được lưu theo vị trí | F06 | Đổi sang lưu vị trí, chạy lại | Đã sửa, PASS |
| 5 | Suýt sửa CSS cho lỗi tràn không có thật | G01 | Đo `scrollWidth` bằng giả lập thiết bị | Đã tránh |

Các mutation khác mình đã thử và test **đều bắt được** (đỏ đúng như mong đợi): sort tại chỗ
thay vì `toSorted`, bỏ xử lý giá trị rỗng khi sort, bỏ `numeric` của collator, bỏ chuẩn hóa NFC,
bỏ `?? ''`, bỏ `trim()`, để `pageCount = 0` khi dữ liệu rỗng, bỏ chặn `NaN` cho số trang.
Ở phần component: bỏ `preventDefault`, lọc mà không về trang 1, không bỏ chọn khi bản ghi bị xoá,
luôn giành focus, bỏ chọn vẫn gọi `onRowSelect`, Enter thành toggle, ArrowDown vượt biên, bỏ `aria-sort`,
bỏ `aria-selected`, xoá `<label>` của ô tìm kiếm (axe báo lỗi `label`).

**Chưa kiểm chứng:**
- Đổi React key thành `rowIndex` thì test vẫn pass. Lý do là selection dựa vào tham chiếu object nên hành vi
  nhìn thấy được không đổi. Phần này chưa có test bao phủ.
- Chưa test bằng screen reader thật (NVDA) và chưa thử zoom 200%. Chi tiết trong
  `enterprise-data-grid/docs/VERIFICATION.md`.
