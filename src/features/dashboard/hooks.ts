import { DASHBOARD_MOCK } from './mockData';
import type { DashboardSummary } from './types';

/**
 * Temporaire : retourne les données de démo. À remplacer par une vraie requête
 * TanStack Query (ventes/dépenses/stock du jour pour la boutique active) dans les
 * Phases 4/5/8/9, sans changer la forme de DashboardSummary ni l'écran qui l'utilise.
 */
export function useDashboardData(): { data: DashboardSummary; isLoading: false } {
  return { data: DASHBOARD_MOCK, isLoading: false };
}
