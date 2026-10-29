import { describe, expect, it } from 'vitest';
import { sortRows } from './sortRows';

interface Row {
  id: number;
  name: string;
  score?: number;
}

const rows: readonly Row[] = Object.freeze([
  { id: 1, name: 'Trần', score: 9 },
  { id: 2, name: 'an', score: 10 },
  { id: 3, name: 'Ánh', score: 2 },
  { id: 4, name: 'Bình' },
  { id: 5, name: 'Đức', score: 9 },
]);

const ids = (list: Row[]) => list.map((row) => row.id);

describe('sortRows', () => {
  it('so sánh số theo giá trị số, không theo chuỗi ("10" < "9")', () => {
    expect(ids(sortRows(rows, { key: 'score', direction: 'ascending' }))).toEqual([3, 1, 5, 2, 4]);
    expect(ids(sortRows(rows, { key: 'score', direction: 'descending' }))).toEqual([2, 1, 5, 3, 4]);
  });

  it('so sánh đúng số thập phân (collator numeric sẽ xếp "2.5" trước "2.25")', () => {
    const gpas = [{ gpa: 2.5 }, { gpa: 10 }, { gpa: 2.25 }];
    expect(sortRows(gpas, { key: 'gpa', direction: 'ascending' }).map((row) => row.gpa)).toEqual([2.25, 2.5, 10]);
  });

  it('so sánh chuỗi tiếng Việt theo locale, không phân biệt hoa thường', () => {
    // a < á < b < d < đ < t
    expect(ids(sortRows(rows, { key: 'name', direction: 'ascending' }))).toEqual([2, 3, 4, 5, 1]);
  });

  it('chuỗi chứa số được so theo số tự nhiên', () => {
    const codes = [{ code: 'SV10' }, { code: 'SV2' }];
    expect(sortRows(codes, { key: 'code', direction: 'ascending' })).toEqual([{ code: 'SV2' }, { code: 'SV10' }]);
  });

  it('giá trị trùng giữ nguyên thứ tự ban đầu ở cả hai chiều', () => {
    const asc = ids(sortRows(rows, { key: 'score', direction: 'ascending' }));
    const desc = ids(sortRows(rows, { key: 'score', direction: 'descending' }));
    expect(asc.indexOf(1)).toBeLessThan(asc.indexOf(5));
    expect(desc.indexOf(1)).toBeLessThan(desc.indexOf(5));
  });

  it('giá trị thiếu luôn nằm cuối', () => {
    expect(ids(sortRows(rows, { key: 'score', direction: 'ascending' })).at(-1)).toBe(4);
    expect(ids(sortRows(rows, { key: 'score', direction: 'descending' })).at(-1)).toBe(4);
  });

  it('không mutate input và trả về mảng mới', () => {
    // rows đã Object.freeze: nếu code sort tại chỗ sẽ ném TypeError
    const sorted = sortRows(rows, { key: 'name', direction: 'descending' });
    expect(sorted).not.toBe(rows);
    expect(ids([...rows])).toEqual([1, 2, 3, 4, 5]);
    expect(sortRows(rows, null)).not.toBe(rows);
  });

  it('xử lý mảng rỗng và một phần tử', () => {
    expect(sortRows([] as Row[], { key: 'id', direction: 'ascending' })).toEqual([]);
    expect(sortRows([rows[0]], { key: 'id', direction: 'descending' })).toEqual([rows[0]]);
  });
});
