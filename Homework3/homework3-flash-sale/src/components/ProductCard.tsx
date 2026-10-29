import { useId, useState } from 'react';
import type { InventoryRecord, Product } from '../contracts/inventory';
import { formatVnd } from '../data/products';

interface ProductCardProps {
  product: Product;
  record: InventoryRecord;
  saleActive: boolean;
  /** Gửi kèm version mà người dùng đang nhìn thấy (optimistic locking). */
  onReserve: (productId: string, quantity: number, expectedVersion: number) => void;
}

export function ProductCard({ product, record, saleActive, onReserve }: ProductCardProps) {
  const quantityId = useId();
  const [quantity, setQuantity] = useState(1);
  const soldOut = record.availableStock === 0;
  const maxQuantity = Math.max(1, Math.min(product.maxPerReservation, record.availableStock));
  const chosen = Math.min(quantity, maxQuantity);
  const canReserve = saleActive && !soldOut;
  const discount = Math.round((1 - product.salePrice / product.originalPrice) * 100);
  const reason = !saleActive ? 'Chưa tới giờ hoặc đã hết giờ sale' : soldOut ? 'Hết hàng' : '';

  return (
    <article className={`product-card${soldOut ? ' is-sold-out' : ''}`} aria-labelledby={`${product.id}-name`}>
      <p className="discount-badge">-{discount}%</p>
      <h3 id={`${product.id}-name`}>{product.name}</h3>
      <p className="muted">
        {product.brand} · Mã {product.id}
      </p>
      <p className="prices">
        <span className="sale-price">
          <span className="visually-hidden">Giá sale: </span>
          {formatVnd(product.salePrice)}
        </span>{' '}
        <del>
          <span className="visually-hidden">Giá gốc: </span>
          {formatVnd(product.originalPrice)}
        </del>
      </p>

      <dl className="stock">
        <div>
          <dt>Còn lại</dt>
          <dd>
            {record.availableStock}/{record.totalStock}
          </dd>
        </div>
        <div>
          <dt>Đang được giữ</dt>
          <dd>{record.reservedStock}</dd>
        </div>
        <div>
          <dt>Đã bán</dt>
          <dd>{record.soldStock}</dd>
        </div>
      </dl>
      {soldOut && <p className="sold-out-label">Hết hàng</p>}

      <div className="reserve-row">
        <label htmlFor={quantityId}>Số lượng</label>
        <select
          id={quantityId}
          value={chosen}
          onChange={(event) => setQuantity(Number(event.target.value))}
          disabled={!canReserve}
        >
          {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button
          type="button"
          // aria-disabled thay cho disabled: nút vẫn focus được và đọc được lý do
          aria-disabled={!canReserve}
          aria-describedby={reason ? `${product.id}-reason` : undefined}
          onClick={() => canReserve && onReserve(product.id, chosen, record.version)}
        >
          Giữ hàng
        </button>
      </div>
      {reason && (
        <p id={`${product.id}-reason`} className="muted small">
          {reason}
        </p>
      )}
    </article>
  );
}
