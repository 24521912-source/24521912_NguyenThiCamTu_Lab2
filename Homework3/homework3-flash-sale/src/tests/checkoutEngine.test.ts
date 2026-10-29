import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Reservation } from '../contracts/reservation';
import { CheckoutEngine } from '../engines/checkoutEngine';
import { LOCK_MS, T0, createTestEngine, expectInvariant, record, reserveNow } from './fixtures';

beforeEach(() => vi.useFakeTimers({ now: T0 }));
afterEach(() => vi.useRealTimers());

/** Thanh toán do test điều khiển: chỉ xong khi gọi pay()/decline(). */
function controlledPayment() {
  const pending: { resolve: () => void; reject: (error: Error) => void }[] = [];
  const processPayment = vi.fn(
    (reservation: Reservation) =>
      new Promise<void>((resolve, reject) => {
        void reservation;
        pending.push({ resolve, reject });
      }),
  );
  return {
    processPayment,
    pay: () => pending.shift()?.resolve(),
    decline: (message = 'Thẻ bị từ chối') => pending.shift()?.reject(new Error(message)),
  };
}

const instantPayment = () => Promise.resolve();

describe('H3-E01: thanh toán', () => {
  it('đơn hợp lệ: reserved → sold, có biên lai đúng tiền', async () => {
    const inventory = createTestEngine();
    const checkout = new CheckoutEngine(inventory, instantPayment);
    const reservation = reserveNow(inventory, 'FS-001', 2);

    const result = await checkout.checkout(reservation.id);

    expect(result).toMatchObject({ ok: true, value: { reservationId: reservation.id, quantity: 2, totalVnd: 222_000 } });
    expect(record(inventory, 'FS-001')).toMatchObject({ availableStock: 3, reservedStock: 0, soldStock: 2, version: 2 });
    expect(inventory.getReservation(reservation.id)?.status).toBe('COMMITTED');
  });

  it('đơn đã hết hạn bị chặn ngay từ đầu, không gọi thanh toán', async () => {
    const inventory = createTestEngine();
    const payment = vi.fn(instantPayment);
    const checkout = new CheckoutEngine(inventory, payment);
    const reservation = reserveNow(inventory, 'FS-001');
    vi.setSystemTime(reservation.expiresAt);

    expect(await checkout.checkout(reservation.id)).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
    expect(payment).not.toHaveBeenCalled();
    expect(record(inventory, 'FS-001')).toMatchObject({ availableStock: 5, soldStock: 0 });
  });

  it('đơn đã bị timer chuyển sang EXPIRED: vẫn báo RESERVATION_EXPIRED (cùng lý do như khi timer chạy trễ)', async () => {
    const inventory = createTestEngine();
    const checkout = new CheckoutEngine(inventory, instantPayment);
    const reservation = reserveNow(inventory, 'FS-001');
    vi.advanceTimersByTime(LOCK_MS);
    expect(inventory.getReservation(reservation.id)?.status).toBe('EXPIRED');
    expect(await checkout.checkout(reservation.id)).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
  });

  it('đơn đã hủy, đơn không tồn tại', async () => {
    const inventory = createTestEngine();
    const checkout = new CheckoutEngine(inventory, instantPayment);
    const reservation = reserveNow(inventory, 'FS-001');
    inventory.cancel(reservation.id);

    expect(await checkout.checkout(reservation.id)).toMatchObject({ ok: false, error: 'RESERVATION_NOT_ACTIVE' });
    expect(await checkout.checkout('R-9999')).toMatchObject({ ok: false, error: 'UNKNOWN_RESERVATION' });
  });

  it('thanh toán lần 2 sau khi đã xong bị từ chối, không bán thêm', async () => {
    const inventory = createTestEngine();
    const checkout = new CheckoutEngine(inventory, instantPayment);
    const reservation = reserveNow(inventory, 'FS-002');
    await checkout.checkout(reservation.id);

    expect(await checkout.checkout(reservation.id)).toMatchObject({ ok: false, error: 'RESERVATION_NOT_ACTIVE' });
    expect(record(inventory, 'FS-002').soldStock).toBe(1);
  });

  it('thanh toán thất bại: không bán, đơn vẫn ACTIVE để thử lại, không reject', async () => {
    const inventory = createTestEngine();
    const payment = controlledPayment();
    const checkout = new CheckoutEngine(inventory, payment.processPayment);
    const reservation = reserveNow(inventory, 'FS-001');

    const pending = checkout.checkout(reservation.id);
    payment.decline();
    expect(await pending).toMatchObject({ ok: false, error: 'PAYMENT_FAILED' });
    expect(inventory.getReservation(reservation.id)?.status).toBe('ACTIVE');
    expect(record(inventory, 'FS-001')).toMatchObject({ reservedStock: 1, soldStock: 0 });
    expect(checkout.isInFlight(reservation.id)).toBe(false);
  });
});

describe('H3-E03: thanh toán chạy đua', () => {
  it('đua với hết hạn: khóa hết hạn trong lúc chờ thanh toán → thất bại, hàng về kho, không bán', async () => {
    const inventory = createTestEngine();
    const payment = controlledPayment();
    const checkout = new CheckoutEngine(inventory, payment.processPayment);
    const reservation = reserveNow(inventory, 'FS-004');

    const pending = checkout.checkout(reservation.id);
    vi.advanceTimersByTime(LOCK_MS); // khóa hết hạn khi cổng thanh toán còn đang xử lý
    payment.pay();

    expect(await pending).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
    expect(record(inventory, 'FS-004')).toMatchObject({ availableStock: 2, reservedStock: 0, soldStock: 0 });
    expectInvariant(inventory.getSnapshot());
  });

  it('đua với hết hạn khi timer bị trễ: commit tự kiểm tra hạn', async () => {
    const inventory = createTestEngine();
    const payment = controlledPayment();
    const checkout = new CheckoutEngine(inventory, payment.processPayment);
    const reservation = reserveNow(inventory, 'FS-004');

    const pending = checkout.checkout(reservation.id);
    vi.setSystemTime(reservation.expiresAt + 1); // đồng hồ qua hạn nhưng timer chưa chạy
    payment.pay();

    expect(await pending).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
    expect(record(inventory, 'FS-004').soldStock).toBe(0);
  });

  it('đua với hủy: khách hủy trong lúc chờ thanh toán → thanh toán thất bại, không bán', async () => {
    const inventory = createTestEngine();
    const payment = controlledPayment();
    const checkout = new CheckoutEngine(inventory, payment.processPayment);
    const reservation = reserveNow(inventory, 'FS-001');

    const pending = checkout.checkout(reservation.id);
    expect(inventory.cancel(reservation.id).ok).toBe(true);
    payment.pay();

    expect(await pending).toMatchObject({ ok: false, error: 'RESERVATION_NOT_ACTIVE' });
    expect(record(inventory, 'FS-001')).toMatchObject({ availableStock: 5, soldStock: 0 });
  });

  it('bấm thanh toán 2 lần khi lần đầu chưa xong: lần 2 bị chặn, chỉ gọi thanh toán 1 lần', async () => {
    const inventory = createTestEngine();
    const payment = controlledPayment();
    const checkout = new CheckoutEngine(inventory, payment.processPayment);
    const reservation = reserveNow(inventory, 'FS-001');

    const first = checkout.checkout(reservation.id);
    const second = await checkout.checkout(reservation.id);
    payment.pay();

    expect(second).toMatchObject({ ok: false, error: 'CHECKOUT_IN_PROGRESS' });
    expect(await first).toMatchObject({ ok: true });
    expect(payment.processPayment).toHaveBeenCalledTimes(1);
    expect(record(inventory, 'FS-001').soldStock).toBe(1);
  });
});
