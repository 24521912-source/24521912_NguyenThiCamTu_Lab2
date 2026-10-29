import type { InventorySnapshot, Product } from '../contracts/inventory';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: readonly Product[];
  snapshot: InventorySnapshot;
  saleActive: boolean;
  onReserve: (productId: string, quantity: number, expectedVersion: number) => void;
}

export function ProductList({ products, snapshot, saleActive, onReserve }: ProductListProps) {
  const records = new Map(snapshot.map((record) => [record.productId, record]));
  return (
    <section aria-labelledby="products-title">
      <h2 id="products-title">Sản phẩm giá sốc 11.11</h2>
      <div className="product-grid">
        {products.map((product) => {
          const record = records.get(product.id);
          return record ? (
            <ProductCard key={product.id} product={product} record={record} saleActive={saleActive} onReserve={onReserve} />
          ) : null;
        })}
      </div>
    </section>
  );
}
