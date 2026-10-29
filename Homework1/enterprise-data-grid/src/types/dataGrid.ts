
/**
 * Định nghĩa cấu trúc của một cột trong DataGrid.
 *
 * T là kiểu dữ liệu của một dòng.
 * keyof T bảo đảm accessorKey phải là thuộc tính tồn tại trong T.
 */
export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  sortable?: boolean;
}

/**
 * Định nghĩa dữ liệu đầu vào của DataGrid.
 *
 * data: Danh sách các dòng dữ liệu.
 * columns: Danh sách cấu hình cột.
 * onRowSelect: Callback tùy chọn khi một dòng được chọn.
 * ariaLabel: Tên truy cập bắt buộc của DataGrid.
 */
export interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowSelect?: (item: T) => void;
  ariaLabel: string;
}
