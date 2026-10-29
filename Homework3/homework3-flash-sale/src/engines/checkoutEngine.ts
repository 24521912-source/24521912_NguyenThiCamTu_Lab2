import type { CheckoutErrorCode, CheckoutReceipt, ProcessPayment } from '../contracts/checkout';
import type { InventoryErrorCode } from '../contracts/inventory';
import type { ReservationId } from '../contracts/reservation';
import { failure, success, type Result } from '../contracts/result';
import type { Clock } from '../contracts/timer';
import type { InventoryEngine } from './inventoryEngine';

export type CheckoutResult = Result<CheckoutReceipt, CheckoutErrorCode>;

/** Đổi lỗi của bước commit trong kho sang lỗi của checkout. */
const COMMIT_ERRORS: Partial<Record<InventoryErrorCode, CheckoutErrorCode>> = {
  UNKNOWN_RESERVATION: 'UNKNOWN_RESERVATION',
  RESERVATION_EXPIRED: 'RESERVATION_EXPIRED',
  INVALID_TRANSITION: 'RESERVATION_NOT_ACTIVE',
};

/**
 * Thanh toán một đơn giữ hàng: kiểm tra trước → chờ thanh toán (bất đồng bộ) → commit vào kho.
 * Không giữ trạng thái kho; kho vẫn do InventoryEngine sở hữu. Chỉ nhớ các đơn đang thanh toán dở để chặn bấm 2 lần.
 */
export class CheckoutEngine {
  private readonly inventory: InventoryEngine;
  private readonly processPayment: ProcessPayment;
  private readonly now: Clock;
  private readonly inFlight = new Set<ReservationId>();

  constructor(inventory: InventoryEngine, processPayment: ProcessPayment, now: Clock = Date.now) {
    this.inventory = inventory;
    this.processPayment = processPayment;
    this.now = now;
  }

  isInFlight = (id: ReservationId): boolean => this.inFlight.has(id);

  /** Luôn resolve với Result, không bao giờ reject. */
  async checkout(id: ReservationId): Promise<CheckoutResult> {
    if (this.inFlight.has(id)) return failure('CHECKOUT_IN_PROGRESS', 'Đơn này đang được thanh toán');

    const reservation = this.inventory.getReservation(id);
    if (!reservation) return failure('UNKNOWN_RESERVATION', `Không có đơn giữ hàng ${id}`);
    // Hết hạn dù timer đã chạy (EXPIRED) hay chưa (ACTIVE nhưng quá giờ) đều báo cùng một lý do
    const expired =
      reservation.status === 'EXPIRED' || (reservation.status === 'ACTIVE' && this.now() >= reservation.expiresAt);
    if (expired) {
      this.inventory.expireDue();
      return failure('RESERVATION_EXPIRED', 'Đã hết thời gian giữ hàng');
    }
    if (reservation.status !== 'ACTIVE') {
      return failure('RESERVATION_NOT_ACTIVE', `Đơn đang ở trạng thái ${reservation.status}, không thể thanh toán`);
    }

    this.inFlight.add(id);
    try {
      try {
        await this.processPayment(reservation);
      } catch (error) {
        return failure('PAYMENT_FAILED', `Thanh toán thất bại: ${error instanceof Error ? error.message : String(error)}`);
      }
      // Trong lúc chờ thanh toán, đơn có thể đã hết hạn hoặc bị hủy → commit tự kiểm tra lại tại thời điểm này
      const committed = this.inventory.commit(id);
      if (!committed.ok) return failure(COMMIT_ERRORS[committed.error] ?? 'RESERVATION_NOT_ACTIVE', committed.message);

      const product = this.inventory.getProduct(committed.value.productId);
      return success({
        reservationId: id,
        productId: committed.value.productId,
        quantity: committed.value.quantity,
        totalVnd: (product?.salePrice ?? 0) * committed.value.quantity,
        paidAt: this.now(),
      });
    } finally {
      this.inFlight.delete(id);
    }
  }
}

/** Thanh toán giả lập cho bản demo: chờ một khoảng rồi thành công. Không có thông tin thẻ thật. */
export const simulatedPayment =
  (delayMs: number): ProcessPayment =>
  () =>
    new Promise((resolve) => setTimeout(resolve, delayMs));
