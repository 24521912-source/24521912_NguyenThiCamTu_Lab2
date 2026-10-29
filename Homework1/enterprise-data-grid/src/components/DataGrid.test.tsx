import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ColumnDef } from '../types/dataGrid';
import { DataGrid } from './DataGrid';

// Kiểu dữ liệu khác Student để chứng minh grid là generic
interface Product {
  sku: string;
  name: string;
  price: number;
  note?: string;
}

const products: Product[] = Array.from({ length: 12 }, (_, index) => ({
  sku: `P${String(index + 1).padStart(2, '0')}`,
  name: `Sản phẩm ${String.fromCharCode(65 + index)}`,
  price: ((index * 7) % 12) * 10 + 5,
  note: index % 4 === 0 ? undefined : `ghi chú ${index}`,
}));

const columns: ColumnDef<Product>[] = [
  { header: 'Mã', accessorKey: 'sku', sortable: true },
  { header: 'Tên', accessorKey: 'name' },
  { header: 'Giá', accessorKey: 'price', sortable: true },
];

function setup(data: Product[] = products, onRowSelect?: (item: Product) => void) {
  const user = userEvent.setup();
  const utils = render(<DataGrid data={data} columns={columns} onRowSelect={onRowSelect} ariaLabel="Sản phẩm" />);
  return { user, ...utils };
}

const grid = () => screen.getByRole('grid', { name: 'Sản phẩm' });
const bodyRows = () => within(grid()).getAllByRole('row').slice(1);
const skus = () => bodyRows().map((row) => within(row).getAllByRole('gridcell')[0].textContent);
const cell = (sku: string, col = 0) => within(screen.getByRole('row', { name: new RegExp(sku) })).getAllByRole('gridcell')[col];
const tabStops = () => grid().querySelectorAll('td[tabindex="0"]');

describe('C01–C03: cấu trúc bảng', () => {
  it('render table/thead/tbody/th/td từ generic contract, có accessible name', () => {
    setup();
    const table = grid();
    expect(table.tagName).toBe('TABLE');
    expect(table.querySelector('thead th')).not.toBeNull();
    expect(table.querySelectorAll('tbody td')).toHaveLength(5 * columns.length);
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent?.replace(/[↕▲▼]/, ''))).toEqual([
      'Mã',
      'Tên',
      'Giá',
    ]);
    expect(skus()).toEqual(['P01', 'P02', 'P03', 'P04', 'P05']);
  });

  it('expose role grid, row, gridcell, columnheader', () => {
    setup();
    expect(within(grid()).getAllByRole('row')).toHaveLength(6);
    expect(within(grid()).getAllByRole('gridcell')).toHaveLength(15);
    expect(within(grid()).getAllByRole('columnheader')).toHaveLength(3);
  });

  it('giá trị thiếu hiển thị ô rỗng thay vì "undefined"', () => {
    render(
      <DataGrid data={products} columns={[{ header: 'Ghi chú', accessorKey: 'note' }]} ariaLabel="Sản phẩm" />,
    );
    expect(within(grid()).getAllByRole('gridcell')[0].textContent).toBe('');
  });

  it('data rỗng: thông báo, không có ô focus được, vẫn giữ cấu trúc bảng', () => {
    setup([]);
    expect(within(grid()).getAllByRole('columnheader')).toHaveLength(3);
    expect(within(grid()).getByText('Không có dữ liệu.')).toBeTruthy();
    expect(grid().querySelectorAll('[tabindex]')).toHaveLength(0);
    expect(screen.getByText('Trang 1 / 1')).toBeTruthy();
  });
});

describe('D01: sorting', () => {
  it('chỉ cột sortable có nút, click đổi asc/desc và cập nhật aria-sort', async () => {
    const { user } = setup();
    const priceHeader = screen.getByRole('columnheader', { name: /Giá/ });
    expect(within(screen.getByRole('columnheader', { name: 'Tên' })).queryByRole('button')).toBeNull();
    expect(priceHeader.getAttribute('aria-sort')).toBeNull();

    await user.click(within(priceHeader).getByRole('button'));
    expect(priceHeader.getAttribute('aria-sort')).toBe('ascending');
    const ascending = bodyRows().map((row) => Number(within(row).getAllByRole('gridcell')[2].textContent));
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
    expect(ascending[0]).toBe(5);

    await user.click(within(priceHeader).getByRole('button'));
    expect(priceHeader.getAttribute('aria-sort')).toBe('descending');
    expect(Number(within(bodyRows()[0]).getAllByRole('gridcell')[2].textContent)).toBe(115);
  });

  it('kích hoạt sort bằng bàn phím (Enter trên nút header)', async () => {
    const { user } = setup();
    screen.getByRole('button', { name: /Mã/ }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    expect(skus()[0]).toBe('P12');
  });

  it('không mutate mảng data truyền vào', async () => {
    const data = [...products];
    const { user } = setup(data);
    await user.click(screen.getByRole('button', { name: /Giá/ }));
    expect(data).toEqual(products);
  });
});

describe('D02: filtering', () => {
  it('input có label, lọc chính xác, rỗng thì hiện lại, không khớp thì báo', async () => {
    const { user } = setup();
    const search = screen.getByLabelText('Tìm kiếm');

    await user.type(search, 'sản phẩm c');
    expect(skus()).toEqual(['P03']);
    expect(screen.getByRole('status').textContent).toBe('Hiển thị 1–1 trên 1 bản ghi.');

    await user.clear(search);
    expect(skus()).toHaveLength(5);

    await user.type(search, 'xyz');
    expect(within(grid()).getByText('Không có kết quả phù hợp.')).toBeTruthy();
    expect(tabStops()).toHaveLength(0);
  });
});

describe('D03–D05: pagination', () => {
  it('trang cuối ít dòng hơn, nút biên aria-disabled, focus không rơi khỏi nút', async () => {
    const { user } = setup();
    const next = screen.getByRole('button', { name: 'Trang sau' });
    const prev = screen.getByRole('button', { name: 'Trang trước' });
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('navigation', { name: 'Phân trang Sản phẩm' })).toBeTruthy();

    await user.click(next);
    await user.click(next);
    expect(screen.getByText('Trang 3 / 3')).toBeTruthy();
    expect(skus()).toEqual(['P11', 'P12']);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(next);

    await user.click(next); // bấm khi đã ở biên: không đổi trang
    expect(screen.getByText('Trang 3 / 3')).toBeTruthy();

    await user.click(prev);
    expect(skus()).toEqual(['P06', 'P07', 'P08', 'P09', 'P10']);
  });

  it('đổi bộ lọc khi đang ở trang 3 thì về trang 1', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    await user.type(screen.getByLabelText('Tìm kiếm'), 'sản');
    expect(screen.getByText('Trang 1 / 3')).toBeTruthy();
    expect(skus()[0]).toBe('P01');
  });

  it('đổi sort giữ nguyên trang hiện tại', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    await user.click(screen.getByRole('button', { name: /Mã/ }));
    await user.click(screen.getByRole('button', { name: /Mã/ }));
    expect(screen.getByText('Trang 2 / 3')).toBeTruthy();
    expect(skus()).toEqual(['P07', 'P06', 'P05', 'P04', 'P03']);
  });
});

describe('E01–E03: chọn dòng bằng chuột', () => {
  it('click chọn và gọi callback với đúng object, click lại thì bỏ chọn không gọi callback', async () => {
    const onRowSelect = vi.fn();
    const { user } = setup(products, onRowSelect);

    await user.click(cell('P02', 1));
    expect(onRowSelect).toHaveBeenCalledTimes(1);
    expect(onRowSelect).toHaveBeenCalledWith(products[1]);
    expect(screen.getByRole('row', { name: /P02/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('row', { name: /P01/ }).getAttribute('aria-selected')).toBe('false');

    await user.click(cell('P03'));
    expect(screen.getByRole('row', { name: /P02/ }).getAttribute('aria-selected')).toBe('false');
    expect(within(grid()).getAllByRole('row', { selected: true })).toHaveLength(1);

    await user.click(cell('P03'));
    expect(within(grid()).queryAllByRole('row', { selected: true })).toHaveLength(0);
    expect(onRowSelect).toHaveBeenCalledTimes(2);
  });

  it('không có callback vẫn chọn được, không lỗi', async () => {
    const { user } = setup();
    await user.click(cell('P01'));
    expect(screen.getByRole('row', { name: /P01/ }).getAttribute('aria-selected')).toBe('true');
  });

  it('sau khi sort, vẫn là bản ghi đó được chọn chứ không phải vị trí đó', async () => {
    const { user } = setup();
    await user.click(cell('P01'));
    await user.click(screen.getByRole('button', { name: /Giá/ }));
    expect(within(grid()).getByRole('row', { selected: true }).textContent).toContain('P01');
    expect(bodyRows()[0].getAttribute('aria-selected')).toBe(String(skus()[0] === 'P01'));
  });

  it('bản ghi đang chọn bị xóa khỏi data thì bỏ chọn', async () => {
    const { user, rerender } = setup();
    await user.click(cell('P01'));
    rerender(<DataGrid data={products.slice(1)} columns={columns} ariaLabel="Sản phẩm" />);
    expect(within(grid()).queryAllByRole('row', { selected: true })).toHaveLength(0);
    rerender(<DataGrid data={products} columns={columns} ariaLabel="Sản phẩm" />);
    expect(within(grid()).queryAllByRole('row', { selected: true })).toHaveLength(0);
  });
});

describe('F01: focus model', () => {
  it('Tab vào grid tới ô đầu, chỉ một tab stop, Tab/Shift+Tab ra được (không trap)', async () => {
    const { user } = setup();
    expect(tabStops()).toHaveLength(1);

    screen.getByRole('button', { name: /Giá/ }).focus();
    await user.tab();
    expect(document.activeElement).toBe(cell('P01'));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Trang trước' }));

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(cell('P01'));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Giá/ }));
  });
});

describe('F02–F03: phím mũi tên', () => {
  it('di chuyển 4 hướng, dừng ở biên, không đổi selection', async () => {
    const { user } = setup();
    cell('P01').focus();

    await user.keyboard('{ArrowUp}{ArrowLeft}');
    expect(document.activeElement).toBe(cell('P01', 0));

    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(document.activeElement).toBe(cell('P02', 1));

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(document.activeElement).toBe(cell('P05', 1));

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(document.activeElement).toBe(cell('P05', 2));

    expect(tabStops()).toHaveLength(1);
    expect(within(grid()).queryAllByRole('row', { selected: true })).toHaveLength(0);
  });

  it('chặn hành vi mặc định (cuộn trang) cho phím grid đã xử lý', () => {
    setup();
    expect(fireEvent.keyDown(cell('P01'), { key: 'ArrowDown' })).toBe(false);
    expect(fireEvent.keyDown(cell('P01'), { key: ' ' })).toBe(false);
    expect(fireEvent.keyDown(cell('P01'), { key: 'Tab' })).toBe(true);
  });
});

describe('F04–F05: Enter và Space', () => {
  it('Enter chọn dòng, Enter lần nữa vẫn chọn và gọi lại callback', async () => {
    const onRowSelect = vi.fn();
    const { user } = setup(products, onRowSelect);
    cell('P01').focus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('row', { name: /P02/ }).getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('row', { name: /P02/ }).getAttribute('aria-selected')).toBe('true');
    expect(onRowSelect).toHaveBeenCalledTimes(2);
    expect(onRowSelect).toHaveBeenLastCalledWith(products[1]);
  });

  it('Space bật rồi tắt chọn, chỉ gọi callback khi bật', async () => {
    const onRowSelect = vi.fn();
    const { user } = setup(products, onRowSelect);
    cell('P03', 2).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('row', { name: /P03/ }).getAttribute('aria-selected')).toBe('true');
    await user.keyboard(' ');
    expect(screen.getByRole('row', { name: /P03/ }).getAttribute('aria-selected')).toBe('false');
    expect(onRowSelect).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(cell('P03', 2));
  });

  it('Enter/Space không lỗi khi không có callback', async () => {
    const { user } = setup();
    cell('P01').focus();
    await user.keyboard('{Enter} ');
    expect(within(grid()).queryAllByRole('row', { selected: true })).toHaveLength(0);
  });
});

describe('F06: focus khi dữ liệu thay đổi', () => {
  it('sort giữ tab stop trên cùng bản ghi và cột', async () => {
    // Giá P01..P05 = 5, 75, 25, 95, 45 -> sort tăng dần, P02 chuyển từ vị trí 1 sang vị trí 3
    const { user } = setup(products.slice(0, 5));
    cell('P01').focus();
    await user.keyboard('{ArrowDown}{ArrowRight}'); // P02, cột Tên
    await user.click(screen.getByRole('button', { name: /Giá/ }));
    expect(skus()).toEqual(['P01', 'P03', 'P05', 'P02', 'P04']);
    expect(tabStops()[0]).toBe(cell('P02', 1));
  });

  it('dòng active bị lọc mất thì tab stop về dòng đầu, cùng cột, phím vẫn hoạt động', async () => {
    const { user } = setup();
    cell('P01').focus();
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}'); // P02, cột Giá
    await user.type(screen.getByLabelText('Tìm kiếm'), 'sản phẩm d');
    expect(tabStops()[0]).toBe(cell('P04', 2));

    // Tab từ ô tìm kiếm qua 2 nút sort rồi vào đúng ô tab stop
    await user.tab();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(cell('P04', 2));
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(cell('P04', 2));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(cell('P04', 1));
  });

  it('chuyển trang: tab stop nằm ở dòng đầu trang mới', async () => {
    const { user } = setup();
    cell('P01').focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(tabStops()[0]).toBe(cell('P06', 0));
    // Focus vẫn ở nút phân trang, grid không giành focus
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Trang sau' }));
  });
});
