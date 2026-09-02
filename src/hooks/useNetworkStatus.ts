import { useNetworkState } from 'expo-network';

export function useNetworkStatus(): { isOnline: boolean } {
  const state = useNetworkState();

  if (state.isConnected === undefined) {
    // Au démarrage à froid, mieux vaut mettre une mutation compatible hors ligne
    // en file d'attente que tenter un appel réseau susceptible d'être perdu.
    return { isOnline: false };
  }

  const isOnline = state.isConnected && state.isInternetReachable !== false;
  return { isOnline };
}
