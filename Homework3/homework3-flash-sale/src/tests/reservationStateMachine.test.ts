import { describe, expect, it } from 'vitest';
import type { ReservationEvent, ReservationStatus } from '../contracts/reservation';
import { INITIAL_RESERVATION_STATUS, isTerminal, transition } from '../engines/reservationStateMachine';

const STATUSES: ReservationStatus[] = ['ACTIVE', 'COMMITTED', 'CANCELLED', 'EXPIRED'];
const EVENTS: ReservationEvent[] = ['COMMIT', 'CANCEL', 'EXPIRE'];

describe('H3-C03: máy trạng thái giữ hàng', () => {
  it('đơn mới luôn bắt đầu ở ACTIVE', () => {
    expect(INITIAL_RESERVATION_STATUS).toBe('ACTIVE');
  });

  it.each([
    ['COMMIT', 'COMMITTED'],
    ['CANCEL', 'CANCELLED'],
    ['EXPIRE', 'EXPIRED'],
  ] as const)('ACTIVE + %s → %s', (event, expected) => {
    expect(transition('ACTIVE', event)).toEqual({ ok: true, value: expected });
  });

  it('bảng đầy đủ: mọi cặp (trạng thái cuối, sự kiện) đều bị từ chối', () => {
    const terminal = STATUSES.filter((status) => status !== 'ACTIVE');
    for (const status of terminal) {
      for (const event of EVENTS) {
        const result = transition(status, event);
        expect(result.ok, `${status} + ${event}`).toBe(false);
        if (!result.ok) expect(result.error).toBe('INVALID_TRANSITION');
      }
    }
  });

  it('chặn thanh toán 2 lần, hủy sau thanh toán, hết hạn sau thanh toán', () => {
    expect(transition('COMMITTED', 'COMMIT').ok).toBe(false);
    expect(transition('COMMITTED', 'CANCEL').ok).toBe(false);
    expect(transition('COMMITTED', 'EXPIRE').ok).toBe(false);
  });

  it('chặn hủy 2 lần và hết hạn 2 lần (để không trả hàng về kho 2 lần)', () => {
    expect(transition('CANCELLED', 'CANCEL').ok).toBe(false);
    expect(transition('EXPIRED', 'EXPIRE').ok).toBe(false);
    expect(transition('EXPIRED', 'COMMIT').ok).toBe(false);
  });

  it('không trạng thái cuối nào quay lại ACTIVE', () => {
    for (const status of STATUSES) {
      for (const event of EVENTS) {
        const result = transition(status, event);
        if (result.ok) expect(result.value).not.toBe('ACTIVE');
      }
    }
  });

  it('isTerminal đúng với bảng', () => {
    expect(STATUSES.map(isTerminal)).toEqual([false, true, true, true]);
  });

  it('thông báo lỗi nêu rõ sự kiện và trạng thái', () => {
    const result = transition('COMMITTED', 'CANCEL');
    expect(!result.ok && result.message).toContain('CANCEL');
    expect(!result.ok && result.message).toContain('COMMITTED');
  });
});
