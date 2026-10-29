import { expect } from 'vitest';
import type { InventoryRecord } from '../contracts/inventory';
import { INITIAL_STOCK, PRODUCTS } from '../data/products';
import { InventoryEngine } from '../engines/inventoryEngine';

/** Mốc thời gian cố định cho mọi test: 00:00:00 ngày 11/11/2026 giờ Việt Nam. */
export const T0 = Date.UTC(2026, 10, 10, 17, 0, 0);
export const LOCK_MS = 30_000;
export const TEST_CUSTOMER = 'test-customer';
export const SALE_MS = 10 * 60_000;

/** Tạo engine SAU khi bật vi.useFakeTimers() để Date.now/setTimeout là bản giả. */
export function createTestEngine(overrides: Partial<ConstructorParameters<typeof InventoryEngine>[0]> = {}) {
  return new InventoryEngine({
    products: PRODUCTS,
    initialStock: INITIAL_STOCK,
    saleWindow: { startsAt: T0, endsAt: T0 + SALE_MS },
    lockDurationMs: LOCK_MS,
    ...overrides,
  });
}

/** Kiểm tra bất biến kho cho mọi sản phẩm. */
export function expectInvariant(records: readonly InventoryRecord[]) {
  for (const record of records) {
    expect(record.totalStock, record.productId).toBe(record.availableStock + record.reservedStock + record.soldStock);
    for (const value of [record.availableStock, record.reservedStock, record.soldStock]) {
      expect(Number.isInteger(value) && value >= 0, record.productId).toBe(true);
    }
  }
}

export function record(engine: InventoryEngine, productId: string): InventoryRecord {
  const found = engine.getRecord(productId);
  if (!found) throw new Error(`Không có ${productId}`);
  return found;
}

/** Giữ hàng với version hiện tại; ném lỗi nếu thất bại (dùng để dựng tình huống test). */
export function reserveNow(engine: InventoryEngine, productId: string, quantity = 1) {
  const result = engine.reserve({ customerId: TEST_CUSTOMER, productId, quantity, expectedVersion: record(engine, productId).version });
  if (!result.ok) throw new Error(result.message);
  return result.value;
}
