import { useEffect, useRef, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

import { queryClient } from '@/services/queryClient';
import { processQueue } from '@/services/syncQueue';
import { useSyncQueueStore } from '@/stores/syncQueueStore';

let hasSetUp = false;

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const wasOnline = useRef(true);

  useEffect(() => {
    if (!hasSetUp) {
      hasSetUp = true;
      try {
        const persister = createAsyncStoragePersister({
          storage: AsyncStorage,
          key: 'comy-stock/query-cache',
        });
        persistQueryClient({
          queryClient,
          persister,
          maxAge: 1000 * 60 * 60 * 24,
        });
      } catch (error) {
        console.warn('[OfflineSyncProvider] Persistance du cache impossible :', error);
      }
    }

    // La file persistée (zustand/AsyncStorage) se recharge de façon asynchrone : il faut
    // attendre qu'elle soit vraiment là avant de nettoyer les items "syncing" orphelins
    // d'une session précédente et de relancer le traitement, sinon on agirait sur une
    // file encore vide et manquerait les opérations en attente au démarrage à froid.
    const startProcessing = () => {
      useSyncQueueStore.getState().recoverStaleSyncing();
      processQueue();
    };
    if (useSyncQueueStore.persist.hasHydrated()) {
      startProcessing();
    } else {
      useSyncQueueStore.persist.onFinishHydration(startProcessing);
    }

    let subscription: { remove: () => void } | undefined;
    try {
      subscription = Network.addNetworkStateListener((state) => {
        const isOnline = Boolean(state.isConnected) && state.isInternetReachable !== false;
        if (isOnline && !wasOnline.current) {
          processQueue();
        }
        wasOnline.current = isOnline;
      });
    } catch (error) {
      console.warn('[OfflineSyncProvider] Détection réseau indisponible :', error);
    }

    return () => subscription?.remove();
  }, []);

  return <>{children}</>;
}
