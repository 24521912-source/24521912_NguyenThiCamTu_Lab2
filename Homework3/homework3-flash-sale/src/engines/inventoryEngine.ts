import type {
  InventoryEngineOptions,
  InventoryErrorCode,
  InventoryListener,
  InventoryRecord,
  InventorySnapshot,
  Product,
  ProductId,
} from '../contracts/inventory';
import type { Reservation, ReservationEvent, ReservationId, ReserveRequest } from '../contracts/reservation';
import { failure, success, type Result } from '../contracts/result';
import type { Clock, DurationMs, SaleWindow } from '../contracts/timer';
import { INITIAL_RESERVATION_STATUS, transition } from './reservationStateMachine';
import { getSalePhase } from './timerEngine';

type InventoryResult<T> = Result<T, InventoryErrorCode>;

const isNonNegativeInteger = (value: number) => Number.isInteger(value) && value >= 0;

/** Ném lỗi lập trình nếu sổ kho vi phạm bất biến (ENGINE_CONTRACTS §2). */
export function assertInvariant(record: InventoryRecord): void {
  const { totalStock, availableStock, reservedStock, soldStock } = record;
  const counts = [totalStock, availableStock, reservedStock, soldStock];
  if (!counts.every(isNonNegativeInteger) || totalStock !== availableStock + reservedStock + soldStock) {
    throw new Error(`Vi phạm bất biến kho của ${record.productId}: ${JSON.stringify(record)}`);
  }
}

/**
 * Chủ sở hữu DUY NHẤT của sổ kho và các đơn giữ hàng.
 * Mọi hàm thay đổi trạng thái đều đồng bộ (không await) → kiểm tra + cập nhật là một bước atomic trong event loop.
 * React chỉ đọc snapshot đã freeze qua getSnapshot()/getReservations() và subscribe().
 */
export class InventoryEngine {
  readonly saleWindow: SaleWindow;
  readonly lockDurationMs: DurationMs;
  private readonly now: Clock;
  private readonly products: ReadonlyMap<ProductId, Product>;
  private readonly records = new Map<ProductId, InventoryRecord>();
  private readonly reservations = new Map<ReservationId, Reservation>();
  private readonly expiryTimers = new Map<ReservationId, ReturnType<typeof setTimeout>>();
  private readonly listeners = new Set<InventoryListener>();
  private snapshot: InventorySnapshot = [];
  private reservationList: readonly Reservation[] = [];
  private nextReservationNumber = 1;
  private disposed = false;

  constructor({ products, initialStock, saleWindow, lockDurationMs, now = Date.now }: InventoryEngineOptions) {
    if (!(saleWindow.startsAt < saleWindow.endsAt)) throw new Error('saleWindow.startsAt phải trước endsAt');
    if (!(lockDurationMs > 0)) throw new Error('lockDurationMs phải > 0');
    this.saleWindow = saleWindow;
    this.lockDurationMs = lockDurationMs;
    this.now = now;
    this.products = new Map(products.map((product) => [product.id, product]));
    if (this.products.size !== products.length) throw new Error('Mã sản phẩm bị trùng');

    for (const { productId, totalStock } of initialStock) {
      if (!this.products.has(productId)) throw new Error(`Không có sản phẩm ${productId}`);
      if (this.records.has(productId)) throw new Error(`Tồn kho của ${productId} bị khai báo 2 lần`);
      const record = { productId, totalStock, availableStock: totalStock, reservedStock: 0, soldStock: 0, version: 0 };
      assertInvariant(record);
      this.records.set(productId, Object.freeze(record));
    }
    this.refreshSnapshots();
  }

  // ---------- Đọc ----------

  getSnapshot = (): InventorySnapshot => this.snapshot;

  getReservations = (): readonly Reservation[] => this.reservationList;

  getRecord(productId: ProductId): InventoryRecord | undefined {
    return this.records.get(productId);
  }

  getReservation(id: ReservationId): Reservation | undefined {
    return this.reservations.get(id);
  }

  getProduct(productId: ProductId): Product | undefined {
    return this.products.get(productId);
  }

  getProducts(): readonly Product[] {
    return [...this.products.values()];
  }

  subscribe = (listener: InventoryListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  // ---------- Ghi (đồng bộ = atomic) ----------

  /** H3-D01: giữ hàng có kiểm tra version (optimistic locking). */
  reserve({ customerId, productId, quantity, expectedVersion }: ReserveRequest): InventoryResult<Reservation> {
    const now = this.now();
    if (getSalePhase(this.saleWindow, now) !== 'ACTIVE') {
      return failure('SALE_NOT_ACTIVE', 'Flash sale chưa mở hoặc đã kết thúc');
    }
    const record = this.records.get(productId);
    const product = this.products.get(productId);
    if (!record || !product) return failure('UNKNOWN_PRODUCT', `Không có sản phẩm ${productId}`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.maxPerReservation) {
      return failure('INVALID_QUANTITY', `Số lượng phải là số nguyên từ 1 đến ${product.maxPerReservation}`);
    }
    if (expectedVersion !== record.version) {
      return failure(
        'VERSION_CONFLICT',
        `Tồn kho vừa thay đổi (bạn thấy phiên bản ${expectedVersion}, hiện tại là ${record.version})`,
      );
    }
    if (record.availableStock < quantity) {
      return failure('INSUFFICIENT_STOCK', `Chỉ còn ${record.availableStock} sản phẩm`);
    }

    const reservation: Reservation = Object.freeze({
      id: `R-${String(this.nextReservationNumber++).padStart(4, '0')}`,
      customerId,
      productId,
      quantity,
      status: INITIAL_RESERVATION_STATUS,
      createdAt: now,
      expiresAt: now + this.lockDurationMs,
    });
    this.writeRecord({
      ...record,
      availableStock: record.availableStock - quantity,
      reservedStock: record.reservedStock + quantity,
    });
    this.reservations.set(reservation.id, reservation);
    this.scheduleExpiry(reservation);
    this.publish();
    return success(reservation);
  }

  /** H3-D02: hủy giữ hàng, trả hàng về kho đúng một lần. */
  cancel(id: ReservationId): InventoryResult<Reservation> {
    return this.apply(id, 'CANCEL');
  }

  /** H3-E01: chốt đơn sau khi thanh toán: reserved → sold. Kiểm tra lại hạn ngay lúc commit. */
  commit(id: ReservationId): InventoryResult<Reservation> {
    return this.apply(id, 'COMMIT');
  }

  /** H3-D03: hết hạn mọi đơn ACTIVE đã tới hạn. Gọi lặp lại vô hại. Trả về số đơn vừa hết hạn. */
  expireDue(): number {
    const now = this.now();
    let expired = 0;
    for (const reservation of this.reservations.values()) {
      if (reservation.status === 'ACTIVE' && now >= reservation.expiresAt) {
        this.finish(reservation, 'EXPIRE');
        expired++;
      }
    }
    if (expired > 0) this.publish();
    return expired;
  }

  /** Hủy mọi timer hết hạn và listener. Gọi nhiều lần vẫn an toàn. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.expiryTimers.forEach((timer) => clearTimeout(timer));
    this.expiryTimers.clear();
    this.listeners.clear();
  }

  // ---------- Nội bộ ----------

  private apply(id: ReservationId, event: Exclude<ReservationEvent, 'EXPIRE'>): InventoryResult<Reservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) return failure('UNKNOWN_RESERVATION', `Không có đơn giữ hàng ${id}`);

    // Không tin timer: đơn đã quá hạn thì chuyển sang EXPIRED trước, rồi mới từ chối
    if (reservation.status === 'ACTIVE' && this.now() >= reservation.expiresAt) {
      this.finish(reservation, 'EXPIRE');
      this.publish();
      return failure('RESERVATION_EXPIRED', `Đơn ${id} đã hết thời gian giữ hàng`);
    }
    // Timer đã kịp chuyển sang EXPIRED trước đó: vẫn báo đúng lý do (hết hạn), không báo chung chung "chuyển trạng thái sai"
    if (reservation.status === 'EXPIRED') {
      return failure('RESERVATION_EXPIRED', `Đơn ${id} đã hết thời gian giữ hàng`);
    }

    const next = transition(reservation.status, event);
    if (!next.ok) return next;
    const updated = this.finish(reservation, event);
    this.publish();
    return success(updated);
  }

  /** Chuyển trạng thái đơn và dời số lượng giữa các ngăn kho. Chỉ gọi khi đơn đang ACTIVE. */
  private finish(reservation: Reservation, event: ReservationEvent): Reservation {
    const next = transition(reservation.status, event);
    if (!next.ok) throw new Error(next.message);
    const record = this.records.get(reservation.productId)!;
    const { quantity } = reservation;
    this.writeRecord(
      event === 'COMMIT'
        ? { ...record, reservedStock: record.reservedStock - quantity, soldStock: record.soldStock + quantity }
        : { ...record, reservedStock: record.reservedStock - quantity, availableStock: record.availableStock + quantity },
    );
    const updated: Reservation = Object.freeze({ ...reservation, status: next.value });
    this.reservations.set(updated.id, updated);
    this.clearExpiry(updated.id);
    return updated;
  }

  /** Mọi thay đổi sổ kho đi qua đây: tăng version (change.version là version cũ) và kiểm tra bất biến. */
  private writeRecord(change: InventoryRecord) {
    const record = Object.freeze({ ...change, version: change.version + 1 });
    assertInvariant(record);
    this.records.set(record.productId, record);
  }

  private scheduleExpiry(reservation: Reservation) {
    if (this.disposed) return;
    const delay = Math.max(0, reservation.expiresAt - this.now());
    const timer = setTimeout(() => {
      this.expiryTimers.delete(reservation.id);
      const current = this.reservations.get(reservation.id);
      if (current?.status !== 'ACTIVE') return;
      // Đồng hồ máy bị chỉnh lùi nên chưa tới hạn → hẹn lại; tới hạn rồi thì cho hết hạn
      if (this.now() < current.expiresAt) this.scheduleExpiry(current);
      else this.expireDue();
    }, delay);
    this.expiryTimers.set(reservation.id, timer);
  }

  private clearExpiry(id: ReservationId) {
    const timer = this.expiryTimers.get(id);
    if (timer !== undefined) clearTimeout(timer);
    this.expiryTimers.delete(id);
  }

  private refreshSnapshots() {
    this.snapshot = Object.freeze([...this.records.values()]);
    this.reservationList = Object.freeze([...this.reservations.values()]);
  }

  private publish() {
    this.refreshSnapshots();
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}
