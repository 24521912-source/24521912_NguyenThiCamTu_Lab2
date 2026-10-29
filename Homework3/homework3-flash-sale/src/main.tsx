import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FLASH_SALE_TIMING, INITIAL_STOCK, PRODUCTS } from './data/products'
import { CheckoutEngine, simulatedPayment } from './engines/checkoutEngine'
import { InventoryEngine } from './engines/inventoryEngine'

// Engine được tạo MỘT lần khi trang tải và sống cùng trang, nằm ngoài React:
// React render lại hay StrictMode mount 2 lần cũng không tạo ra kho thứ hai.
const opensAt = Date.now() + FLASH_SALE_TIMING.opensInMs
const inventory = new InventoryEngine({
  products: PRODUCTS,
  initialStock: INITIAL_STOCK,
  saleWindow: { startsAt: opensAt, endsAt: opensAt + FLASH_SALE_TIMING.durationMs },
  lockDurationMs: FLASH_SALE_TIMING.lockDurationMs,
})
const checkout = new CheckoutEngine(inventory, simulatedPayment(1200))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App inventory={inventory} checkout={checkout} />
  </StrictMode>,
)
