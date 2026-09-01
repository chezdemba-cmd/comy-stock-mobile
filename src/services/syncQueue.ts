import * as Network from 'expo-network';

import { addCashMovement, createSale } from '@/features/pos/api';
import { createExpense } from '@/features/expenses/api';
import { adjustStock } from '@/features/products/api';
import { useSyncQueueStore, type QueuedMutation } from '@/stores/syncQueueStore';
import { queryClient } from './queryClient';

async function runMutation(item: QueuedMutation): Promise<void> {
  switch (item.type) {
    case 'createSale':
      await createSale(item.payload);
      queryClient.invalidateQueries({ queryKey: ['products', item.payload.companyId, item.payload.shopId] });
      queryClient.invalidateQueries({ queryKey: ['cashSession', item.payload.shopId] });
      return;
    case 'addCashMovement':
      await addCashMovement(item.payload);
      queryClient.invalidateQueries({ queryKey: ['cashSession', item.payload.shopId] });
      return;
    case 'createExpense':
      await createExpense(item.payload);
      queryClient.invalidateQueries({ queryKey: ['expenses', item.payload.companyId, item.payload.shopId] });
      if (item.payload.cashSessionId) {
        queryClient.invalidateQueries({ queryKey: ['sessionExpenses', item.payload.cashSessionId] });
      }
      return;
    case 'adjustStock':
      await adjustStock(item.payload);
      queryClient.invalidateQueries({ queryKey: ['products', item.payload.companyId, item.payload.shopId] });
      queryClient.invalidateQueries({ queryKey: ['product', item.payload.productId, item.payload.shopId] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements', item.payload.productId, item.payload.shopId] });
      return;
  }
}

let isProcessing = false;

export async function processQueue(): Promise<void> {
  if (isProcessing) return;

  isProcessing = true;
  try {
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected || network.isInternetReachable === false) return;

    const store = useSyncQueueStore.getState();
    const pendingItems = store.items.filter((item) => item.status === 'pending');

    for (const item of pendingItems) {
      store.markSyncing(item.id);
      try {
        await runMutation(item);
        store.remove(item.id);
      } catch (error) {
        store.markError(item.id, error instanceof Error ? error.message : 'Erreur de synchronisation.');
      }
    }
  } finally {
    isProcessing = false;
  }
}
