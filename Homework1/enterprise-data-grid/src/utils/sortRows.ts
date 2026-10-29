/** Giá trị trùng với aria-sort để UI dùng trực tiếp. */
export type SortDirection = 'ascending' | 'descending';

export interface SortState<T> {
  key: keyof T;
  direction: SortDirection;
}

// numeric: true để "SV2" < "SV10"; 'vi' để so sánh đúng chữ có dấu tiếng Việt
const collator = new Intl.Collator('vi', { numeric: true });

const isMissing = (value: unknown) => value === null || value === undefined || value === '';

/**
 * So sánh hai giá trị ô: số so sánh theo số, còn lại so sánh chuỗi theo locale.
 * ponytail: Date/boolean bị so như chuỗi, thêm nhánh riêng khi có cột kiểu đó.
 */
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
}

/**
 * Trả về mảng MỚI đã sắp xếp, không đụng vào mảng gốc.
 * toSorted là stable sort nên các dòng bằng nhau giữ thứ tự ban đầu.
 * Giá trị rỗng luôn nằm cuối, bất kể chiều sắp xếp.
 */
export function sortRows<T>(rows: readonly T[], sort: SortState<T> | null): T[] {
  if (!sort) return [...rows];
  const sign = sort.direction === 'ascending' ? 1 : -1;

  return rows.toSorted((rowA, rowB) => {
    const a = rowA[sort.key];
    const b = rowB[sort.key];
    if (isMissing(a) || isMissing(b)) return Number(isMissing(a)) - Number(isMissing(b));
    return sign * compareValues(a, b);
  });
}
