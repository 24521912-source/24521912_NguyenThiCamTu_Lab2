import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutEngine } from '../engines/checkoutEngine';
import { simulateCompetingCustomers, submitCheckoutRepeatedly } from '../simulation/concurrentRequests';
import { T0, createTestEngine, expectInvariant, record, reserveNow, TEST_CUSTOMER } from './fixtures';

beforeEach(() => vi.useFakeTimers({ now: T0 }));
afterEach(() => vi.useRealTimers());

/** Mọi khách "đi mạng" mất đúng một microtask: tất cả cùng đọc version cũ trước khi ai kịp ghi. */
const sameLatency = () => Promise.resolve();

describe('H3-E02/E03: nhiều khách tranh mua cùng lúc', () => {
  it('20 khách tranh 2 chiếc FS-004: đúng 2 người giữ được, không bán lố', async () => {
    const inventory = createTestEngine();
    const report = await simulateCompetingCustomers(inventory, { productId: 'FS-004', customers: 20, latency: sameLatency });

    expect(report.reserved).toBe(2);
    expect(record(inventory, 'FS-004')).toMatchObject({ availableStock: 0, reservedStock: 2, soldStock: 0 });
    expect(report.versionConflicts).toBeGreaterThan(0);
    const statuses = new Set(report.outcomes.map((outcome) => outcome.status));
    expect([...statuses].every((status) => ['RESERVED', 'INSUFFICIENT_STOCK', 'RETRY_LIMIT'].includes(status))).toBe(true);
    expectInvariant(inventory.getSnapshot());
  });

  it('đơn của khách mô phỏng mang customerId riêng (UI lọc theo chủ sở hữu, không lẫn với đơn của người dùng)', async () => {
    const inventory = createTestEngine();
    const mine = reserveNow(inventory, 'FS-003');
    const report = await simulateCompetingCustomers(inventory, { productId: 'FS-003', customers: 2, latency: sameLatency });
    const owners = report.outcomes.map((outcome) => inventory.getReservation(outcome.reservationId ?? '')?.customerId);
    expect(owners).toEqual(['khach-1', 'khach-2']);
    expect(mine.customerId).toBe(TEST_CUSTOMER);
    expect(inventory.getReservations().filter((r) => r.customerId === TEST_CUSTOMER)).toHaveLength(1);
  });

  it('cùng một expectedVersion: chỉ yêu cầu đầu tiên thắng, yêu cầu sau bị VERSION_CONFLICT', () => {
    const inventory = createTestEngine();
    const first = inventory.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-003', quantity: 1, expectedVersion: 0 });
    const second = inventory.reserve({ customerId: TEST_CUSTOMER, productId: 'FS-003', quantity: 1, expectedVersion: 0 });
    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, error: 'VERSION_CONFLICT' });
    expect(record(inventory, 'FS-003').reservedStock).toBe(1);
  });

  it('còn đủ hàng thì retry giúp mọi khách giữ được, tổng giữ = số khách', async () => {
    const inventory = createTestEngine();
    const report = await simulateCompetingCustomers(inventory, { productId: 'FS-003', customers: 4, latency: sameLatency });
    expect(report.reserved).toBe(4);
    expect(record(inventory, 'FS-003')).toMatchObject({ availableStock: 6, reservedStock: 4 });
    expect(Math.max(...report.outcomes.map((outcome) => outcome.attempts))).toBe(4);
  });

  it('retry có giới hạn: maxRetries = 0 thì người thua ra RETRY_LIMIT, không thử mãi', async () => {
    const inventory = createTestEngine();
    const report = await simulateCompetingCustomers(inventory, {
      productId: 'FS-003',
      customers: 5,
      maxRetries: 0,
      latency: sameLatency,
    });
    expect(report.reserved).toBe(1);
    expect(report.outcomes.filter((outcome) => outcome.status === 'RETRY_LIMIT')).toHaveLength(4);
    expect(report.outcomes.every((outcome) => outcome.attempts === 1)).toBe(true);
  });

  it('một khách gặp lỗi mạng: được ghi là ERROR, các khách khác vẫn chạy, không có unhandled rejection', async () => {
    const inventory = createTestEngine();
    const report = await simulateCompetingCustomers(inventory, {
      productId: 'FS-003',
      customers: 3,
      latency: (customer) => (customer === 2 ? Promise.reject(new Error('mất mạng')) : Promise.resolve()),
    });
    expect(report.outcomes.map((outcome) => outcome.status)).toEqual(['RESERVED', 'ERROR', 'RESERVED']);
    expect(record(inventory, 'FS-003').reservedStock).toBe(2);
  });

  it('sale chưa mở: không ai giữ được, không retry', async () => {
    const inventory = createTestEngine({ saleWindow: { startsAt: T0 + 60_000, endsAt: T0 + 120_000 } });
    const report = await simulateCompetingCustomers(inventory, { productId: 'FS-001', customers: 3, latency: sameLatency });
    expect(report.outcomes.map((outcome) => [outcome.status, outcome.attempts])).toEqual([
      ['SALE_NOT_ACTIVE', 1],
      ['SALE_NOT_ACTIVE', 1],
      ['SALE_NOT_ACTIVE', 1],
    ]);
  });

  it('độ trễ mặc định (setTimeout) cũng không bán lố', async () => {
    const inventory = createTestEngine();
    const running = simulateCompetingCustomers(inventory, { productId: 'FS-001', customers: 12 });
    await vi.runAllTimersAsync();
    const report = await running;
    expect(report.reserved).toBe(5);
    expectInvariant(inventory.getSnapshot());
  });
});

describe('H3-E03: bấm thanh toán nhiều lần', () => {
  it('5 lần gửi cùng lúc: đúng 1 lần thành công, chỉ bán 1 suất', async () => {
    const inventory = createTestEngine();
    const checkout = new CheckoutEngine(inventory, () => new Promise((resolve) => setTimeout(resolve, 500)));
    const reservation = reserveNow(inventory, 'FS-002');

    const running = submitCheckoutRepeatedly(checkout, reservation.id, 5);
    await vi.advanceTimersByTimeAsync(500);
    const results = await running;

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok && result.error === 'CHECKOUT_IN_PROGRESS')).toHaveLength(4);
    expect(record(inventory, 'FS-002')).toMatchObject({ soldStock: 1, reservedStock: 0, availableStock: 2 });
  });
});
