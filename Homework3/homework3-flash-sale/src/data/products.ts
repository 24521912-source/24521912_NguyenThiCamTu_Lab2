import type { InitialStock, Product } from '../contracts/inventory';

// Dữ liệu hư cấu, cố định (không random) để test lặp lại được. Thương hiệu không có thật.
export const PRODUCTS: readonly Product[] = Object.freeze([
  { id: 'FS-001', name: 'Tai nghe không dây Sóng Âm Air 3', brand: 'Sóng Âm', originalPrice: 1_490_000, salePrice: 111_000, maxPerReservation: 2 },
  { id: 'FS-002', name: 'Nồi chiên không dầu Bếp Việt 6L', brand: 'Bếp Việt', originalPrice: 2_390_000, salePrice: 1_111_000, maxPerReservation: 1 },
  { id: 'FS-003', name: 'Sạc dự phòng Lúa Vàng 20.000 mAh', brand: 'Lúa Vàng', originalPrice: 690_000, salePrice: 211_000, maxPerReservation: 3 },
  { id: 'FS-004', name: 'Đồng hồ thông minh Sao Mai S2', brand: 'Sao Mai', originalPrice: 3_990_000, salePrice: 1_911_000, maxPerReservation: 1 },
].map((product) => Object.freeze(product)));

/** Ban đầu toàn bộ hàng ở trạng thái available: reserved = sold = 0, version = 0. */
export const INITIAL_STOCK: readonly InitialStock[] = Object.freeze([
  { productId: 'FS-001', totalStock: 5 },
  { productId: 'FS-002', totalStock: 3 },
  { productId: 'FS-003', totalStock: 10 },
  { productId: 'FS-004', totalStock: 2 },
]);

/**
 * Thời gian rút gọn cho bản demo: sale "nửa đêm 11.11" mở sau 10 giây, kéo dài 3 phút,
 * mỗi lần giữ hàng được khóa 30 giây. Ngoài đời thường là 00:00 và giữ hàng 10–15 phút.
 */
export const FLASH_SALE_TIMING = Object.freeze({
  opensInMs: 10_000,
  durationMs: 3 * 60_000,
  lockDurationMs: 30_000,
});

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

/** 111000 → "111.000 ₫" */
export const formatVnd = (amount: number): string => vnd.format(amount);
