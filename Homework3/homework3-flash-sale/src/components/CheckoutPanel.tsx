import { useRef, useState, type FormEvent } from 'react';
import type { Product } from '../contracts/inventory';
import type { Reservation } from '../contracts/reservation';
import type { CheckoutResult } from '../engines/checkoutEngine';
import { formatVnd } from '../data/products';

interface CheckoutPanelProps {
  activeReservations: readonly Reservation[];
  products: ReadonlyMap<string, Product>;
  onCheckout: (reservationId: string) => Promise<CheckoutResult>;
}

export function CheckoutPanel({ activeReservations, products, onCheckout }: CheckoutPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Cờ đồng bộ: state `pending` chỉ đổi sau khi React render lại, nên 2 cú click liền nhau đều thấy pending = false
  const submitting = useRef(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  // Đơn đã chọn không còn ACTIVE (hết hạn, bị hủy) → tự chọn đơn đầu tiên còn hiệu lực
  const selected = activeReservations.find((r) => r.id === selectedId) ?? activeReservations[0];
  const canSubmit = !pending && selected !== undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Chặn bấm/Enter liên tục ngay ở UI; engine cũng chặn thêm một lớp (CHECKOUT_IN_PROGRESS)
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setResult(null);
    try {
      setResult(await onCheckout(selected.id));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="checkout-title">
      <h2 id="checkout-title">Thanh toán</h2>
      <p className="muted small">Thanh toán giả lập, không cần và không thu thập thông tin thẻ.</p>
      <form onSubmit={handleSubmit}>
        {activeReservations.length === 0 ? (
          <p className="muted">Không có đơn nào đang giữ để thanh toán.</p>
        ) : (
          <fieldset>
            <legend>Chọn đơn giữ hàng</legend>
            {activeReservations.map((reservation) => {
              const product = products.get(reservation.productId);
              return (
                <label key={reservation.id} className="radio-row">
                  <input
                    type="radio"
                    name="reservation"
                    value={reservation.id}
                    checked={selected?.id === reservation.id}
                    onChange={() => setSelectedId(reservation.id)}
                  />
                  {product?.name ?? reservation.productId} × {reservation.quantity} —{' '}
                  {formatVnd((product?.salePrice ?? 0) * reservation.quantity)}
                </label>
              );
            })}
          </fieldset>
        )}
        <button type="submit" aria-disabled={!canSubmit}>
          {pending ? 'Đang thanh toán…' : 'Thanh toán'}
        </button>
      </form>

      <div role="status" className="checkout-result">
        {pending && <p>Đang xử lý thanh toán…</p>}
        {result?.ok && (
          <p className="notice notice-success">
            <strong>Thành công:</strong> đã thanh toán {formatVnd(result.value.totalVnd)} cho đơn {result.value.reservationId}.
          </p>
        )}
        {result && !result.ok && (
          <p className="notice notice-error">
            <strong>Thất bại:</strong> {result.message}
          </p>
        )}
      </div>
    </section>
  );
}
