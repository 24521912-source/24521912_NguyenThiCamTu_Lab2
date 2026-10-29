import type { ProductId } from './inventory';
import type { EpochMs } from './timer';

export type ReservationId = string;

/** Người giữ hàng. Ứng dụng demo chỉ có 1 người dùng thật; các khách trong mô phỏng có id riêng. */
export type CustomerId = string;

/**
 * ACTIVE là trạng thái duy nhất còn "sống". 3 trạng thái còn lại là trạng thái cuối, không quay lại được.
 */
export type ReservationStatus = 'ACTIVE' | 'COMMITTED' | 'CANCELLED' | 'EXPIRED';

export type ReservationEvent = 'COMMIT' | 'CANCEL' | 'EXPIRE';

export interface Reservation {
  readonly id: ReservationId;
  readonly customerId: CustomerId;
  readonly productId: ProductId;
  readonly quantity: number;
  readonly status: ReservationStatus;
  readonly createdAt: EpochMs;
  /** Hạn giữ hàng TUYỆT ĐỐI. Còn hiệu lực khi now < expiresAt; đúng bằng expiresAt là đã hết hạn. */
  readonly expiresAt: EpochMs;
}

export interface ReserveRequest {
  readonly customerId: CustomerId;
  readonly productId: ProductId;
  readonly quantity: number;
  /** Phiên bản kho mà người mua đã nhìn thấy. Khác phiên bản hiện tại → VERSION_CONFLICT. */
  readonly expectedVersion: number;
}
