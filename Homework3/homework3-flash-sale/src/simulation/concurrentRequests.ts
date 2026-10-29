import type { InventoryErrorCode, ProductId } from '../contracts/inventory';
import type { ReservationId } from '../contracts/reservation';
import type { CheckoutEngine, CheckoutResult } from '../engines/checkoutEngine';
import type { InventoryEngine } from '../engines/inventoryEngine';

export const DEFAULT_MAX_RETRIES = 3;

export type CustomerStatus = 'RESERVED' | 'RETRY_LIMIT' | 'ERROR' | Exclude<InventoryErrorCode, 'VERSION_CONFLICT'>;

export interface CustomerOutcome {
  customer: number;
  status: CustomerStatus;
  /** Số lần gọi reserve (lần đầu + số lần thử lại). */
  attempts: number;
  reservationId?: ReservationId;
}

export interface CompetitionReport {
  outcomes: CustomerOutcome[];
  reserved: number;
  versionConflicts: number;
}

export interface CompetitionOptions {
  productId: ProductId;
  customers: number;
  quantity?: number;
  maxRetries?: number;
  /** Độ trễ mạng giả lập giữa lúc đọc version và lúc gửi yêu cầu. Test truyền vào để điều khiển thứ tự. */
  latency?: (customer: number, attempt: number) => Promise<void>;
}

/** Độ trễ cố định theo số thứ tự khách (không random) để mô phỏng lặp lại được. */
const defaultLatency = (customer: number, attempt: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ((customer * 37 + attempt * 11) % 50) + 5));

/**
 * Nhiều khách cùng lúc: mỗi khách đọc version → chờ mạng → reserve(expectedVersion).
 * Gặp VERSION_CONFLICT thì đọc lại và thử tiếp, tối đa maxRetries lần (retry có giới hạn, ENGINE_CONTRACTS §8).
 */
export async function simulateCompetingCustomers(
  inventory: InventoryEngine,
  { productId, customers, quantity = 1, maxRetries = DEFAULT_MAX_RETRIES, latency = defaultLatency }: CompetitionOptions,
): Promise<CompetitionReport> {
  let versionConflicts = 0;

  async function runCustomer(customer: number): Promise<CustomerOutcome> {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const record = inventory.getRecord(productId);
      if (!record) return { customer, status: 'UNKNOWN_PRODUCT', attempts: attempt };
      const seenVersion = record.version;
      await latency(customer, attempt);

      const result = inventory.reserve({ customerId: `khach-${customer}`, productId, quantity, expectedVersion: seenVersion });
      if (result.ok) return { customer, status: 'RESERVED', attempts: attempt, reservationId: result.value.id };
      if (result.error !== 'VERSION_CONFLICT') return { customer, status: result.error, attempts: attempt };
      versionConflicts++;
    }
    return { customer, status: 'RETRY_LIMIT', attempts: maxRetries + 1 };
  }

  // allSettled: một khách lỗi bất ngờ không làm hỏng cả đợt, không có unhandled rejection
  const settled = await Promise.allSettled(Array.from({ length: customers }, (_, index) => runCustomer(index + 1)));
  const outcomes = settled.map((entry, index): CustomerOutcome =>
    entry.status === 'fulfilled' ? entry.value : { customer: index + 1, status: 'ERROR', attempts: 0 },
  );
  return { outcomes, reserved: outcomes.filter((outcome) => outcome.status === 'RESERVED').length, versionConflicts };
}

/** Bấm "Thanh toán" nhiều lần liên tiếp cho cùng một đơn (ví dụ double-click, mạng lag). */
export function submitCheckoutRepeatedly(
  checkout: CheckoutEngine,
  reservationId: ReservationId,
  times: number,
): Promise<CheckoutResult[]> {
  return Promise.all(Array.from({ length: times }, () => checkout.checkout(reservationId)));
}
