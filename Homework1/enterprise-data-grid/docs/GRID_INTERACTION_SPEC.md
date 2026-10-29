# DataGrid Interaction Specification

**Project:** Production Enterprise Data-Grid  
**Task:** A03 — Specify Grid Interaction Rules  
**Status:** Approved for implementation after review  
**Accessibility Target:** WCAG 2.2 AA

## 1. Contract Preservation

Preserve the instructor's original interfaces without modification:

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

All future implementations must remain compatible with these interfaces.

## 2. Data Processing Pipeline

The processing order is:

**Source Data → Filtering → Sorting → Pagination → Visible Rows**

- Data transformations must not mutate the input `data` array.
- Changing filtering conditions resets the current page to page 1.
- Changing sorting preserves the current page if it remains valid.
- All pagination operations apply to the filtered and sorted dataset.
- Empty datasets must not cause runtime errors.

## 3. Sorting Rules

- Only columns with `sortable: true` support sorting.
- Clicking or activating a sortable column header toggles between ascending and descending order.
- The initial sort direction is ascending.
- Only one column is sorted at a time.
- Numeric values are compared numerically.
- Strings are compared consistently using locale-aware comparison where appropriate.
- Equal values preserve their original relative order.
- Sorting must not mutate source data.
- The current sorting direction must be exposed through appropriate ARIA semantics.

## 4. Filtering Rules

- A labeled text input provides client-side filtering.
- Filtering is case-insensitive.
- Vietnamese Unicode text must be handled correctly.
- Filtering applies to the configured searchable textual representation of each row.
- The filtering scope must be defined explicitly before B02 implementation; it must not silently assume that every property of `T` is searchable.
- **B02 decision:** a row matches when the text of at least one configured column (`columns[].accessorKey`) contains the search term. Properties of `T` that are not configured as columns are never searched. Text is compared after `trim()`, Unicode NFC normalization and `toLocaleLowerCase('vi')`; the term is matched literally (no RegExp). `null`/`undefined` cells are treated as empty text.
- Empty search terms restore the unfiltered dataset.
- No matching records produce an accessible empty-result state.
- Filtering changes must keep pagination and focus valid.

## 5. Pagination Rules

- Pagination is performed client-side.
- The initial page is page 1.
- Page size is a positive integer defined by the implementation configuration.
- Page count is calculated from filtered data.
- The last page may contain fewer records than the configured page size.
- Navigation outside valid boundaries is prevented.
- An empty dataset displays an empty state, with no invalid page navigation.
- Pagination controls use accessible names and expose the current page.
- **D03/D04 decision:** page size is 5 (a constant in `DataGrid.tsx`). Previous/Next buttons use `aria-disabled` instead of `disabled` at the boundaries, because a `disabled` button drops keyboard focus to `<body>` when the user reaches the last page.

## 6. Row Identity and Selection Rules

### 6.1 Stable Identity

- Selection must reference a stable record identity, not the visible row index.
- An optional `getRowId(item)` extension may be proposed separately.
- The original instructor contract must not be changed without review.
- Before implementing E01, the identity strategy for records without a stable ID must be explicitly resolved.
- Duplicate identifiers must not silently select the wrong record.
- **E01 decision:** row identity is the record's object reference. The grid never clones records, so the reference survives sorting, filtering and pagination, and two different records can never share it. No `getRowId` extension is added and the instructor contract is unchanged. The React key is the record's index in the source `data` array, which also does not change when sorting, filtering or paging. If the parent replaces `data` with new objects, the selection is cleared rather than moved to another record. Known limit: the same object placed twice in `data` would produce duplicate keys.

### 6.2 Selection Model

- The intended selection model is single-row selection.
- Selecting another row replaces the previously selected row.
- Selection and deselection must be supported.
- Sorting must not change which record is selected.
- Filtering and pagination must not cause another record to be selected accidentally.
- If a selected record is temporarily hidden, selection may remain associated with its identity.
- If the selected record is removed from the source dataset, its selection is cleared.
- **E02 decision:** a pointer click on a data cell behaves like Space (toggle) and also makes that cell the active cell.

### 6.3 Callback Behavior

- `onRowSelect?: (item: T) => void` retains its original signature.
- The callback is invoked when a valid row is selected or activated.
- The callback is not invoked merely because focus moves.
- Deselecting a row does not invoke `onRowSelect`, because the baseline contract has no deselection payload.
- The selected state is exposed through appropriate ARIA semantics.

## 7. Keyboard Interaction Contract

| Key | Required behavior |
|---|---|
| ArrowUp | Move focus to the cell above |
| ArrowDown | Move focus to the cell below |
| ArrowLeft | Move focus to the previous cell |
| ArrowRight | Move focus to the next cell |
| Enter | Select or activate the focused row |
| Space | Toggle selection of the focused row |
| Tab | Enter or exit the grid |
| Shift+Tab | Navigate backward without trapping focus |

### Enter and Space State Rules

| Initial state | Enter | Space |
|---|---|---|
| Row not selected | Select row | Select row |
| Row already selected | Keep selected and activate row | Deselect row |

- Enter invokes `onRowSelect` when provided, including reactivation of an already selected row.
- Space invokes `onRowSelect` when selecting a row.
- Space deselection does not invoke `onRowSelect`.
- Arrow navigation never changes selection automatically.
- Keyboard events must use `event.key`.
- Deprecated `keyCode` and `keypress` APIs are forbidden.

## 8. Focus Management

- Use a roving `tabIndex` strategy for the interactive grid.
- Only one grid data cell is reachable through the grid's primary Tab stop at a time.
- Entering the grid focuses the last valid active cell or the first valid data cell.
- Arrow keys move focus within the data-cell region.
- Column headers and external controls use their appropriate native keyboard interactions.
- Arrow keys must not interfere with input editing or native control behavior.
- At the first or last row/column, arrow navigation remains at the boundary rather than wrapping.
- Tab and Shift+Tab must allow users to leave the grid.
- Focus must not move to a hidden or detached element.
- When sorting changes row order, preserve focus on the same record and column when possible.
- When filtering or pagination hides the focused row, move focus to an appropriate visible location without trapping the user.
- A visible focus indicator is required.

## 9. ARIA and Screen-Reader Rules

- Preserve semantic HTML table structure.
- Provide appropriate `grid`, `row`, `gridcell`, and column-header semantics.
- The grid must have an accessible name from `ariaLabel`.
- Use `aria-sort` only where appropriate to represent sorting state.
- Use `aria-selected` to represent the actual selected state.
- Provide accessible labels for filtering and pagination controls.
- Communicate meaningful result-count and empty-state changes to assistive technology without excessive announcements.
- Avoid redundant or misleading ARIA attributes.

## 10. Boundary Cases

The implementation must account for:

1. Empty datasets.
2. No matching filtering results.
3. Single-row datasets.
4. Single-column grids.
5. Duplicate sort values.
6. Missing optional record values.
7. Final pagination pages with fewer records.
8. Filtering while viewing a later page.
9. Sorting while a record is selected.
10. Removing the selected record.
11. Hiding the currently focused row.
12. Arrow navigation at grid boundaries.
13. Missing optional `onRowSelect` callback.

## 11. Verification Requirements

Each implementation task must be verified independently.

Required verification methods include:

- TypeScript checking.
- ESLint.
- Unit and component tests where applicable.
- Keyboard-only interaction tests.
- DOM and accessibility tree inspection.
- Screen-reader checks where available.
- WCAG 2.2 AA assessment.
- Lighthouse Accessibility 100/100.
- Lighthouse Best Practices 100/100.

Do not claim successful verification without actual executed checks.

## 12. Scope Boundary

This document specifies interaction behavior only.

No React component, sorting utility, filtering utility, pagination utility, selection implementation, keyboard handler, or CSS implementation belongs to TASK A03.

Contract extensions must be approved separately before implementation.