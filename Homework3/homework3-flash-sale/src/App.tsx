import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckoutPanel } from './components/CheckoutPanel';
import { CompetitionPanel } from './components/CompetitionPanel';
import { ProductList } from './components/ProductList';
import { ReservationPanel } from './components/ReservationPanel';
import { SaleCountdown } from './components/SaleCountdown';
import type { InventoryErrorCode } from './contracts/inventory';
import type { ReservationStatus } from './contracts/reservation';
import type { SalePhase } from './contracts/timer';
import type { CheckoutEngine } from './engines/checkoutEngine';
import type { InventoryEngine } from './engines/inventoryEngine';
import { useSalePhase } from './hooks/useCountdown';
import { useInventory } from './hooks/useInventory';
import './styles/flashSale.css';

interface AppProps {
  inventory: InventoryEngine;
  checkout: CheckoutEngine;
}

interface Notice {
  kind: 'info' | 'success' | 'error';
  text: string;
}

/** Thông báo dễ hiểu cho người mua thay vì mã lỗi kỹ thuật. */
const RESERVE_ERROR_TEXT: Partial<Record<InventoryErrorCode, string>> = {
  VERSION_CONFLICT: 'Tồn kho vừa thay đổi vì có người mua cùng lúc. Số liệu đã được cập nhật, hãy kiểm tra rồi bấm lại.',
  INSUFFICIENT_STOCK: 'Không đủ hàng cho số lượng bạn chọn.',
  SALE_NOT_ACTIVE: 'Flash sale chưa mở hoặc đã kết thúc.',
};

/** Người dùng thật của bản demo. Khách trong phần mô phỏng tranh mua có id "khach-N". */
const ME = 'ban';

const PHASE_ANNOUNCEMENT: Record<SalePhase, string> = {
  PENDING: 'Flash sale sắp mở.',
  ACTIVE: 'Flash sale đã mở, bạn có thể giữ hàng.',
  ENDED: 'Flash sale đã kết thúc.',
};

function App({ inventory, checkout }: AppProps) {
  const { snapshot, reservations } = useInventory(inventory);
  const { phase, secondsLeft } = useSalePhase(inventory.saleWindow);
  const [notice, setNotice] = useState<Notice | null>(null);
  const products = useMemo(() => inventory.getProducts(), [inventory]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  // Kho có cả đơn của khách mô phỏng; người dùng chỉ thấy và thao tác được đơn của chính mình
  const myReservations = useMemo(() => reservations.filter((reservation) => reservation.customerId === ME), [reservations]);
  const activeReservations = myReservations.filter((reservation) => reservation.status === 'ACTIVE');
  const lockSeconds = inventory.lockDurationMs / 1000;

  // Đơn tự hết hạn (không do người dùng bấm) → báo cho người dùng biết
  const lastStatus = useRef(new Map<string, ReservationStatus>());
  useEffect(() => {
    for (const reservation of myReservations) {
      if (lastStatus.current.get(reservation.id) === 'ACTIVE' && reservation.status === 'EXPIRED') {
        setNotice({ kind: 'info', text: `Đơn ${reservation.id} đã hết ${lockSeconds} giây giữ hàng, sản phẩm đã trả về kho.` });
      }
      lastStatus.current.set(reservation.id, reservation.status);
    }
  }, [myReservations, lockSeconds]);

  function handleReserve(productId: string, quantity: number, expectedVersion: number) {
    const result = inventory.reserve({ customerId: ME, productId, quantity, expectedVersion });
    const name = productMap.get(productId)?.name ?? productId;
    setNotice(
      result.ok
        ? { kind: 'success', text: `Đã giữ ${quantity} × ${name} trong ${lockSeconds} giây. Hãy thanh toán trước khi hết giờ.` }
        : { kind: 'error', text: RESERVE_ERROR_TEXT[result.error] ?? result.message },
    );
  }

  function handleCancel(reservationId: string) {
    const result = inventory.cancel(reservationId);
    setNotice(
      result.ok
        ? { kind: 'info', text: `Đã hủy đơn ${reservationId}, sản phẩm đã trả về kho.` }
        : { kind: 'error', text: result.message },
    );
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Bỏ qua đến nội dung chính
      </a>
      <header className="site-header">
        <p className="eyebrow">Mega Sale 11.11 · Nửa đêm</p>
        <h1>Flash Sale 11.11 — Săn deal giờ vàng</h1>
        <p>Mỗi lần giữ hàng được khóa {lockSeconds} giây. Hết giờ chưa thanh toán thì hàng tự trả về kho.</p>
      </header>

      <main id="main" className="layout" tabIndex={-1}>
        <SaleCountdown phase={phase} secondsLeft={secondsLeft} />
        <p role="status" className="visually-hidden">
          {PHASE_ANNOUNCEMENT[phase]}
        </p>
        <div role="status" className="notice-area">
          {notice && (
            <p className={`notice notice-${notice.kind}`}>
              {notice.kind === 'error' && <strong>Lỗi: </strong>}
              {notice.text}
            </p>
          )}
        </div>

        <div className="columns">
          <ProductList products={products} snapshot={snapshot} saleActive={phase === 'ACTIVE'} onReserve={handleReserve} />
          <div className="side">
            <ReservationPanel reservations={myReservations} products={productMap} onCancel={handleCancel} />
            <CheckoutPanel
              activeReservations={activeReservations}
              products={productMap}
              onCheckout={(id) => checkout.checkout(id)}
            />
            <CompetitionPanel inventory={inventory} products={products} saleActive={phase === 'ACTIVE'} />
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <p>Homework 3 — Web Application Development 2026, UIT. Sản phẩm và thương hiệu đều hư cấu; không có thanh toán thật.</p>
      </footer>
    </>
  );
}

export default App;
