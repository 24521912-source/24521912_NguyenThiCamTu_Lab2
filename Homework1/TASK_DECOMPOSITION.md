# TASK_DECOMPOSITION.md

# Homework 1 — Production Enterprise Data-Grid

**Course:** Web Application Development 2026 — UIT  
**Project:** Reusable Enterprise Data-Grid  
**Technology:** React, TypeScript, Vite, Semantic HTML5, Modern CSS  
**Accessibility Target:** WCAG 2.2 AA  
**Workflow:** Contract-First Development + Atomic AI Workflow  
**Document status:** Proposed Work Breakdown Structure (WBS)

---

## 1. Project Objective

Xây dựng DataGrid có thể tái sử dụng với các chức năng bắt buộc:

- Generic TypeScript contracts: `ColumnDef<T>` và `DataGridProps<T>`.
- Sorting, filtering và pagination.
- Interactive row selection.
- Semantic HTML table structure.
- ARIA grid semantics: `grid`, `row`, `gridcell`.
- Điều hướng bàn phím: ArrowUp, ArrowDown, ArrowLeft, ArrowRight.
- Enter để chọn dòng và Space để bật/tắt trạng thái chọn.
- Focus management và screen-reader compatibility.
- Responsive layout, mobile-first từ 375px.
- WCAG 2.2 AA, độ tương phản văn bản thông thường tối thiểu 4.5:1.
- Lighthouse Accessibility 100/100.
- Lighthouse Best Practices 100/100.

Không sử dụng jQuery, Bootstrap, Tailwind CSS hoặc thư viện data-grid bên ngoài.

## 2. Mandatory Development Workflow

### Stage 1 — Functional Slicing

Phân chia hệ thống thành những nhiệm vụ nhỏ có mục tiêu, đầu ra và điều kiện nghiệm thu riêng.

Mỗi implementation task chỉ xử lý một trách nhiệm chính.

### Stage 2 — Contract-First Specification

Xác định TypeScript interfaces, dữ liệu đầu vào, đầu ra, callback và hành vi mong đợi trước khi triển khai.

Giữ tương thích với contract gốc của giảng viên. Mọi extension phải được đánh dấu rõ ràng.

### Stage 3 — Atomic Generation

Mỗi lượt làm việc chỉ thực hiện một task được chỉ định.

Không triển khai trước các task chưa được giao. Không tự ý mở rộng phạm vi.

### Stage 4 — Independent Verification

Mỗi task phải được kiểm chứng độc lập bằng phương pháp phù hợp.

Chỉ đánh dấu **PASS** khi có bằng chứng kiểm chứng thực tế. Không được tuyên bố đã chạy test khi chưa thực hiện.

Sau khi task đạt tiêu chí nghiệm thu, tạo một atomic Git commit có nội dung rõ ràng.

Nếu task chỉ tạo tài liệu hoặc kiểm thử, không cần tạo code ứng dụng.

---

## 3. Contract Baseline

Giữ nguyên contract giảng viên:

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

Extension có thể xem xét khi cần: `getRowId?: (item: T) => string | number`.

Extension này không thuộc contract gốc và không được tự động coi là yêu cầu bắt buộc của giảng viên.

---

# 4. Work Breakdown Structure

## Phase A — Project Foundation & Contract Specification

### TASK A01 — Initialize Project Foundation

- **Objective:** Khởi tạo môi trường React + TypeScript + Vite theo stack đã thống nhất.
- **Expected output:** Cấu trúc dự án cơ bản và scripts cần thiết để chạy, build, kiểm tra kiểu.
- **Prerequisites:** None.
- **Acceptance criteria:**
  - Dự án khởi tạo thành công.
  - React, TypeScript và Vite hoạt động.
  - Không cài thư viện bị cấm.
  - Không triển khai DataGrid.
- **Verification:** Chạy lệnh cài đặt dependency, TypeScript check và production build; ghi lại exit code.
- **Suggested commit:** `chore: initialize React TypeScript Vite project`

### TASK A02 — Establish TypeScript Contracts

- **Objective:** Định nghĩa chính xác generic contract của DataGrid.
- **Expected output:** Module TypeScript chứa `ColumnDef<T>` và `DataGridProps<T>`.
- **Prerequisites:** A01.
- **Acceptance criteria:**
  - Giữ nguyên contract của giảng viên.
  - `accessorKey` sử dụng `keyof T`.
  - `onRowSelect` có đúng callback signature.
  - Không sử dụng `any` để bỏ qua kiểm tra kiểu.
  - Chưa triển khai logic.
- **Verification:** TypeScript compiler và type-level checks cho accessor hợp lệ, không hợp lệ.
- **Suggested commit:** `feat(types): define generic DataGrid contracts`

### TASK A03 — Specify Grid Interaction Rules

- **Objective:** Định nghĩa contract hành vi cho sorting, filtering, pagination, selection và keyboard.
- **Expected output:** Tài liệu quy tắc tương tác, các trạng thái và các trường hợp biên cần kiểm thử.
- **Prerequisites:** A02.
- **Acceptance criteria:**
  - Xác định rõ chức năng của từng thao tác.
  - Xác định cách phối hợp filtering, sorting và pagination.
  - Phân biệt Enter selection với Space toggle.
  - Xác định chính sách selection khi dữ liệu thay đổi.
  - Xác định hành vi bàn phím tại biên grid.
  - Không thay đổi contract giảng viên.
- **Verification:** Review specification đối chiếu M-02 đến M-10 trong acceptance matrix P03.
- **Suggested commit:** `docs: specify DataGrid interaction behavior`

### TASK A04 — Establish Test Infrastructure

- **Objective:** Chuẩn bị môi trường kiểm thử tự động cho logic và React components.
- **Expected output:** Test runner, DOM testing environment và test scripts.
- **Prerequisites:** A01.
- **Acceptance criteria:**
  - Có thể thực thi một test mẫu.
  - Test runner trả về trạng thái thành công hoặc thất bại chính xác.
  - Không chứa implementation DataGrid.
- **Verification:** Chạy test mẫu và kiểm tra báo cáo thực tế.
- **Suggested commit:** `test: configure unit and component testing`

## Phase B — Generic Data Processing

### TASK B01 — Implement Sorting Logic

- **Objective:** Xây dựng logic sắp xếp độc lập với giao diện.
- **Expected output:** Typed sorting utility.
- **Prerequisites:** A02, A03, A04.
- **Acceptance criteria:**
  - Sắp xếp đúng theo cột được phép.
  - Xử lý giá trị số và chuỗi theo quy tắc đã định nghĩa.
  - Không làm thay đổi trực tiếp dữ liệu đầu vào.
  - Xử lý trường hợp dữ liệu rỗng và giá trị trùng nhau.
- **Verification:** Unit tests với dữ liệu thường và edge cases.
- **Suggested commit:** `feat(grid): implement typed sorting logic`

### TASK B02 — Implement Filtering Logic

- **Objective:** Xây dựng logic lọc dữ liệu độc lập.
- **Expected output:** Typed filtering utility.
- **Prerequisites:** A02, A03, A04.
- **Acceptance criteria:**
  - Lọc dữ liệu theo quy tắc đã xác định.
  - Xử lý truy vấn rỗng.
  - Trả về tập rỗng khi không có kết quả.
  - Không đột biến mảng đầu vào.
- **Verification:** Unit tests với truy vấn hợp lệ, rỗng, không khớp và ký tự đặc biệt.
- **Suggested commit:** `feat(grid): implement typed filtering logic`

### TASK B03 — Implement Pagination Logic

- **Objective:** Xây dựng logic phân trang độc lập.
- **Expected output:** Typed pagination utility.
- **Prerequisites:** A02, A03, A04.
- **Acceptance criteria:**
  - Xác định đúng số trang và dữ liệu từng trang.
  - Xử lý trang cuối.
  - Xử lý dữ liệu rỗng.
  - Không cho phép trạng thái trang không hợp lệ.
- **Verification:** Unit tests với các kích thước tập dữ liệu và page boundaries.
- **Suggested commit:** `feat(grid): implement pagination logic`

### TASK B04 — Verify Combined Data Operations

- **Objective:** Kiểm tra sự phối hợp của sorting, filtering và pagination.
- **Expected output:** Integration tests cho data transformation pipeline.
- **Prerequisites:** B01, B02, B03.
- **Acceptance criteria:**
  - Kết quả phù hợp với thứ tự xử lý đã quy định.
  - Không lặp hoặc bỏ sót bản ghi ngoài ý muốn.
  - Filtering không làm page index trở nên không hợp lệ.
  - Dữ liệu đầu vào không bị thay đổi.
- **Verification:** Automated integration tests.
- **Suggested commit:** `test(grid): verify combined data operations`

## Phase C — Semantic Grid Foundation

### TASK C01 — Create Semantic Table Skeleton

- **Objective:** Tạo cấu trúc bảng HTML có ngữ nghĩa phù hợp.
- **Expected output:** DataGrid component ở mức cấu trúc, chưa có tương tác.
- **Prerequisites:** A02, A04.
- **Acceptance criteria:**
  - Render các phần tử `table`, `thead`, `tbody`, `tr`, `th`, `td`.
  - Render headers và dữ liệu thông qua generic contracts.
  - Có thể sử dụng với nhiều kiểu dữ liệu.
  - Có accessible name từ `ariaLabel`.
  - Chưa triển khai sorting, filtering, pagination hay selection.
- **Verification:** Component tests và DOM inspection.
- **Suggested commit:** `feat(grid): create semantic table skeleton`

### TASK C02 — Define ARIA Grid Roles

- **Objective:** Bổ sung cấu trúc ARIA cho bảng tương tác.
- **Expected output:** Semantic table với ARIA grid roles.
- **Prerequisites:** C01.
- **Acceptance criteria:**
  - Expose `grid`, `row`, `gridcell`.
  - Header cells giữ ngữ nghĩa column header phù hợp.
  - Quan hệ hàng–cột được giữ chính xác.
  - Không tạo role xung đột hoặc ARIA attributes không hợp lệ.
- **Verification:** Accessibility tree inspection, role-based component tests và axe-core.
- **Suggested commit:** `feat(a11y): establish ARIA grid semantics`

### TASK C03 — Implement Empty Data Presentation

- **Objective:** Hiển thị trạng thái không có dữ liệu hợp lệ về cấu trúc và accessibility.
- **Expected output:** Empty-state presentation bên trong DataGrid.
- **Prerequisites:** C02.
- **Acceptance criteria:**
  - Không xuất hiện lỗi khi `data` rỗng.
  - Thông báo trạng thái rỗng dễ hiểu.
  - Không tạo ô có thể focus nhưng không chứa dữ liệu hợp lệ.
  - Không phá vỡ cấu trúc semantic table.
- **Verification:** Component tests, DOM inspection và accessibility checks.
- **Suggested commit:** `feat(grid): handle empty data state`

## Phase D — User-Facing Data Controls

### TASK D01 — Connect Sorting to Grid UI

- **Objective:** Cho phép người dùng kích hoạt sorting trên các cột được hỗ trợ.
- **Expected output:** Sortable column header interaction.
- **Prerequisites:** B01, C02.
- **Acceptance criteria:**
  - Chỉ cột `sortable: true` được kích hoạt sorting.
  - Kết quả sắp xếp đúng với dữ liệu hiển thị.
  - Trạng thái sorting được công bố phù hợp bằng accessibility semantics.
  - Có thể kích hoạt sorting bằng bàn phím.
- **Verification:** Component interaction tests và keyboard accessibility checks.
- **Suggested commit:** `feat(grid): connect sorting to column headers`

### TASK D02 — Create Filtering Control

- **Objective:** Cho phép người dùng nhập điều kiện lọc.
- **Expected output:** Accessible filtering input.
- **Prerequisites:** B02, C02.
- **Acceptance criteria:**
  - Input có accessible label.
  - Dữ liệu được lọc chính xác.
  - Truy vấn rỗng hiển thị lại tập dữ liệu phù hợp.
  - Không có kết quả được xử lý đúng.
- **Verification:** Component tests, keyboard input test và accessible name inspection.
- **Suggested commit:** `feat(grid): add accessible filtering control`

### TASK D03 — Connect Pagination to Grid

- **Objective:** Kết nối pagination logic với dữ liệu hiển thị.
- **Expected output:** Grid hiển thị dữ liệu của trang hiện tại.
- **Prerequisites:** B03, C02.
- **Acceptance criteria:**
  - Hiển thị đúng các bản ghi thuộc trang hiện tại.
  - Số bản ghi không vượt kích thước trang.
  - Trang cuối và tập dữ liệu rỗng được xử lý đúng.
  - Chưa xây dựng pagination navigation controls.
- **Verification:** Component tests với nhiều trang và dữ liệu biên.
- **Suggested commit:** `feat(grid): connect paginated data rendering`

### TASK D04 — Create Pagination Navigation Controls

- **Objective:** Cho phép người dùng thay đổi trang.
- **Expected output:** Accessible pagination navigation UI.
- **Prerequisites:** D03.
- **Acceptance criteria:**
  - Điều hướng được giữa các trang hợp lệ.
  - Control không hợp lệ được disable phù hợp.
  - Trang hiện tại được công bố rõ ràng.
  - Các control có accessible names.
- **Verification:** Component interaction tests, keyboard tests và accessibility tree.
- **Suggested commit:** `feat(grid): add accessible pagination controls`

### TASK D05 — Integrate Combined Data Operations

- **Objective:** Đồng bộ sorting, filtering và pagination trong giao diện.
- **Expected output:** Grid xử lý đúng khi nhiều thao tác được áp dụng liên tiếp.
- **Prerequisites:** B04, D01, D02, D04, C03.
- **Acceptance criteria:**
  - Các thao tác tuân theo specification A03.
  - Không mất dữ liệu ngoài kết quả lọc dự kiến.
  - Pagination được cập nhật đúng khi filtering thay đổi.
  - Không xuất hiện trạng thái trang không hợp lệ.
- **Verification:** Integration tests với chuỗi thao tác liên tiếp.
- **Suggested commit:** `feat(grid): integrate sorting filtering and pagination`

## Phase E — Row Selection

### TASK E01 — Implement Selection State

- **Objective:** Xác định và quản lý trạng thái chọn dòng.
- **Expected output:** Selection state logic phù hợp với specification.
- **Prerequisites:** A03, C02.
- **Acceptance criteria:**
  - Trạng thái chọn dòng được xác định rõ.
  - Có thể bật hoặc tắt selection theo chính sách đã thống nhất.
  - Không phụ thuộc thiếu an toàn vào vị trí dòng sau sorting.
  - Không chọn nhầm dòng sau dữ liệu thay đổi.
- **Verification:** State logic tests, bao gồm sắp xếp và thay đổi dữ liệu.
- **Suggested commit:** `feat(grid): implement row selection state`

### TASK E02 — Implement Pointer-Based Row Selection

- **Objective:** Cho phép chọn dòng bằng thao tác trỏ hoặc click.
- **Expected output:** Interactive row selection kết nối với `onRowSelect`.
- **Prerequisites:** E01.
- **Acceptance criteria:**
  - Chọn đúng dòng được tương tác.
  - Callback nhận đúng đối tượng kiểu `T`.
  - Không gây lỗi khi không truyền callback.
  - Trạng thái chọn trong giao diện đồng bộ với state.
- **Verification:** Component interaction tests và callback assertions.
- **Suggested commit:** `feat(grid): enable pointer-based row selection`

### TASK E03 — Expose Accessible Selection State

- **Objective:** Công bố trạng thái chọn dòng cho assistive technology.
- **Expected output:** ARIA selection state đồng bộ với internal state.
- **Prerequisites:** E02.
- **Acceptance criteria:**
  - Trạng thái selected được biểu diễn phù hợp.
  - ARIA không thông báo sai trạng thái thực tế.
  - Thay đổi selection được phản ánh chính xác.
- **Verification:** Accessibility tree inspection, component tests và screen-reader spot checks.
- **Suggested commit:** `feat(a11y): expose accessible row selection state`

## Phase F — Keyboard Navigation & Focus Management

### TASK F01 — Implement Focus Model

- **Objective:** Xác định và quản lý ô đang focus trong ARIA grid.
- **Expected output:** Grid focus state và chiến lược keyboard focus.
- **Prerequisites:** C02, A03.
- **Acceptance criteria:**
  - Có thể đưa focus vào grid bằng bàn phím.
  - Tại một thời điểm, chỉ có vị trí active phù hợp theo mô hình focus đã chọn.
  - Không tạo keyboard trap.
  - Focus không tự biến mất khi trạng thái thay đổi.
- **Verification:** Keyboard test, DOM focus assertions và accessibility inspection.
- **Suggested commit:** `feat(a11y): establish grid focus management`

### TASK F02 — Implement Vertical Arrow Navigation

- **Objective:** Hỗ trợ ArrowUp và ArrowDown.
- **Expected output:** Vertical keyboard navigation.
- **Prerequisites:** F01.
- **Acceptance criteria:**
  - ArrowDown di chuyển tới hàng tiếp theo hợp lệ.
  - ArrowUp di chuyển tới hàng trước đó hợp lệ.
  - Không vượt hàng đầu hoặc hàng cuối.
  - Không kích hoạt selection ngoài ý muốn.
- **Verification:** Keyboard interaction tests với nhiều hàng và boundary cases.
- **Suggested commit:** `feat(a11y): implement vertical arrow navigation`

### TASK F03 — Implement Horizontal Arrow Navigation

- **Objective:** Hỗ trợ ArrowLeft và ArrowRight.
- **Expected output:** Horizontal keyboard navigation.
- **Prerequisites:** F01.
- **Acceptance criteria:**
  - ArrowRight di chuyển tới ô bên phải hợp lệ.
  - ArrowLeft di chuyển tới ô bên trái hợp lệ.
  - Không vượt biên cột.
  - Không làm mất focus hoặc gây scrolling ngoài ý muốn khi phím được grid xử lý.
- **Verification:** Keyboard tests với nhiều cột và boundary cases.
- **Suggested commit:** `feat(a11y): implement horizontal arrow navigation`

### TASK F04 — Implement Enter Row Selection

- **Objective:** Chọn dòng được focus bằng Enter.
- **Expected output:** Keyboard Enter selection behavior.
- **Prerequisites:** E03, F02, F03.
- **Acceptance criteria:**
  - Enter kích hoạt chọn đúng dòng.
  - Callback nhận đúng đối tượng `T` khi được cung cấp.
  - Không gây lỗi khi callback vắng mặt.
  - Trạng thái chọn và thông tin accessibility không mâu thuẫn.
- **Verification:** Keyboard tests, callback assertions và ARIA state checks.
- **Suggested commit:** `feat(a11y): implement Enter row selection`

### TASK F05 — Implement Space Selection Toggle

- **Objective:** Bật/tắt trạng thái chọn dòng bằng Space.
- **Expected output:** Keyboard Space toggle behavior.
- **Prerequisites:** E03, F02, F03.
- **Acceptance criteria:**
  - Space bật trạng thái chọn trên dòng hợp lệ.
  - Nhấn Space lần nữa tắt trạng thái chọn.
  - ARIA state được đồng bộ.
  - Không gây scroll ngoài ý muốn trong tương tác selection.
- **Verification:** Keyboard tests, state assertions và accessibility tree.
- **Suggested commit:** `feat(a11y): implement Space selection toggle`

### TASK F06 — Verify Focus Across Data Changes

- **Objective:** Kiểm chứng tính ổn định của focus khi bảng thay đổi.
- **Expected output:** Focus behavior được kiểm tra trong các tình huống sorting, filtering và pagination.
- **Prerequisites:** D05, F02, F03, F04, F05.
- **Acceptance criteria:**
  - Focus không bị mất hoặc chuyển đến vị trí vô nghĩa.
  - Focus tuân theo specification khi dòng đang focus bị lọc hoặc chuyển trang.
  - Không có keyboard trap.
  - Keyboard actions tiếp tục hoạt động sau các thay đổi dữ liệu.
- **Verification:** End-to-end keyboard scenarios và focus assertions.
- **Suggested commit:** `test(a11y): verify focus across grid state changes`

## Phase G — Responsive Layout & Visual Accessibility

### TASK G01 — Establish Mobile-First Layout

- **Objective:** Thiết lập layout responsive bắt đầu từ 375px.
- **Expected output:** Responsive DataGrid styles.
- **Prerequisites:** D05, F06.
- **Acceptance criteria:**
  - Giao diện hoạt động từ 375px.
  - Bảng vẫn đọc và thao tác được trên màn hình hẹp.
  - Không làm mất dữ liệu hoặc chức năng bắt buộc.
  - Hành vi responsive không phá vỡ semantic grid.
- **Verification:** Browser viewport inspection tại 375px và các kích thước lớn hơn.
- **Suggested commit:** `style(grid): implement mobile-first responsive layout`

### TASK G02 — Implement Visible Focus Indicators

- **Objective:** Bảo đảm các thành phần tương tác có chỉ báo focus rõ ràng.
- **Expected output:** Accessible focus styles.
- **Prerequisites:** G01.
- **Acceptance criteria:**
  - Focus hiển thị rõ khi sử dụng bàn phím.
  - Focus không bị che khuất bởi layout.
  - Có thể nhận diện ô/control đang active.
  - Selected state không che mất focus indicator.
- **Verification:** Manual keyboard navigation, focus visibility inspection và WCAG review.
- **Suggested commit:** `style(a11y): implement visible focus indicators`

### TASK G03 — Verify Color Contrast

- **Objective:** Kiểm tra và điều chỉnh độ tương phản màu.
- **Expected output:** Color contrast đạt chuẩn WCAG áp dụng.
- **Prerequisites:** G02.
- **Acceptance criteria:**
  - Văn bản thông thường đạt ít nhất 4.5:1 trừ ngoại lệ WCAG hợp lệ.
  - Các trạng thái tương tác được kiểm tra.
  - Văn bản, focus và selected state dễ phân biệt.
  - Các trường hợp cần ngưỡng khác được đánh giá theo WCAG tương ứng.
- **Verification:** Contrast ratio measurement và accessibility review.
- **Suggested commit:** `style(a11y): ensure WCAG-compliant contrast`

## Phase H — Accessibility Verification

### TASK H01 — Verify Semantic & ARIA Structure

- **Objective:** Kiểm tra toàn bộ cấu trúc HTML và ARIA sau khi tích hợp tương tác.
- **Expected output:** Semantic/ARIA verification report và các chỉnh sửa cần thiết trong phạm vi này.
- **Prerequisites:** D05, E03, F06, G03.
- **Acceptance criteria:**
  - Grid, row, gridcell, column header có ngữ nghĩa chính xác.
  - Không có ARIA attributes không hợp lệ.
  - Accessible names và selection states được công bố đúng.
  - Không làm mất semantic table relationships.
- **Verification:** axe-core, accessibility tree inspection và component accessibility tests.
- **Suggested commit:** `test(a11y): verify semantic and ARIA grid structure`

### TASK H02 — Verify Complete Keyboard Accessibility

- **Objective:** Kiểm chứng keyboard interactions từ đầu đến cuối.
- **Expected output:** Keyboard accessibility test report.
- **Prerequisites:** H01.
- **Acceptance criteria:**
  - Bốn phím mũi tên hoạt động.
  - Enter chọn đúng dòng.
  - Space toggle đúng selection state.
  - Focus hiển thị và không bị trap.
  - Các control sorting, filtering, pagination sử dụng được bằng bàn phím.
- **Verification:** Automated keyboard tests kết hợp manual keyboard-only testing.
- **Suggested commit:** `test(a11y): verify complete keyboard accessibility`

### TASK H03 — Verify Screen-Reader Compatibility

- **Objective:** Kiểm chứng trải nghiệm với screen reader.
- **Expected output:** Screen-reader test report.
- **Prerequisites:** H02.
- **Acceptance criteria:**
  - Grid có accessible name.
  - Screen reader đọc được column headers và cell content.
  - Trạng thái chọn được công bố đúng.
  - Filtering, sorting và pagination không làm người dùng mất ngữ cảnh quan trọng.
  - Không xuất hiện thông báo sai hoặc gây hiểu nhầm.
- **Verification:** Manual NVDA hoặc VoiceOver test và accessibility tree.
- **Suggested commit:** `test(a11y): verify screen-reader compatibility`

### TASK H04 — Conduct WCAG 2.2 AA Audit

- **Objective:** Đánh giá các tiêu chí WCAG 2.2 A/AA áp dụng cho DataGrid.
- **Expected output:** WCAG compliance checklist và audit findings.
- **Prerequisites:** H03.
- **Acceptance criteria:**
  - Các tiêu chí A và AA áp dụng được kiểm tra.
  - Không còn vi phạm được xác nhận.
  - Kiểm tra keyboard, focus, contrast, semantics và responsive accessibility.
  - Các trường hợp không áp dụng có lý do rõ ràng.
  - Không coi automated tests là bằng chứng duy nhất.
- **Verification:** Manual WCAG audit kết hợp automated accessibility checks.
- **Suggested commit:** `test(a11y): document WCAG 2.2 AA compliance audit`

## Phase I — Lighthouse & Production Verification

### TASK I01 — Verify Production Build

- **Objective:** Xác minh ứng dụng có thể build và chạy ở chế độ production.
- **Expected output:** Production build verification result.
- **Prerequisites:** H04.
- **Acceptance criteria:**
  - TypeScript checking thành công.
  - Production build thành công.
  - Ứng dụng production chạy được.
  - Không có runtime error đã biết trong các chức năng bắt buộc.
- **Verification:** TypeScript check, production build và browser smoke test.
- **Suggested commit:** `test(build): verify production build`

### TASK I02 — Verify Lighthouse Accessibility 100

- **Objective:** Đạt Lighthouse Accessibility 100/100.
- **Expected output:** Lighthouse Accessibility report.
- **Prerequisites:** I01.
- **Acceptance criteria:**
  - Lighthouse Accessibility = 100/100.
  - Kiểm thử trên môi trường và trạng thái được ghi nhận.
  - Không có audit failure bị bỏ qua.
  - Nếu chưa đạt, ghi rõ lỗi và trạng thái FAIL; không báo hoàn tất.
- **Verification:** Lighthouse Accessibility audit.
- **Suggested commit:** `test(lighthouse): verify accessibility score`

### TASK I03 — Verify Lighthouse Best Practices 100

- **Objective:** Đạt Lighthouse Best Practices 100/100.
- **Expected output:** Lighthouse Best Practices report.
- **Prerequisites:** I01.
- **Acceptance criteria:**
  - Lighthouse Best Practices = 100/100.
  - Không có audit failure bị bỏ qua.
  - Ghi rõ cấu hình môi trường và kết quả thực tế.
- **Verification:** Lighthouse Best Practices audit.
- **Suggested commit:** `test(lighthouse): verify best practices score`

### TASK I04 — Final Regression Verification

- **Objective:** Xác minh toàn bộ mandatory acceptance criteria sau tích hợp.
- **Expected output:** Final verification report đối chiếu P03.
- **Prerequisites:** I02, I03.
- **Acceptance criteria:**
  - M-01 đến M-19 được đối chiếu với bằng chứng.
  - Sorting, filtering, pagination và selection hoạt động.
  - Keyboard navigation và focus behavior đạt yêu cầu.
  - Semantic HTML và ARIA grid hợp lệ.
  - WCAG 2.2 AA audit đạt yêu cầu.
  - Lighthouse Accessibility và Best Practices đều 100/100.
  - Không có mandatory criterion chưa kiểm chứng nhưng bị đánh dấu PASS.
- **Verification:** Full automated test suite, manual testing, accessibility audit và Git history review.
- **Suggested commit:** `test: complete DataGrid acceptance verification`

---

# 5. Dependency Overview

Các dependency được xác định bằng Task ID để không triển khai chức năng trước khi có contract hoặc nền tảng cần thiết.

| Phase | Tasks | Điều kiện bắt đầu chính |
|---|---|---|
| A — Foundation | A01–A04 | Theo từng prerequisite trong Phase A |
| B — Data Logic | B01–B04 | Contracts, interaction specification, tests |
| C — Semantic Grid | C01–C03 | Contracts và test infrastructure |
| D — Data Controls | D01–D05 | Data utilities và semantic grid |
| E — Selection | E01–E03 | Interaction specification và semantic grid |
| F — Keyboard | F01–F06 | ARIA grid, selection và data controls |
| G — Responsive | G01–G03 | Integrated grid và keyboard verification |
| H — Accessibility | H01–H04 | Integrated interaction và visual accessibility |
| I — Production | I01–I04 | Accessibility verification và production readiness |

**Quy tắc thực thi:** Tasks có thể độc lập về dependency nhưng vẫn chỉ được giao và triển khai từng task trong mỗi prompt. Không gộp các task để tiết kiệm lượt AI.

---

# 6. Mandatory Requirements Coverage Matrix

| Instructor requirement | Task coverage | Acceptance IDs |
|---|---|---|
| Reusable generic DataGrid | A02, C01 | M-01 |
| Sorting | B01, D01, D05 | M-02 |
| Filtering | B02, D02, D05 | M-03 |
| Pagination | B03, D03, D04, D05 | M-04 |
| Interactive row selection | E01, E02, E03 | M-05 |
| Semantic HTML table | C01, H01 | M-06 |
| ARIA grid, row, gridcell | C02, H01 | M-07 |
| ArrowUp, ArrowDown | F02, H02 | M-08 |
| ArrowLeft, ArrowRight | F03, H02 | M-08 |
| Enter row selection | F04, H02 | M-09 |
| Space selection toggle | F05, H02 | M-10 |
| Visible focus indicator | F01, G02, H02 | M-11 |
| Screen-reader compatibility | E03, H03 | M-12 |
| WCAG 2.2 AA | H01, H02, H03, H04 | M-13 |
| Normal text contrast ≥ 4.5:1 | G03, H04 | M-14 |
| Lighthouse Accessibility 100/100 | I02 | M-15 |
| Lighthouse Best Practices 100/100 | I03 | M-16 |
| Contract-First Development | A02, A03 | M-17 |
| Atomic Git commits | Mỗi task sau verification | M-18 |
| Independent Verification | Mỗi task và I04 | M-19 |
| Responsive mobile-first 375px | G01, H04 | Project engineering rule |

---

# 7. Recommended Improvements — Outside Mandatory Scope

Những nội dung sau chỉ được thực hiện khi có nhiệm vụ riêng và được phê duyệt:

| Recommendation | Purpose | Status |
|---|---|---|
| Stable row identifier `getRowId` | Giúp React keys và selection ổn định | Optional |
| Stable sorting | Giữ thứ tự tương đối của bản ghi bằng nhau | Optional |
| Configurable page size | Cho phép điều chỉnh số dòng trên mỗi trang | Optional |
| Controlled selection | Đồng bộ trạng thái chọn từ parent component | Optional |
| Large dataset optimization | Cải thiện hiệu năng với dữ liệu lớn | Optional |
| Additional automated regression coverage | Tăng độ tin cậy khi thay đổi code | Optional |

Không được tự ý triển khai recommendation như một mandatory requirement.

---

# 8. Atomic Task Definition of Done

Một task chỉ đạt **DONE** khi thỏa mãn đầy đủ:

- [ ] Đúng Task ID và phạm vi được giao.
- [ ] Các prerequisite đã đạt yêu cầu.
- [ ] Expected output được tạo đúng.
- [ ] Không thay đổi contract gốc nếu không được yêu cầu.
- [ ] Không triển khai tính năng thuộc task khác.
- [ ] Acceptance criteria của task đều đạt.
- [ ] Verification method đã được thực thi thực tế.
- [ ] Có bằng chứng kiểm chứng hoặc kết quả test.
- [ ] Các vấn đề còn tồn tại được báo cáo.
- [ ] Atomic Git commit chỉ được tạo sau khi task đã được kiểm chứng thành công.
- [ ] Dừng lại sau task, không tự triển khai nhiệm vụ kế tiếp.

**Trạng thái hợp lệ:** `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `VERIFIED`, `DONE`.

`VERIFIED` nghĩa là các tiêu chí đã có bằng chứng đạt yêu cầu. `DONE` nghĩa là task đã được kiểm chứng và hoàn thành commit cần thiết.

---

# 9. Current Project Status

**P02:** TypeScript contract proposal — completed at specification level.

**P03:** Homework acceptance criteria — completed at specification level.

**P04:** Work Breakdown Structure — proposed in this document.

**Implementation status:** Not started.

**Testing status:** Not executed.

**Git status:** No commits created by this task.

**Scope boundary:** Tài liệu này chỉ xác định các task và dependency, chưa thực hiện bất kỳ task triển khai nào.

**End of TASK P04 — Work Breakdown Structure.**