import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FrameScheduler } from '../contracts/timer';
import { CheckoutEngine } from '../engines/checkoutEngine';
import { createDeadlineTimer, getSalePhase } from '../engines/timerEngine';
import { simulateCompetingCustomers, submitCheckoutRepeatedly } from '../simulation/concurrentRequests';
import { LOCK_MS, T0, TEST_CUSTOMER, createTestEngine, expectInvariant, record, reserveNow } from './fixtures';

const OPENS_IN = 10_000;
const DURATION = 3 * 60_000;
const PAYMENT_MS = 1_200;

// Frame giả 16ms chạy bằng fake timers, để đồng hồ countdown và kho dùng chung một dòng thời gian
const fakeFrames: FrameScheduler = {
  request: (callback) => setTimeout(callback, 16) as unknown as number,
  cancel: (id) => clearTimeout(id),
};

beforeEach(() => vi.useFakeTimers({ now: T0 }));
afterEach(() => vi.useRealTimers());

function setup() {
  const saleWindow = { startsAt: T0 + OPENS_IN, endsAt: T0 + OPENS_IN + DURATION };
  const inventory = createTestEngine({ saleWindow });
  const checkout = new CheckoutEngine(inventory, () => new Promise((resolve) => setTimeout(resolve, PAYMENT_MS)));
  return { inventory, checkout, saleWindow };
}

const reserveFor = (inventory: ReturnType<typeof setup>['inventory'], productId: string) =>
  inventory.reserve({ customerId: TEST_CUSTOMER, productId, quantity: 1, expectedVersion: record(inventory, productId).version });

describe('H3-G02: toàn bộ vòng đời flash sale', () => {
  it('đồng hồ mở sale đúng mốc startsAt; giữ hàng trước giờ mở bị từ chối, đúng giờ mở thì được', () => {
    const { inventory, saleWindow } = setup();
    const ticks: number[] = [];
    let openedAt = 0;
    createDeadlineTimer({
      targetTime: saleWindow.startsAt,
      onTick: (ms) => ticks.push(ms),
      onComplete: () => (openedAt = Date.now()),
      scheduler: fakeFrames,
    });

    vi.advanceTimersByTime(OPENS_IN - 100);
    expect(getSalePhase(saleWindow, Date.now())).toBe('PENDING');
    expect(reserveFor(inventory, 'FS-001')).toMatchObject({ ok: false, error: 'SALE_NOT_ACTIVE' });

    vi.advanceTimersByTime(200);
    expect(openedAt).toBeGreaterThanOrEqual(saleWindow.startsAt);
    expect(openedAt - saleWindow.startsAt).toBeLessThan(16); // trễ tối đa 1 frame, không cộng dồn
    expect(ticks.at(-1)).toBe(0);
    expect(Math.min(...ticks)).toBe(0);
    expect(getSalePhase(saleWindow, Date.now())).toBe('ACTIVE');
    expect(reserveFor(inventory, 'FS-001').ok).toBe(true);
  });

  it('giữ → thanh toán thành công: hàng chuyển sang đã bán và ở nguyên đó cả khi qua hạn khóa', async () => {
    const { inventory, checkout } = setup();
    vi.setSystemTime(T0 + OPENS_IN);
    const reservation = reserveNow(inventory, 'FS-002');
    expect(record(inventory, 'FS-002')).toMatchObject({ availableStock: 2, reservedStock: 1 });

    const paying = checkout.checkout(reservation.id);
    await vi.advanceTimersByTimeAsync(PAYMENT_MS);
    expect(await paying).toMatchObject({ ok: true, value: { totalVnd: 1_111_000 } });

    await vi.advanceTimersByTimeAsync(LOCK_MS * 3);
    expect(record(inventory, 'FS-002')).toMatchObject({ availableStock: 2, reservedStock: 0, soldStock: 1 });
    expect(inventory.getReservation(reservation.id)?.status).toBe('COMMITTED');
  });

  it('giữ → không thanh toán → hết hạn đúng mốc → thanh toán sau đó thất bại, hàng đã về kho', async () => {
    const { inventory, checkout } = setup();
    vi.setSystemTime(T0 + OPENS_IN);
    const reservation = reserveNow(inventory, 'FS-001', 2);

    await vi.advanceTimersByTimeAsync(LOCK_MS - 1);
    expect(record(inventory, 'FS-001').reservedStock).toBe(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(record(inventory, 'FS-001')).toMatchObject({ availableStock: 5, reservedStock: 0 });
    expect(await checkout.checkout(reservation.id)).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
  });

  it('giữ → hủy: hàng về kho; giữ lại được ngay', () => {
    const { inventory } = setup();
    vi.setSystemTime(T0 + OPENS_IN);
    const reservation = reserveNow(inventory, 'FS-004');
    reserveNow(inventory, 'FS-004');
    expect(reserveFor(inventory, 'FS-004')).toMatchObject({ ok: false, error: 'INSUFFICIENT_STOCK' });

    expect(inventory.cancel(reservation.id).ok).toBe(true);
    expect(reserveFor(inventory, 'FS-004').ok).toBe(true);
    expectInvariant(inventory.getSnapshot());
  });

  it('tranh mua + bấm thanh toán nhiều lần + hết hạn: không bán lố, không bán trùng, bất biến luôn đúng', async () => {
    const { inventory, checkout } = setup();
    vi.setSystemTime(T0 + OPENS_IN);

    const mine = reserveNow(inventory, 'FS-001');
    const competing = simulateCompetingCustomers(inventory, { productId: 'FS-001', customers: 15 });
    // Mỗi khách tối đa 4 lần thử, mỗi lần trễ tối đa 55ms → 1 giây là đủ cho tất cả kết thúc
    await vi.advanceTimersByTimeAsync(1_000);
    const report = await competing;
    expect(report.reserved).toBe(4); // 5 cái: 1 của mình + 4 khách khác
    expect(record(inventory, 'FS-001')).toMatchObject({ availableStock: 0, reservedStock: 5 });

    const paying = submitCheckoutRepeatedly(checkout, mine.id, 3);
    await vi.advanceTimersByTimeAsync(PAYMENT_MS);
    expect((await paying).filter((result) => result.ok)).toHaveLength(1);
    expectInvariant(inventory.getSnapshot());

    // Khách khác không thanh toán → hết hạn, 4 cái về kho
    await vi.advanceTimersByTimeAsync(LOCK_MS);
    expect(record(inventory, 'FS-001')).toMatchObject({ availableStock: 4, reservedStock: 0, soldStock: 1, totalStock: 5 });
    expectInvariant(inventory.getSnapshot());
  });

  it('sale đóng đúng endsAt: không giữ mới được, nhưng đơn còn hạn khóa vẫn thanh toán được', async () => {
    const { inventory, checkout, saleWindow } = setup();
    vi.setSystemTime(saleWindow.endsAt - 5_000);
    const lastMinute = reserveNow(inventory, 'FS-003');

    vi.setSystemTime(saleWindow.endsAt);
    expect(getSalePhase(saleWindow, Date.now())).toBe('ENDED');
    expect(reserveFor(inventory, 'FS-003')).toMatchObject({ ok: false, error: 'SALE_NOT_ACTIVE' });

    const paying = checkout.checkout(lastMinute.id);
    await vi.advanceTimersByTimeAsync(PAYMENT_MS);
    expect(await paying).toMatchObject({ ok: true });
    expect(record(inventory, 'FS-003').soldStock).toBe(1);
  });
});
