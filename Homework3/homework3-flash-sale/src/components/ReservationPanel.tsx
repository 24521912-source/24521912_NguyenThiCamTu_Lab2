import type { Product } from '../contracts/inventory';
import type { Reservation, ReservationStatus } from '../contracts/reservation';
import { formatSeconds, useCountdown } from '../hooks/useCountdown';

const STATUS_TEXT: Record<ReservationStatus, string> = {
  ACTIVE: 'Đang giữ',
  COMMITTED: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ',
};

interface ReservationPanelProps {
  reservations: readonly Reservation[];
  products: ReadonlyMap<string, Product>;
  onCancel: (reservationId: string) => void;
}

/** Thời gian giữ hàng còn lại. Chỉ để hiển thị: việc hết hạn do engine quyết định, không phụ thuộc đồng hồ này. */
function LockTimer({ expiresAt }: { expiresAt: number }) {
  const seconds = useCountdown(expiresAt);
  return <span className="lock-timer">Còn {formatSeconds(seconds)}</span>;
}

export function ReservationPanel({ reservations, products, onCancel }: ReservationPanelProps) {
  const newestFirst = [...reservations].reverse();
  return (
    <section className="panel" aria-labelledby="reservations-title">
      <h2 id="reservations-title">Đơn giữ hàng của bạn</h2>
      {newestFirst.length === 0 ? (
        <p className="muted">Chưa giữ sản phẩm nào.</p>
      ) : (
        <ul className="reservation-list">
          {newestFirst.map((reservation) => (
            <li key={reservation.id} className={`reservation status-${reservation.status.toLowerCase()}`}>
              <div>
                <strong>{products.get(reservation.productId)?.name ?? reservation.productId}</strong>
                <p className="muted small">
                  {reservation.id} · Số lượng {reservation.quantity}
                </p>
              </div>
              <span className="status-badge">{STATUS_TEXT[reservation.status]}</span>
              {reservation.status === 'ACTIVE' && (
                <>
                  <LockTimer expiresAt={reservation.expiresAt} />
                  <button type="button" className="secondary" onClick={() => onCancel(reservation.id)}>
                    Hủy giữ hàng
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
