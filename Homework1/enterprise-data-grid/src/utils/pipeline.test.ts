import { describe, expect, it } from 'vitest';
import type { ColumnDef } from '../types/dataGrid';
import { filterRows } from './filterRows';
import { paginateRows } from './paginateRows';
import { sortRows, type SortState } from './sortRows';

interface Row {
  id: number;
  name: string;
  city: string;
  score: number;
}

const cities = ['Hà Nội', 'Huế', 'Đà Nẵng'];
const rows: readonly Row[] = Object.freeze(
  Array.from({ length: 23 }, (_, index) => ({
    id: index + 1,
    name: `Người ${index + 1}`,
    city: cities[index % 3],
    score: (index * 7) % 10,
  })),
);
const snapshot = JSON.stringify(rows);

const columns: ColumnDef<Row>[] = [
  { header: 'Tên', accessorKey: 'name' },
  { header: 'Thành phố', accessorKey: 'city' },
  { header: 'Điểm', accessorKey: 'score', sortable: true },
];

// Đúng thứ tự spec A03: Source → Filtering → Sorting → Pagination
function run(query: string, sort: SortState<Row> | null, page: number, pageSize = 5) {
  return paginateRows(sortRows(filterRows(rows, columns, query), sort), page, pageSize);
}

describe('pipeline filter → sort → paginate', () => {
  it('sắp xếp trên toàn bộ kết quả lọc, không chỉ trên trang hiện tại', () => {
    const firstPage = run('huế', { key: 'score', direction: 'descending' }, 1);
    // 8 dòng Huế có điểm 7,8,9,0,1 | 2,3,4: trang 1 phải là top-5 của cả 8 dòng,
    // không phải 5 dòng đầu được sắp xếp lại (9,8,7,1,0)
    expect(firstPage.rows.map((row) => row.score)).toEqual([9, 8, 7, 4, 3]);
    expect(firstPage.rows.every((row) => row.city === 'Huế')).toBe(true);
  });

  it('ghép tất cả các trang lại không lặp và không sót bản ghi', () => {
    const sort: SortState<Row> = { key: 'score', direction: 'ascending' };
    const { pageCount } = run('', sort, 1);
    const ids = Array.from({ length: pageCount }, (_, index) => run('', sort, index + 1).rows)
      .flat()
      .map((row) => row.id);

    expect(pageCount).toBe(5);
    expect(ids).toHaveLength(rows.length);
    expect(new Set(ids).size).toBe(rows.length);
  });

  it('lọc khi đang ở trang sau không tạo trang không hợp lệ', () => {
    expect(run('', null, 5).page).toBe(5);

    // Còn 8 dòng ở Hà Nội -> 2 trang, trang 5 phải được kẹp về 2
    const filtered = run('hà nội', null, 5);
    expect(filtered.pageCount).toBe(2);
    expect(filtered.page).toBe(2);
    expect(filtered.rows).toHaveLength(3);
  });

  it('không có kết quả lọc: trang 1/1 rỗng, không lỗi', () => {
    expect(run('không có', { key: 'score', direction: 'ascending' }, 3)).toEqual({ rows: [], page: 1, pageCount: 1 });
  });

  it('dữ liệu nguồn không bị thay đổi sau cả chuỗi xử lý', () => {
    run('a', { key: 'score', direction: 'descending' }, 2);
    run('', { key: 'name', direction: 'ascending' }, 1);
    expect(JSON.stringify(rows)).toBe(snapshot);
  });
});
