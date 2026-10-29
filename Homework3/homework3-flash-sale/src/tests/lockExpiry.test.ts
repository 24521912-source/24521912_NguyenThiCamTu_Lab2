import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCK_MS, T0, createTestEngine, expectInvariant, record, reserveNow } from './fixtures';

beforeEach(() => vi.useFakeTimers({ now: T0 }));
afterEach(() => vi.useRealTimers());

describe('H3-D03: hết hạn khóa giữ hàng', () => {
  it('timer tự hết hạn đúng mốc: 1ms trước còn ACTIVE, đúng mốc thì EXPIRED và trả hàng', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-001', 2);

    vi.advanceTimersByTime(LOCK_MS - 1);
    expect(engine.getReservation(reservation.id)?.status).toBe('ACTIVE');

    vi.advanceTimersByTime(1);
    expect(engine.getReservation(reservation.id)?.status).toBe('EXPIRED');
    expect(record(engine, 'FS-001')).toMatchObject({ availableStock: 5, reservedStock: 0, version: 2 });
  });

  it('đúng mốc expiresAt là đã hết hạn: commit/cancel tại đúng mốc bị từ chối', () => {
    const engine = createTestEngine();
    const a = reserveNow(engine, 'FS-003');
    const b = reserveNow(engine, 'FS-003');
    vi.setSystemTime(a.expiresAt); // đổi giờ nhưng KHÔNG chạy timer

    expect(engine.commit(a.id)).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
    expect(engine.cancel(b.id)).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
    expect(record(engine, 'FS-003')).toMatchObject({ availableStock: 10, reservedStock: 0, soldStock: 0 });
  });

  it('timer bị trễ (tab ngủ) không kéo dài thời gian giữ hàng: kiểm tra hạn ngay khi thao tác', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-002');
    // Đồng hồ đi tiếp 2 phút nhưng setTimeout chưa kịp chạy
    vi.setSystemTime(T0 + 2 * 60_000);
    expect(engine.getReservation(reservation.id)?.status).toBe('ACTIVE'); // chưa ai kiểm tra
    expect(engine.commit(reservation.id)).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
    expect(engine.getReservation(reservation.id)?.status).toBe('EXPIRED');
    expect(record(engine, 'FS-002').soldStock).toBe(0);
  });

  it('đơn đã bị timer chuyển sang EXPIRED: hủy/commit sau đó vẫn báo RESERVATION_EXPIRED, không phải lỗi chung chung', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-001');
    vi.advanceTimersByTime(LOCK_MS);
    expect(engine.getReservation(reservation.id)?.status).toBe('EXPIRED');
    expect(engine.cancel(reservation.id)).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
    expect(engine.commit(reservation.id)).toMatchObject({ ok: false, error: 'RESERVATION_EXPIRED' });
  });

  it('hết hạn (do timer hoặc do thao tác) đều báo cho subscriber và cập nhật snapshot mà React đọc', () => {
    const engine = createTestEngine();
    const listener = vi.fn();
    engine.subscribe(listener);
    const byTimer = reserveNow(engine, 'FS-001');
    const lazy = reserveNow(engine, 'FS-003');
    listener.mockClear();

    vi.advanceTimersByTime(LOCK_MS); // cả 2 đơn tới hạn, timer chạy
    expect(listener).toHaveBeenCalled();
    const fromSnapshot = (id: string) => engine.getSnapshot().find((r) => r.productId === id);
    expect(fromSnapshot('FS-001')).toMatchObject({ availableStock: 5, reservedStock: 0 });
    expect(engine.getReservations().find((r) => r.id === byTimer.id)?.status).toBe('EXPIRED');
    expect(engine.getReservations().find((r) => r.id === lazy.id)?.status).toBe('EXPIRED');

    // Hết hạn "lười" khi thao tác (timer chưa chạy)
    const late = reserveNow(engine, 'FS-002');
    listener.mockClear();
    vi.setSystemTime(late.expiresAt);
    engine.cancel(late.id);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(fromSnapshot('FS-002')).toMatchObject({ availableStock: 3, reservedStock: 0 });
    expect(engine.getReservations().find((r) => r.id === late.id)?.status).toBe('EXPIRED');
  });

  it('kiểm tra hết hạn nhiều lần không trả hàng 2 lần', () => {
    const engine = createTestEngine();
    reserveNow(engine, 'FS-001', 2);
    vi.setSystemTime(T0 + LOCK_MS);

    expect(engine.expireDue()).toBe(1);
    const after = record(engine, 'FS-001');
    expect(engine.expireDue()).toBe(0);
    vi.runAllTimers(); // timer gốc chạy muộn sau đó
    expect(record(engine, 'FS-001')).toBe(after);
    expect(after).toMatchObject({ availableStock: 5, reservedStock: 0 });
  });

  it('đơn đã thanh toán không bị hết hạn ngược', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-004');
    engine.commit(reservation.id);
    vi.advanceTimersByTime(LOCK_MS * 2);
    engine.expireDue();

    expect(engine.getReservation(reservation.id)?.status).toBe('COMMITTED');
    expect(record(engine, 'FS-004')).toMatchObject({ soldStock: 1, availableStock: 1, reservedStock: 0 });
  });

  it('đơn đã hủy: timer hết hạn bị gỡ, không trả hàng lần nữa', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-001');
    engine.cancel(reservation.id);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(LOCK_MS);
    expect(engine.getReservation(reservation.id)?.status).toBe('CANCELLED');
    expect(record(engine, 'FS-001').availableStock).toBe(5);
  });

  it('nhiều đơn, nhiều mốc khác nhau: mỗi đơn hết hạn đúng mốc của nó', () => {
    const engine = createTestEngine();
    const first = reserveNow(engine, 'FS-003');
    vi.advanceTimersByTime(10_000);
    const second = reserveNow(engine, 'FS-003');

    vi.advanceTimersByTime(LOCK_MS - 10_000);
    expect(engine.getReservation(first.id)?.status).toBe('EXPIRED');
    expect(engine.getReservation(second.id)?.status).toBe('ACTIVE');
    vi.advanceTimersByTime(10_000);
    expect(engine.getReservation(second.id)?.status).toBe('EXPIRED');
    expectInvariant(engine.getSnapshot());
  });

  it('đồng hồ máy bị chỉnh lùi: timer chạy nhưng chưa tới hạn thì hẹn lại, không hết hạn sớm', () => {
    const engine = createTestEngine();
    const reservation = reserveNow(engine, 'FS-001');
    vi.advanceTimersByTime(LOCK_MS - 5_000);
    vi.setSystemTime(T0); // chỉnh lùi 25 giây
    vi.advanceTimersByTime(5_000); // timer gốc chạy, nhưng now = T0 + 5s < expiresAt
    expect(engine.getReservation(reservation.id)?.status).toBe('ACTIVE');
    vi.advanceTimersByTime(25_000);
    expect(engine.getReservation(reservation.id)?.status).toBe('EXPIRED');
  });

  it('dispose gỡ hết timer hết hạn', () => {
    const engine = createTestEngine();
    reserveNow(engine, 'FS-001');
    reserveNow(engine, 'FS-003');
    expect(vi.getTimerCount()).toBe(2);
    engine.dispose();
    engine.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
});
