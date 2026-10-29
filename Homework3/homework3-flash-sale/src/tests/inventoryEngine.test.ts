import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_STOCK, PRODUCTS } from '../data/products';
import { InventoryEngine } from '../engines/inventoryEngine';
import { LOCK_MS, SALE_MS, T0, createTestEngine, expectInvariant, record, reserveNow, TEST_CUSTOMER } from './fixtures';

beforeEach(() => vi.useFakeTimers({ now: T0 }));
afterEach(() => vi.useRealTimers());

describe('H3-C04: nền tảng kho', () => {
  it('khởi tạo: mọi hàng ở available, version 0, đúng bất biến', () => {
    const engine = createTestEngine();
    expect(engine.getSnapshot().map((r) => [r.productId, r.availableStock, r.reservedStock, r.soldStock, r.version])).toEqual([
      ['FS-001', 5, 0, 0, 0],
      ['FS-002', 3, 0, 0, 0],
      ['FS-003', 10, 0, 0, 0],
      ['FS-004', 2, 0, 0, 0],
    ]);
    expectInvariant(engine.getSnapshot());
  });

  it('snapshot đã freeze: sửa từ bên ngoài bị chặn và không ảnh hưởng engine', () => {
    const engine = createTestEngine();
    const snapshot = engine.getSnapshot();
    expect(() => {
      (snapshot[0] as { availableStock: number }).availableStock = 999;
    }).toThrow(TypeError);
    expect(() => (snapshot as unknown as unknown[]).push({})).toThrow(TypeError);
    expect(record(engine, 'FS-001').availableStock).toBe(5);
  });

  it('snapshot giữ nguyên tham chiếu cho tới khi có thay đổi (dùng được với useSyncExternalStore)', () => {
    const engine = createTestEngine();
    const before = engine.getSnapshot();
    expect(engine.getSnapshot()).toBe(before);
    reserveNow(engine, 'FS-001');
    expect(engine.getSnapshot()).not.toBe(before);
  });

  it('subscribe nhận thông báo khi kho đổi; thao tác thất bại không thông báo; unsubscribe thì dừng', () => {
    const engine = createTestEngine();
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);

    reserveNow(engine, 'FS-001');
    expect(listener).toHaveBeenCalledTimes(1);
    engine.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-001', quantity: 1, expectedVersion: 0 }); // version cũ → thất bại
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    reserveNow(engine, 'FS-001');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('dữ liệu khởi tạo sai bị từ chối ngay lúc tạo engine', () => {
    const base = { products: PRODUCTS, saleWindow: { startsAt: T0, endsAt: T0 + 1 }, lockDurationMs: LOCK_MS };
    expect(() => new InventoryEngine({ ...base, initialStock: [{ productId: 'FS-001', totalStock: -1 }] })).toThrow();
    expect(() => new InventoryEngine({ ...base, initialStock: [{ productId: 'FS-001', totalStock: 1.5 }] })).toThrow();
    expect(() => new InventoryEngine({ ...base, initialStock: [{ productId: 'X', totalStock: 1 }] })).toThrow();
    expect(() => new InventoryEngine({ ...base, initialStock: [...INITIAL_STOCK, INITIAL_STOCK[0]] })).toThrow();
    expect(() => new InventoryEngine({ ...base, products: [...PRODUCTS, PRODUCTS[0]], initialStock: [] })).toThrow();
    expect(() => new InventoryEngine({ ...base, initialStock: [], lockDurationMs: 0 })).toThrow();
  });
});

describe('H3-D01: giữ hàng với optimistic locking', () => {
  it('thành công: available −q, reserved +q, version +1, có hạn tuyệt đối', () => {
    const engine = createTestEngine();
    vi.advanceTimersByTime(1_000);
    const result = engine.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-001', quantity: 2, expectedVersion: 0 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ productId: 'FS-001', quantity: 2, status: 'ACTIVE', createdAt: T0 + 1_000, expiresAt: T0 + 1_000 + LOCK_MS });
    expect(record(engine, 'FS-001')).toMatchObject({ availableStock: 3, reservedStock: 2, soldStock: 0, version: 1 });
    expectInvariant(engine.getSnapshot());
  });

  it('mã đơn duy nhất', () => {
    const engine = createTestEngine();
    const ids = [reserveNow(engine, 'FS-003'), reserveNow(engine, 'FS-003'), reserveNow(engine, 'FS-001')].map((r) => r.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('version cũ → VERSION_CONFLICT, kho không đổi', () => {
    const engine = createTestEngine();
    reserveNow(engine, 'FS-003');
    const before = record(engine, 'FS-003');
    const result = engine.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-003', quantity: 1, expectedVersion: 0 });
    expect(result).toMatchObject({ ok: false, error: 'VERSION_CONFLICT' });
    expect(record(engine, 'FS-003')).toBe(before);
  });

  it('hết hàng → INSUFFICIENT_STOCK, không bao giờ âm', () => {
    const engine = createTestEngine();
    reserveNow(engine, 'FS-004');
    reserveNow(engine, 'FS-004');
    const result = engine.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-004', quantity: 1, expectedVersion: record(engine, 'FS-004').version });
    expect(result).toMatchObject({ ok: false, error: 'INSUFFICIENT_STOCK' });
    expect(record(engine, 'FS-004')).toMatchObject({ availableStock: 0, reservedStock: 2 });
  });

  it('số lượng không hợp lệ → INVALID_QUANTITY', () => {
    const engine = createTestEngine();
    for (const quantity of [0, -1, 1.5, Number.NaN, 3]) {
      expect(engine.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-001', quantity, expectedVersion: 0 }), String(quantity)).toMatchObject({
        ok: false,
        error: 'INVALID_QUANTITY',
      });
    }
    expect(record(engine, 'FS-001').version).toBe(0);
  });

  it('sản phẩm không tồn tại → UNKNOWN_PRODUCT', () => {
    expect(createTestEngine().reserve({ customerId: TEST_CUSTOMER, productId: 'NOPE', quantity: 1, expectedVersion: 0 })).toMatchObject({
      ok: false,
      error: 'UNKNOWN_PRODUCT',
    });
  });

  it('ngoài khung giờ sale → SALE_NOT_ACTIVE (trước giờ mở và đúng giờ đóng)', () => {
    const early = createTestEngine({ saleWindow: { startsAt: T0 + 1, endsAt: T0 + SALE_MS } });
    expect(early.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-001', quantity: 1, expectedVersion: 0 })).toMatchObject({ error: 'SALE_NOT_ACTIVE' });

    const engine = createTestEngine();
    vi.setSystemTime(T0 + SALE_MS);
    expect(engine.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-001', quantity: 1, expectedVersion: 0 })).toMatchObject({ error: 'SALE_NOT_ACTIVE' });
  });
});

describe('H3-D02: hủy giữ hàng', () => {
  it('hủy trả hàng về kho, version +1, tổng không đổi', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-001', 2);
    const result = engine.cancel(reservation.id);

    expect(result).toMatchObject({ ok: true, value: { status: 'CANCELLED' } });
    expect(record(engine, 'FS-001')).toMatchObject({ availableStock: 5, reservedStock: 0, totalStock: 5, version: 2 });
  });

  it('hủy 2 lần: lần 2 bị từ chối, hàng chỉ được trả một lần', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-001');
    engine.cancel(reservation.id);
    const after = record(engine, 'FS-001');

    expect(engine.cancel(reservation.id)).toMatchObject({ ok: false, error: 'INVALID_TRANSITION' });
    expect(record(engine, 'FS-001')).toBe(after);
    expectInvariant(engine.getSnapshot());
  });

  it('hủy đơn không tồn tại → UNKNOWN_RESERVATION', () => {
    expect(createTestEngine().cancel('R-9999')).toMatchObject({ ok: false, error: 'UNKNOWN_RESERVATION' });
  });

  it('không hủy được đơn đã thanh toán', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-002');
    engine.commit(reservation.id);
    expect(engine.cancel(reservation.id)).toMatchObject({ ok: false, error: 'INVALID_TRANSITION' });
    expect(record(engine, 'FS-002')).toMatchObject({ soldStock: 1, availableStock: 2 });
  });

  it('chuỗi thao tác hỗn hợp: bất biến luôn đúng sau từng bước', () => {
    const engine = createTestEngine();
    const a = reserveNow(engine, 'FS-003', 3);
    const b = reserveNow(engine, 'FS-003', 2);
    expectInvariant(engine.getSnapshot());
    engine.commit(a.id);
    expectInvariant(engine.getSnapshot());
    engine.cancel(b.id);
    expectInvariant(engine.getSnapshot());
    reserveNow(engine, 'FS-003', 3);
    expectInvariant(engine.getSnapshot());
    expect(record(engine, 'FS-003')).toMatchObject({ availableStock: 4, reservedStock: 3, soldStock: 3, version: 5 });
  });
});
