import { failure, success, type Result } from '../contracts/result';
import type { ReservationEvent, ReservationStatus } from '../contracts/reservation';

/**
 * Bảng chuyển trạng thái. Chỉ ACTIVE có cạnh đi ra; 3 trạng thái còn lại là trạng thái cuối.
 * Partial: trạng thái nào không có trong bảng thì không nhận sự kiện nào.
 */
const TRANSITIONS: Readonly<Partial<Record<ReservationStatus, Readonly<Record<ReservationEvent, ReservationStatus>>>>> = {
  ACTIVE: { COMMIT: 'COMMITTED', CANCEL: 'CANCELLED', EXPIRE: 'EXPIRED' },
};

/** Trạng thái khởi tạo của mọi đơn giữ hàng mới (tạo đơn, không phải chuyển trạng thái). */
export const INITIAL_RESERVATION_STATUS: ReservationStatus = 'ACTIVE';

export const isTerminal = (status: ReservationStatus): boolean => TRANSITIONS[status] === undefined;

/** Hàm thuần: không đụng tới kho. InventoryEngine dùng kết quả này để quyết định có trả/bán hàng hay không. */
export function transition(
  status: ReservationStatus,
  event: ReservationEvent,
): Result<ReservationStatus, 'INVALID_TRANSITION'> {
  const next = TRANSITIONS[status]?.[event];
  return next
    ? success(next)
    : failure('INVALID_TRANSITION', `Không thể ${event} một đơn giữ hàng đang ở trạng thái ${status}`);
}
