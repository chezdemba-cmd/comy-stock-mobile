export type StockStatus = 'available' | 'low' | 'outOfStock';

export function getStockStatus(quantity: number, stockMin: number): StockStatus {
  if (quantity <= 0) return 'outOfStock';
  if (quantity <= stockMin) return 'low';
  return 'available';
}
