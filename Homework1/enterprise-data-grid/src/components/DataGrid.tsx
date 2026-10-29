import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { ColumnDef, DataGridProps } from '../types/dataGrid';
import { filterRows } from '../utils/filterRows';
import { paginateRows } from '../utils/paginateRows';
import { sortRows, type SortState } from '../utils/sortRows';
import './DataGrid.css';

// ponytail: page size cố định, thêm prop pageSize khi có yêu cầu cấu hình
const PAGE_SIZE = 5;

interface ActiveCell<T> {
  row: T | null;
  col: number;
}

const cellText = <T,>(row: T, column: ColumnDef<T>) => String(row[column.accessorKey] ?? '');

export function DataGrid<T>({ data, columns, onRowSelect, ariaLabel }: DataGridProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState<T> | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<T | null>(null);
  const [active, setActive] = useState<ActiveCell<T>>({ row: null, col: 0 });
  const focusPending = useRef(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const searchId = useId();
  const hintId = useId();

  // Định danh dòng = tham chiếu đối tượng (spec §6.1). Vị trí trong mảng gốc làm React key:
  // không đổi khi sort/lọc/chuyển trang. ponytail: cùng một object xuất hiện 2 lần sẽ trùng key.
  const sourceIndex = new Map(data.map((row, index) => [row, index]));

  // Bản ghi đang chọn bị xóa khỏi data -> bỏ chọn (cập nhật state ngay trong render, không cần effect)
  if (selected !== null && !sourceIndex.has(selected)) setSelected(null);

  // Source → Filtering → Sorting → Pagination (spec §2)
  const filtered = filterRows(data, columns, query);
  const current = paginateRows(sortRows(filtered, sort), page, PAGE_SIZE);
  const rows = current.rows;

  // Ô active bị lọc/chuyển trang mất -> quay về dòng đầu trang, giữ cột (spec §8)
  const activeRow = active.row === null ? 0 : Math.max(0, rows.indexOf(active.row));
  const activeCol = Math.min(active.col, columns.length - 1);

  // Chỉ dời focus DOM khi người dùng đang thao tác phím trong grid, không giành focus từ ô tìm kiếm
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    tableRef.current?.querySelector<HTMLElement>('td[tabindex="0"]')?.focus();
  });

  function focusCell(rowIndex: number, col: number) {
    focusPending.current = true;
    setActive({ row: rows[rowIndex], col });
  }

  function selectRow(row: T) {
    setSelected(row);
    onRowSelect?.(row);
  }

  // Bỏ chọn không gọi onRowSelect vì contract không có payload cho bỏ chọn (spec §6.3)
  function toggleRow(row: T) {
    if (row === selected) setSelected(null);
    else selectRow(row);
  }

  function toggleSort(key: keyof T) {
    setSort((prev) =>
      prev?.key === key && prev.direction === 'ascending'
        ? { key, direction: 'descending' }
        : { key, direction: 'ascending' },
    );
  }

  function handleCellKeyDown(event: KeyboardEvent, rowIndex: number, col: number) {
    switch (event.key) {
      case 'ArrowUp':
        focusCell(Math.max(0, rowIndex - 1), col);
        break;
      case 'ArrowDown':
        focusCell(Math.min(rows.length - 1, rowIndex + 1), col);
        break;
      case 'ArrowLeft':
        focusCell(rowIndex, Math.max(0, col - 1));
        break;
      case 'ArrowRight':
        focusCell(rowIndex, Math.min(columns.length - 1, col + 1));
        break;
      case 'Enter':
        selectRow(rows[rowIndex]);
        break;
      case ' ':
        toggleRow(rows[rowIndex]);
        break;
      default:
        return; // Tab, Shift+Tab... giữ hành vi mặc định -> không có keyboard trap
    }
    // Chặn cuộn trang khi grid đã xử lý phím mũi tên / Space
    event.preventDefault();
  }

  const firstShown = (current.page - 1) * PAGE_SIZE + 1;
  const status =
    data.length === 0
      ? 'Không có dữ liệu.'
      : filtered.length === 0
        ? 'Không có kết quả phù hợp.'
        : `Hiển thị ${firstShown}–${firstShown + rows.length - 1} trên ${filtered.length} bản ghi.`;

  return (
    <div className="data-grid">
      <div className="data-grid__toolbar">
        <label htmlFor={searchId}>Tìm kiếm</label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1); // Đổi điều kiện lọc -> về trang 1 (spec §2)
          }}
        />
      </div>

      <p id={hintId} className="data-grid__hint">
        Trong bảng: phím mũi tên để di chuyển, Enter để chọn dòng, Space để bật/tắt chọn.
      </p>

      <div className="data-grid__scroll">
        <table ref={tableRef} role="grid" aria-label={ariaLabel} aria-describedby={hintId}>
          <thead>
            <tr role="row">
              {columns.map((column) => (
                <th
                  key={String(column.accessorKey)}
                  scope="col"
                  role="columnheader"
                  aria-sort={sort?.key === column.accessorKey ? sort.direction : undefined}
                >
                  {column.sortable ? (
                    <button type="button" onClick={() => toggleSort(column.accessorKey)}>
                      {column.header}
                      <span className="data-grid__sort-icon" aria-hidden="true">
                        {sort?.key !== column.accessorKey ? '↕' : sort.direction === 'ascending' ? '▲' : '▼'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              // Không có ô focus được khi không có dữ liệu (C03)
              <tr role="row">
                <td role="gridcell" colSpan={columns.length} className="data-grid__empty">
                  {status}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={sourceIndex.get(row)}
                  role="row"
                  aria-selected={row === selected}
                  className={row === selected ? 'is-selected' : undefined}
                >
                  {columns.map((column, col) => (
                    <td
                      key={String(column.accessorKey)}
                      role="gridcell"
                      // Roving tabindex: chỉ một ô là Tab stop của grid
                      tabIndex={rowIndex === activeRow && col === activeCol ? 0 : -1}
                      onKeyDown={(event) => handleCellKeyDown(event, rowIndex, col)}
                      onClick={() => {
                        setActive({ row, col });
                        toggleRow(row);
                      }}
                    >
                      {cellText(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="data-grid__footer">
        <p role="status" className="data-grid__status">
          {status}
        </p>
        <nav aria-label={`Phân trang ${ariaLabel}`} className="data-grid__pagination">
          {/* aria-disabled thay vì disabled: nút disabled làm rơi focus về body khi tới trang biên */}
          <button
            type="button"
            aria-disabled={current.page === 1}
            onClick={() => current.page > 1 && setPage(current.page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {current.page} / {current.pageCount}
          </span>
          <button
            type="button"
            aria-disabled={current.page === current.pageCount}
            onClick={() => current.page < current.pageCount && setPage(current.page + 1)}
          >
            Trang sau
          </button>
        </nav>
      </div>
    </div>
  );
}
