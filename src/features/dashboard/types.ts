export type OperationKind = 'sale' | 'expense' | 'payment' | 'stock';

export interface RecentOperation {
  id: string;
  kind: OperationKind;
  title: string;
  subtitle: string;
  amount: number;
  time: string;
}

export type AlertSeverity = 'warning' | 'danger';

export interface DashboardAlert {
  id: string;
  message: string;
  severity: AlertSeverity;
}

export interface DashboardStock {
  available: number;
  low: number;
  outOfStock: number;
}

/**
 * Forme que devront respecter les futures requêtes Supabase (Phases 4/5/8/9) :
 * seule l'implémentation de useDashboardData() changera, pas cette interface ni l'UI.
 */
export interface DashboardSummary {
  revenueToday: number;
  revenueYesterday: number;
  profitEstimate: number;
  salesCount: number;
  expensesToday: number;
  stock: DashboardStock;
  alerts: DashboardAlert[];
  recentOperations: RecentOperation[];
}
