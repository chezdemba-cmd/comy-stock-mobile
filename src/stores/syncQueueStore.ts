import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { addCashMovement, CreateSaleInput } from '@/features/pos/api';
import type { CreateExpenseInput } from '@/features/expenses/api';
import type { AdjustStockInput } from '@/features/products/api';

export type QueuedMutation =
  | { id: string; type: 'createSale'; payload: CreateSaleInput; createdAt: string; status: QueueStatus; errorMessage?: string }
  | {
      id: string;
      type: 'addCashMovement';
      payload: Parameters<typeof addCashMovement>[0];
      createdAt: string;
      status: QueueStatus;
      errorMessage?: string;
    }
  | { id: string; type: 'createExpense'; payload: CreateExpenseInput; createdAt: string; status: QueueStatus; errorMessage?: string }
  | { id: string; type: 'adjustStock'; payload: AdjustStockInput; createdAt: string; status: QueueStatus; errorMessage?: string };

export type QueueStatus = 'pending' | 'syncing' | 'error';

function generateId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

interface SyncQueueState {
  items: QueuedMutation[];
  enqueue: (entry: Omit<QueuedMutation, 'id' | 'createdAt' | 'status' | 'errorMessage'>) => QueuedMutation;
  markSyncing: (id: string) => void;
  markError: (id: string, errorMessage: string) => void;
  remove: (id: string) => void;
  retry: (id: string) => void;
  discard: (id: string) => void;
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      items: [],
      enqueue: (entry) => {
        const item = { ...entry, id: generateId(), createdAt: new Date().toISOString(), status: 'pending' as QueueStatus } as QueuedMutation;
        set({ items: [...get().items, item] });
        return item;
      },
      markSyncing: (id) => {
        set({ items: get().items.map((item) => (item.id === id ? { ...item, status: 'syncing' } : item)) });
      },
      markError: (id, errorMessage) => {
        set({
          items: get().items.map((item) => (item.id === id ? { ...item, status: 'error', errorMessage } : item)),
        });
      },
      remove: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      retry: (id) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, status: 'pending', errorMessage: undefined } : item
          ),
        });
      },
      discard: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
    }),
    {
      name: 'comy-stock/sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
