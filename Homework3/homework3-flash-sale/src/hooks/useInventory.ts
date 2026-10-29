import { useSyncExternalStore } from 'react';
import type { InventorySnapshot } from '../contracts/inventory';
import type { Reservation } from '../contracts/reservation';
import type { InventoryEngine } from '../engines/inventoryEngine';

/**
 * Đọc kho từ engine (nguồn sự thật duy nhất). React KHÔNG copy kho vào useState,
 * chỉ đăng ký nhận thông báo; useSyncExternalStore tự hủy đăng ký khi unmount.
 * Mọi thao tác ghi (reserve, cancel) gọi thẳng engine, không sửa snapshot.
 */
export function useInventory(engine: InventoryEngine): {
  snapshot: InventorySnapshot;
  reservations: readonly Reservation[];
} {
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const reservations = useSyncExternalStore(engine.subscribe, engine.getReservations);
  return { snapshot, reservations };
}
