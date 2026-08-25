import { useEffect, useRef, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

import { queryClient } from '@/services/queryClient';
import { processQueue } from '@/services/syncQueue';

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

    processQueue();

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
