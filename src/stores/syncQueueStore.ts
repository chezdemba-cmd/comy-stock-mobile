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
  recoverStaleSyncing: () => void;
}

const STALE_SYNCING_MESSAGE =
  "Synchronisation interrompue (l'application a été fermée pendant l'envoi). Vérifiez si l'opération a bien été enregistrée avant de réessayer, pour éviter un doublon.";

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
      // Un item encore "syncing" au rechargement de la file persistée ne peut être que
      // orphelin : rien ne peut être "en cours" après un redémarrage du process JS
      // (isProcessing, en mémoire, repart forcément à false). On ne le relance jamais
      // automatiquement (on ignore si le serveur avait déjà traité la requête avant le
      // crash — un retry silencieux risquerait une vente en double) : on le fait
      // apparaître en erreur pour que l'utilisateur vérifie puis choisisse lui-même.
      recoverStaleSyncing: () => {
        set({
          items: get().items.map((item) =>
            item.status === 'syncing'
              ? { ...item, status: 'error', errorMessage: STALE_SYNCING_MESSAGE }
              : item
          ),
        });
      },
    }),
    {
      name: 'comy-stock/sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
