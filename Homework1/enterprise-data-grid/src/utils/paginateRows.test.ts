import { describe, expect, it } from 'vitest';
import { paginateRows } from './paginateRows';

const rows = Object.freeze(Array.from({ length: 7 }, (_, index) => index + 1));

describe('paginateRows', () => {
  it('tính đúng số trang và dữ liệu từng trang', () => {
    expect(paginateRows(rows, 1, 3)).toEqual({ rows: [1, 2, 3], page: 1, pageCount: 3 });
    expect(paginateRows(rows, 2, 3)).toEqual({ rows: [4, 5, 6], page: 2, pageCount: 3 });
  });

  it('trang cuối có ít dòng hơn pageSize', () => {
    expect(paginateRows(rows, 3, 3)).toEqual({ rows: [7], page: 3, pageCount: 3 });
  });

  it('số dòng chia hết cho pageSize thì không sinh trang rỗng', () => {
    expect(paginateRows(rows.slice(0, 6), 2, 3).pageCount).toBe(2);
  });

  it('dữ liệu rỗng: một trang rỗng hợp lệ', () => {
    expect(paginateRows([], 1, 5)).toEqual({ rows: [], page: 1, pageCount: 1 });
    expect(paginateRows([], 4, 5)).toEqual({ rows: [], page: 1, pageCount: 1 });
  });

  it('kẹp trang ngoài biên về trang hợp lệ gần nhất', () => {
    expect(paginateRows(rows, 99, 3).page).toBe(3);
    expect(paginateRows(rows, 0, 3).page).toBe(1);
    expect(paginateRows(rows, -2, 3).page).toBe(1);
    expect(paginateRows(rows, Number.NaN, 3).page).toBe(1);
  });

  it('từ chối pageSize không phải số nguyên dương', () => {
    expect(() => paginateRows(rows, 1, 0)).toThrow(RangeError);
    expect(() => paginateRows(rows, 1, 2.5)).toThrow(RangeError);
  });

  it('không mutate input', () => {
    // rows đã freeze, slice không làm thay đổi mảng gốc
    paginateRows(rows, 2, 3);
    expect(rows).toHaveLength(7);
  });
});
