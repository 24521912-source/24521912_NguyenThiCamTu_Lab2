import { describe, expect, it } from 'vitest';
import type { ColumnDef } from '../types/dataGrid';
import { filterRows } from './filterRows';

interface Row {
  id: number;
  name: string;
  note?: string | null;
  secret: string;
}

const rows: readonly Row[] = Object.freeze([
  { id: 1, name: 'Nguyễn Văn An', note: 'Lớp (A1)', secret: 'zzz' },
  { id: 2, name: 'Trần Thị Bích', note: null, secret: 'an' },
  { id: 3, name: 'LÊ MINH', note: 'giỏi', secret: '' },
]);

const columns: ColumnDef<Row>[] = [
  { header: 'Họ tên', accessorKey: 'name' },
  { header: 'Ghi chú', accessorKey: 'note' },
];

const ids = (list: Row[]) => list.map((row) => row.id);

describe('filterRows', () => {
  it('không phân biệt hoa thường, kể cả chữ có dấu', () => {
    expect(ids(filterRows(rows, columns, 'lê minh'))).toEqual([3]);
    expect(ids(filterRows(rows, columns, 'NGUYỄN'))).toEqual([1]);
  });

  it('khớp chữ tiếng Việt dù gõ dạng tổ hợp (NFD) hay dựng sẵn (NFC)', () => {
    expect(ids(filterRows(rows, columns, 'Nguyễn'.normalize('NFD')))).toEqual([1]);
  });

  it('chỉ tìm trong các cột được cấu hình', () => {
    // "zzz" chỉ có trong secret, không phải cột hiển thị
    expect(filterRows(rows, columns, 'zzz')).toEqual([]);
    // "an" khớp name của dòng 1, nhưng không khớp secret của dòng 2
    expect(ids(filterRows(rows, columns, 'an'))).toEqual([1]);
  });

  it('truy vấn rỗng hoặc toàn khoảng trắng trả lại toàn bộ dữ liệu', () => {
    expect(ids(filterRows(rows, columns, ''))).toEqual([1, 2, 3]);
    expect(ids(filterRows(rows, columns, '   '))).toEqual([1, 2, 3]);
  });

  it('không khớp thì trả về mảng rỗng', () => {
    expect(filterRows(rows, columns, 'không tồn tại')).toEqual([]);
  });

  it('ký tự đặc biệt được hiểu theo nghĩa đen, không phải regex', () => {
    expect(ids(filterRows(rows, columns, '(a1)'))).toEqual([1]);
    expect(filterRows(rows, columns, '.*')).toEqual([]);
  });

  it('bỏ qua giá trị null/undefined, không in ra chữ "null"', () => {
    expect(filterRows(rows, columns, 'null')).toEqual([]);
  });

  it('không mutate input', () => {
    const result = filterRows(rows, columns, '');
    expect(result).not.toBe(rows);
    expect(Object.isFrozen(rows)).toBe(true);
  });
});
