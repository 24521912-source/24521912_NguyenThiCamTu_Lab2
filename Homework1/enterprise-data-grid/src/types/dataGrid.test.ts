import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ColumnDef, DataGridProps } from './dataGrid';

interface Product {
  sku: string;
  price: number;
}

describe('DataGrid contracts', () => {
  it('chỉ chấp nhận accessorKey là key của T', () => {
    const column: ColumnDef<Product> = { header: 'Giá', accessorKey: 'price', sortable: true };
    expectTypeOf(column.accessorKey).toEqualTypeOf<keyof Product>();

    // @ts-expect-error 'name' không phải key của Product -> tsc -b phải báo lỗi
    const invalid: ColumnDef<Product> = { header: 'Tên', accessorKey: 'name' };
    expect(invalid.header).toBe('Tên');
  });

  it('onRowSelect nhận đúng kiểu T', () => {
    expectTypeOf<DataGridProps<Product>['onRowSelect']>().toEqualTypeOf<
      ((item: Product) => void) | undefined
    >();
  });
});
