import type { Clock, DurationMs, SaleWindow } from './timer';

export type ProductId = string;

/** Giá tính bằng đồng (VND), số nguyên. */
export type Vnd = number;

export interface Product {
  readonly id: ProductId;
  readonly name: string;
  readonly brand: string;
  readonly originalPrice: Vnd;
  readonly salePrice: Vnd;
  /** Số lượng tối đa một lần giữ hàng. */
  readonly maxPerReservation: number;
}

/**
 * Sổ kho của một sản phẩm. Bất biến: totalStock = availableStock + reservedStock + soldStock,
 * mọi số lượng là số nguyên >= 0.
 * version tăng 1 sau MỖI thay đổi thành công của bản ghi (giữ, hủy, hết hạn, thanh toán).
 */
export interface InventoryRecord {
  readonly productId: ProductId;
  readonly totalStock: number;
  readonly availableStock: number;
  readonly reservedStock: number;
  readonly soldStock: number;
  readonly version: number;
}

/** Ảnh chụp chỉ-đọc (đã freeze) cho React. Giữ nguyên tham chiếu cho tới khi kho thay đổi. */
export type InventorySnapshot = readonly InventoryRecord[];

export interface InitialStock {
  readonly productId: ProductId;
  readonly totalStock: number;
}

export interface InventoryEngineOptions {
  products: readonly Product[];
  initialStock: readonly InitialStock[];
  saleWindow: SaleWindow;
  /** Thời gian giữ hàng (khóa) tính từ lúc giữ. */
  lockDurationMs: DurationMs;
  now?: Clock;
}

export type InventoryErrorCode =
  | 'UNKNOWN_PRODUCT'
  | 'INVALID_QUANTITY'
  | 'INSUFFICIENT_STOCK'
  | 'VERSION_CONFLICT'
  | 'SALE_NOT_ACTIVE'
  | 'UNKNOWN_RESERVATION'
  | 'INVALID_TRANSITION'
  | 'RESERVATION_EXPIRED';

export type InventoryListener = (snapshot: InventorySnapshot) => void;
