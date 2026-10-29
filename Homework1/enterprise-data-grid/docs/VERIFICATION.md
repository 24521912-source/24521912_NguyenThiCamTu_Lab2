# Verification Report — Enterprise Data-Grid

**Ngày kiểm tra:** 29/10/2026  
**Môi trường:** Windows 11, Node v24.14.0, Chrome 156 (headless), Vitest 5.0.5 + jsdom 29, Lighthouse 12.8.2  
**Trạng thái dùng:** `PASS` / `FAIL` / `NOT VERIFIED` / `NOT APPLICABLE` (project-rules §14.5)

## 1. Lệnh đã chạy

| Lệnh | Kết quả | Trạng thái |
|---|---|---|
| `npm run typecheck` | Không có lỗi | PASS |
| `npm run lint` | Không có lỗi | PASS |
| `npm test` | 7 test files, 57 tests passed | PASS |
| `npm run build` | Build thành công (JS 226.96 kB, gzip 71.44 kB) | PASS |
| `npx vite preview` + mở trang | HTTP 200, trang render được | PASS |

## 2. Automated tests theo task

| File | Task | Nội dung chính |
|---|---|---|
| `src/types/dataGrid.test.ts` | A02, A04 | `accessorKey` sai thì `tsc` báo lỗi (`@ts-expect-error`), kiểu của `onRowSelect` |
| `src/utils/sortRows.test.ts` | B01 | Số, số thập phân, tiếng Việt, mã "SV2/SV10", stable sort, ô rỗng nằm cuối, không mutate |
| `src/utils/filterRows.test.ts` | B02 | Hoa thường, NFC/NFD, chỉ tìm trong các cột, truy vấn rỗng, ký tự đặc biệt, `null` |
| `src/utils/paginateRows.test.ts` | B03 | Trang cuối, dữ liệu rỗng, kẹp trang ngoài biên, `NaN`, `pageSize` sai |
| `src/utils/pipeline.test.ts` | B04 | Thứ tự Filter → Sort → Paginate, không trùng hoặc sót dòng, lọc khi đang ở trang sau |
| `src/components/DataGrid.test.tsx` | C01–F06 | Cấu trúc bảng, role, empty state, sort, filter, phân trang, chọn dòng, roving tabindex, 4 phím mũi tên, Enter, Space, Tab/Shift+Tab, focus khi dữ liệu thay đổi |
| `src/a11y.test.tsx` | H01 | axe-core trên toàn trang ở 3 trạng thái: ban đầu, sau khi sort + chọn, không có kết quả |

**Test có thật sự bắt lỗi không:** sau khi test xanh, mình cố ý sửa sai từng hành vi quan trọng rồi chạy lại.
Tất cả các lần sửa sai dưới đây đều làm test đỏ:
bỏ `preventDefault`, lọc mà không về trang 1, không bỏ chọn khi bản ghi bị xoá, luôn giành focus,
bỏ chọn vẫn gọi `onRowSelect`, bỏ fallback của dòng active, Enter thành toggle, ArrowDown vượt biên,
bỏ `aria-sort`, bỏ `aria-selected`, lưu ô active theo vị trí thay vì theo bản ghi, xoá `<label>` (axe báo `label`).
Các test yếu tìm được trong quá trình này được ghi trong `../AI_FAILURE_AUDIT.md`.

**Chưa được test bao phủ:** dùng `rowIndex` làm React key thay cho vị trí trong mảng gốc. Test vẫn pass vì
hành vi nhìn thấy được không đổi (selection dựa vào tham chiếu object, không dựa vào key). Trạng thái: NOT VERIFIED bằng test.

## 3. G01 — Responsive (mobile-first)

Đo bằng Chrome giả lập thiết bị (puppeteer `setViewport`):

| Viewport | `document.scrollWidth` | Vùng bảng (khung / nội dung) | Kết quả |
|---|---|---|---|
| 375px | 375 | 307 / 576 → bảng cuộn ngang trong vùng riêng | PASS |
| 768px | 768 | 700 / 700 | PASS |
| 1280px | 1280 | 1116 / 1116 | PASS |

Ở 375px trang không bị tràn ngang; chỉ vùng bảng cuộn (project-rules §10.2 cho phép).
Ảnh chụp: `evidence/mobile-375.png`.

Ghi chú: lần đầu mình chụp bằng `chrome --window-size=375,900` thì trang trông như bị tràn.
Đo lại bằng giả lập thiết bị thì thấy đó là do Chrome desktop có chiều rộng cửa sổ tối thiểu, không phải lỗi CSS.

## 4. G02 — Focus indicator

- `:focus-visible` dùng viền `3px solid #c2410c`; với ô của bảng thì `outline-offset: -3px` để vùng cuộn không cắt mất viền.
- Trong Chrome thật: Tab vào grid, ArrowDown, Space → ô `SV002` có viền cam, dòng được chọn có nền xanh nhạt,
  chữ đậm và vạch trái. Viền focus vẫn thấy rõ khi dòng đang được chọn (xem `evidence/mobile-375.png`). **PASS**

## 5. G03 — Color contrast (công thức WCAG 2.x)

| Cặp màu | Giá trị | Tỉ lệ | Yêu cầu | Kết quả |
|---|---|---|---|---|
| Chữ chính / surface | `#1e293b` / `#ffffff` | 14.63:1 | ≥ 4.5:1 | PASS |
| Chữ chính / nền trang | `#1e293b` / `#f8fafc` | 13.98:1 | ≥ 4.5:1 | PASS |
| Chữ chính / header bảng | `#1e293b` / `#e2e8f0` | 11.87:1 | ≥ 4.5:1 | PASS |
| Chữ chính / dòng đã chọn | `#1e293b` / `#dbeafe` | 11.99:1 | ≥ 4.5:1 | PASS |
| Chữ phụ / surface | `#475569` / `#ffffff` | 7.58:1 | ≥ 4.5:1 | PASS |
| Chữ phụ / nền trang | `#475569` / `#f8fafc` | 7.24:1 | ≥ 4.5:1 | PASS |
| Chữ nút disabled / nền nút | `#475569` / `#e2e8f0` | 6.15:1 | ≥ 4.5:1 | PASS |
| Chữ nút / nền nút primary | `#ffffff` / `#1d4ed8` | 6.70:1 | ≥ 4.5:1 | PASS |
| Viền focus / surface | `#c2410c` / `#ffffff` | 5.18:1 | ≥ 3:1 | PASS |
| Viền focus / dòng đã chọn | `#c2410c` / `#dbeafe` | 4.24:1 | ≥ 3:1 | PASS |
| Viền focus / header | `#c2410c` / `#e2e8f0` | 4.20:1 | ≥ 3:1 | PASS |
| Viền focus / nút primary | `#c2410c` / `#1d4ed8` | 1.29:1 | ≥ 3:1 | Xem ghi chú |
| Viền input / surface | `#64748b` / `#ffffff` | 4.76:1 | ≥ 3:1 | PASS |
| Vạch dòng chọn / nền dòng chọn | `#1d4ed8` / `#dbeafe` | 5.49:1 | ≥ 3:1 | PASS |

Ghi chú về viền focus trên nút primary: viền có `outline-offset: 2px`, nên giữa viền và nút luôn có một khe
màu surface (`#ffffff`). Màu nằm sát viền là trắng (5.18:1), nên SC 1.4.11 vẫn đạt.
Nếu muốn viền tách biệt rõ với chính nút (SC 2.4.13, mức AAA) thì cần đổi màu, nhưng AA không yêu cầu điều này.

Lighthouse cũng kiểm tra `color-contrast` trong trình duyệt thật và không báo lỗi.

## 6. H01–H04 — Accessibility

| Task | Kiểm tra | Kết quả | Trạng thái |
|---|---|---|---|
| H01 | axe-core (jsdom) ở 3 trạng thái, tắt riêng rule `color-contrast` vì jsdom không tính được màu | 0 violations | PASS |
| H01 | Lighthouse Accessibility (Chrome thật, có `color-contrast`) | 100/100 | PASS |
| H02 | Automated keyboard tests: 4 phím mũi tên, biên, Enter, Space, Tab/Shift+Tab không trap, sort/phân trang bằng bàn phím | Pass | PASS |
| H02 | Bàn phím trong Chrome thật (puppeteer): Tab vào grid → ArrowDown → Space | Chọn đúng `SV002` | PASS |
| H02 | Người thật dùng bàn phím thao tác toàn bộ trang | Chưa làm | NOT VERIFIED |
| H03 | Screen reader (NVDA / VoiceOver) | Chưa làm | NOT VERIFIED |
| H03 | Accessibility tree qua role query trong test (`grid`, `row`, `gridcell`, `columnheader`, `aria-sort`, `aria-selected`, `status`, `navigation`) | Đúng | PASS |
| H04 | WCAG 2.2 AA checklist ở mục 7 | Một phần | Xem mục 7 |

## 7. H04 — WCAG 2.2 A/AA checklist (các tiêu chí áp dụng)

| SC | Tiêu chí | Bằng chứng | Trạng thái |
|---|---|---|---|
| 1.3.1 | Info and Relationships | `table`/`th scope="col"`/`td`, label cho input, landmarks | PASS |
| 1.3.2 | Meaningful Sequence | Thứ tự DOM = thứ tự đọc | PASS |
| 1.4.1 | Use of Color | Dòng chọn: nền + chữ đậm + vạch trái; sort: icon ▲▼ + `aria-sort` | PASS |
| 1.4.3 | Contrast (Minimum) | Mục 5 + Lighthouse | PASS |
| 1.4.10 | Reflow | 375px không tràn trang; bảng 2 chiều được phép cuộn ngang | PASS |
| 1.4.11 | Non-text Contrast | Mục 5 | PASS |
| 1.4.4 | Resize Text (200%) | Chưa zoom thử | NOT VERIFIED |
| 2.1.1 | Keyboard | Mục 6, H02 | PASS |
| 2.1.2 | No Keyboard Trap | Test Tab/Shift+Tab | PASS |
| 2.4.1 | Bypass Blocks | Skip link tới `#main` | PASS |
| 2.4.2 | Page Titled | `Enterprise Data-Grid` | PASS |
| 2.4.3 | Focus Order | Tìm kiếm → header sort → grid (1 tab stop) → phân trang | PASS |
| 2.4.6 | Headings and Labels | `h1`, `h2`, label "Tìm kiếm" | PASS |
| 2.4.7 | Focus Visible | Mục 4 | PASS |
| 2.4.11 | Focus Not Obscured (Minimum) | Không có phần tử sticky/overlay | PASS |
| 2.5.8 | Target Size (Minimum) | Nút phân trang và input cao 44px; nút sort ≥ 24px | PASS |
| 3.1.1 | Language of Page | `<html lang="vi">` | PASS |
| 3.2.2 | On Input | Gõ tìm kiếm chỉ lọc dữ liệu, không chuyển trang hay đổi focus | PASS |
| 3.3.2 | Labels or Instructions | Label + hướng dẫn phím (`aria-describedby`) | PASS |
| 4.1.2 | Name, Role, Value | axe + role tests | PASS |
| 4.1.3 | Status Messages | `role="status"` cho số kết quả và lần chọn gần nhất | PASS |
| 2.2.x, 2.3.x, 1.2.x | Timing, flashing, media | Không có nội dung loại này | NOT APPLICABLE |

Automated tools không đủ để chứng minh toàn bộ WCAG (project-rules §9.6), vì vậy H04 **chưa thể đánh dấu
hoàn tất** cho đến khi kiểm tra xong screen reader và zoom 200%.

## 8. I01–I04 — Production & Lighthouse

| Task | Kết quả | Trạng thái |
|---|---|---|
| I01 | `typecheck` + `build` thành công, `vite preview` trả về 200, không có lỗi console (Lighthouse `errors-in-console` pass) | PASS |
| I02 | Lighthouse Accessibility **100/100** | PASS |
| I03 | Lighthouse Best Practices **100/100** | PASS |
| I04 | Mục 9 | Một phần |

Cấu hình Lighthouse: 12.8.2, `formFactor: mobile` (giả lập rộng 412px), Chrome 156 headless,
URL `http://localhost:4173/` (bản production qua `vite preview`), chạy lúc 2026-10-29T08:11:40Z.
Báo cáo gốc: `evidence/lighthouse-report.html`.
Lệnh chạy lại:

```bash
npm run build && npx vite preview --port 4173
npx lighthouse@12 http://localhost:4173/ --only-categories=accessibility,best-practices --view
```

## 9. I04 — Đối chiếu acceptance matrix (M-01 → M-19)

| ID | Yêu cầu | Trạng thái |
|---|---|---|
| M-01 | Generic DataGrid | PASS (test dùng `Product`, demo dùng `Student`) |
| M-02 | Sorting | PASS |
| M-03 | Filtering | PASS |
| M-04 | Pagination | PASS |
| M-05 | Row selection | PASS |
| M-06 | Semantic HTML table | PASS |
| M-07 | ARIA grid/row/gridcell | PASS |
| M-08 | Arrow keys | PASS |
| M-09 | Enter selection | PASS |
| M-10 | Space toggle | PASS |
| M-11 | Visible focus | PASS |
| M-12 | Screen reader | NOT VERIFIED (chưa test NVDA/VoiceOver) |
| M-13 | WCAG 2.2 AA | NOT VERIFIED (còn 1.4.4 và screen reader) |
| M-14 | Contrast ≥ 4.5:1 | PASS |
| M-15 | Lighthouse Accessibility 100 | PASS |
| M-16 | Lighthouse Best Practices 100 | PASS |
| M-17 | Contract-First | PASS (contract gốc giữ nguyên, các quyết định có trong spec) |
| M-18 | Atomic commits | NOT VERIFIED (chưa commit xong) |
| M-19 | Independent verification | PASS (tài liệu này + mutation checks) |

## 10. Việc còn lại phải làm thủ công

1. Dùng NVDA (Windows) đọc grid: tên grid, header cột, trạng thái sort, trạng thái selected, thông báo số kết quả.
2. Zoom trình duyệt lên 200% và kiểm tra không mất nội dung hoặc chức năng.
3. Tự thao tác toàn bộ trang chỉ bằng bàn phím một lượt.
4. Sau khi làm xong, cập nhật M-12, M-13, H03, H04 trong tài liệu này.
