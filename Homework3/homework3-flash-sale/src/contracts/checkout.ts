import type { Reservation, ReservationId } from './reservation';

export type CheckoutErrorCode =
  | 'UNKNOWN_RESERVATION'
  | 'RESERVATION_NOT_ACTIVE'
  | 'RESERVATION_EXPIRED'
  | 'CHECKOUT_IN_PROGRESS'
  | 'PAYMENT_FAILED';

/** Bước thanh toán giả lập (không có thông tin thẻ thật). Reject = thanh toán thất bại. */
export type ProcessPayment = (reservation: Reservation) => Promise<void>;

export interface CheckoutReceipt {
  readonly reservationId: ReservationId;
  readonly productId: string;
  readonly quantity: number;
  readonly totalVnd: number;
  readonly paidAt: number;
}
