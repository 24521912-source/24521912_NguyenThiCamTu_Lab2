import { useId, useState } from 'react';
import type { Product } from '../contracts/inventory';
import type { InventoryEngine } from '../engines/inventoryEngine';
import { simulateCompetingCustomers, type CompetitionReport } from '../simulation/concurrentRequests';

interface CompetitionPanelProps {
  inventory: InventoryEngine;
  products: readonly Product[];
  saleActive: boolean;
}

const CUSTOMERS = 20;

/** Thiết kế thêm (không bắt buộc): nút cho 20 "khách khác" tranh mua cùng lúc để thấy optimistic locking hoạt động. */
export function CompetitionPanel({ inventory, products, saleActive }: CompetitionPanelProps) {
  const selectId = useId();
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<CompetitionReport | null>(null);
  const canRun = saleActive && !running;

  async function run() {
    if (!canRun) return;
    setRunning(true);
    try {
      setReport(await simulateCompetingCustomers(inventory, { productId, customers: CUSTOMERS }));
    } finally {
      setRunning(false);
    }
  }

  const count = (status: string) => report?.outcomes.filter((outcome) => outcome.status === status).length ?? 0;

  return (
    <section className="panel" aria-labelledby="competition-title">
      <h2 id="competition-title">Mô phỏng tranh mua</h2>
      <p className="muted small">
        {CUSTOMERS} khách khác cùng đọc tồn kho rồi gửi yêu cầu giữ 1 sản phẩm gần như cùng lúc. Trùng phiên bản thì thử lại tối đa 3 lần.
      </p>
      <div className="reserve-row">
        <label htmlFor={selectId}>Sản phẩm</label>
        <select id={selectId} value={productId} onChange={(event) => setProductId(event.target.value)}>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <button type="button" className="secondary" aria-disabled={!canRun} onClick={() => void run()}>
          {running ? 'Đang mô phỏng…' : `Cho ${CUSTOMERS} khách tranh mua`}
        </button>
      </div>
      <div role="status">
        {report && (
          <p>
            Giữ được: <strong>{report.reserved}</strong> · Hết hàng: <strong>{count('INSUFFICIENT_STOCK')}</strong> · Hết lượt thử lại:{' '}
            <strong>{count('RETRY_LIMIT')}</strong> · Số lần trùng phiên bản: <strong>{report.versionConflicts}</strong>
          </p>
        )}
      </div>
    </section>
  );
}
