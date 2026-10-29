export interface Page<T> {
  rows: T[];
  /** Trang đã được kẹp vào khoảng hợp lệ [1, pageCount]. */
  page: number;
  pageCount: number;
}

/**
 * Cắt ra các dòng của một trang (đánh số từ 1).
 * pageCount tối thiểu là 1 để dữ liệu rỗng vẫn có "trang 1 / 1" hợp lệ.
 * page ngoài khoảng (ví dụ trang 5 sau khi lọc chỉ còn 2 trang) được kẹp về biên gần nhất.
 */
export function paginateRows<T>(rows: readonly T[], page: number, pageSize: number): Page<T> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError(`pageSize phải là số nguyên dương, nhận được ${pageSize}`);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), pageCount);
  const start = (safePage - 1) * pageSize;

  return { rows: rows.slice(start, start + pageSize), page: safePage, pageCount };
}
