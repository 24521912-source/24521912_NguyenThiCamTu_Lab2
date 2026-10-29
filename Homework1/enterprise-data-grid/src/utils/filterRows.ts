import type { ColumnDef } from '../types/dataGrid';

// NFC: "ễ" gõ tổ hợp (e + dấu) và "ễ" dựng sẵn trở thành cùng một chuỗi
const normalize = (text: string) => text.normalize('NFC').toLocaleLowerCase('vi');

/**
 * Lọc các dòng có ít nhất một CỘT ĐANG HIỂN THỊ chứa từ khóa.
 * Chỉ tìm trong accessorKey của columns, không tìm mọi thuộc tính của T (spec A03 §4).
 * Dùng includes thay vì RegExp nên ký tự như ( . * được hiểu đúng nghĩa đen.
 */
export function filterRows<T>(rows: readonly T[], columns: readonly ColumnDef<T>[], query: string): T[] {
  const term = normalize(query.trim());
  if (!term) return [...rows];

  return rows.filter((row) =>
    columns.some((column) => normalize(String(row[column.accessorKey] ?? '')).includes(term)),
  );
}
