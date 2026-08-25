import type { DashboardSummary } from './types';

/**
 * Données de démo (section 46/47 du cahier des charges), en attendant les vraies
 * requêtes Supabase des Phases 4 (Stock), 5 (Caisse), 8 (Dépenses) et 9 (Rapports).
 */
export const DASHBOARD_MOCK: DashboardSummary = {
  revenueToday: 120000,
  revenueYesterday: 111000,
  profitEstimate: 31500,
  salesCount: 23,
  expensesToday: 12000,
  stock: {
    available: 142,
    low: 5,
    outOfStock: 2,
  },
  alerts: [
    { id: 'alert-1', message: '5 produits bientôt en rupture', severity: 'warning' },
    { id: 'alert-2', message: 'Mamadou doit 25 000 F', severity: 'warning' },
    { id: 'alert-3', message: 'Facture fournisseur à payer', severity: 'danger' },
    { id: 'alert-4', message: 'Caisse non clôturée', severity: 'danger' },
  ],
  recentOperations: [
    {
      id: 'op-1',
      kind: 'sale',
      title: 'Vente #A245',
      subtitle: '3 articles · Espèces',
      amount: 8500,
      time: '10:42',
    },
    {
      id: 'op-2',
      kind: 'expense',
      title: 'Transport',
      subtitle: 'Dépense',
      amount: -5000,
      time: '09:15',
    },
    {
      id: 'op-3',
      kind: 'payment',
      title: 'Paiement dette — Awa',
      subtitle: 'Remboursement partiel',
      amount: 10000,
      time: '08:50',
    },
    {
      id: 'op-4',
      kind: 'stock',
      title: 'Entrée de stock — Riz 25kg',
      subtitle: '+10 unités',
      amount: 0,
      time: 'Hier',
    },
  ],
};
