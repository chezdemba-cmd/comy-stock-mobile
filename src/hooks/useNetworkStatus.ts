import { useNetworkState } from 'expo-network';

export function useNetworkStatus(): { isOnline: boolean } {
  const state = useNetworkState();

  if (state.isConnected === undefined) {
    return { isOnline: true };
  }

  const isOnline = state.isConnected && state.isInternetReachable !== false;
  return { isOnline };
}
