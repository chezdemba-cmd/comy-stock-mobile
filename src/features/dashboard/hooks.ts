import { useQuery } from '@tanstack/react-query';

import { useCustomers, useOutstandingDebtsByCustomer } from '@/features/customers/hooks';
import { useProducts } from '@/features/products/hooks';
import { getStockStatus } from '@/features/products/stockStatus';
import { useOpenSession } from '@/features/pos/hooks';
import { useSalesSummary } from '@/features/reports/hooks';
import { getPeriodRange } from '@/features/reports/periods';
import { useCompanyStore } from '@/stores/companyStore';
import { formatMoney, formatNumber } from '@/utils/money';
import { fetchRecentOperations } from './api';
import type { DashboardSummary } from './types';

const TODAY_RANGE = getPeriodRange('today');
const YESTERDAY_RANGE = getPeriodRange('yesterday');

function useRecentOperations() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  const shopId = useCompanyStore((state) => state.activeShopId);

  return useQuery({
    queryKey: ['recentOperations', companyId, shopId],
    queryFn: () => fetchRecentOperations(companyId as string, shopId as string),
    enabled: Boolean(companyId && shopId),
  });
}

export function useDashboardData(currency: string): { data: DashboardSummary; isLoading: boolean } {
  const { data: today, isLoading: todayLoading } = useSalesSummary(TODAY_RANGE);
  const { data: yesterday, isLoading: yesterdayLoading } = useSalesSummary(YESTERDAY_RANGE);
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: outstandingByCustomer = {} } = useOutstandingDebtsByCustomer();
  const { data: customers = [] } = useCustomers();
  const { data: openSession } = useOpenSession();
  const { data: recentOperations = [], isLoading: operationsLoading } = useRecentOperations();

  const stock = products.reduce(
    (acc, product) => {
      const status = getStockStatus(product.quantity, product.stock_min);
      if (status === 'available') acc.available += 1;
      else if (status === 'low') acc.low += 1;
      else acc.outOfStock += 1;
      return acc;
    },
    { available: 0, low: 0, outOfStock: 0 }
  );

  const alerts: DashboardSummary['alerts'] = [];

  if (stock.low > 0) {
    alerts.push({
      id: 'stock-low',
      message: `${formatNumber(stock.low)} produit${stock.low > 1 ? 's' : ''} bientôt en rupture`,
      severity: 'warning',
    });
  }
  if (stock.outOfStock > 0) {
    alerts.push({
      id: 'stock-out',
      message: `${formatNumber(stock.outOfStock)} produit${stock.outOfStock > 1 ? 's' : ''} en rupture`,
      severity: 'danger',
    });
  }

  const topDebts = Object.entries(outstandingByCustomer)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  for (const [customerId, amount] of topDebts) {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) continue;
    alerts.push({
      id: `debt-${customerId}`,
      message: `${customer.name} doit ${formatMoney(amount, currency)}`,
      severity: 'warning',
    });
  }

  if (openSession) {
    const openedToday = new Date(openSession.opened_at).toDateString() === new Date().toDateString();
    if (!openedToday) {
      alerts.push({
        id: 'stale-session',
        message: 'Caisse non clôturée depuis une session précédente',
        severity: 'danger',
      });
    }
  }

  const data: DashboardSummary = {
    revenueToday: today?.revenue ?? 0,
    revenueYesterday: yesterday?.revenue ?? 0,
    profitEstimate: today?.net_profit ?? 0,
    salesCount: today?.sales_count ?? 0,
    expensesToday: today?.expenses_total ?? 0,
    stock,
    alerts,
    recentOperations,
  };

  return {
    data,
    isLoading: todayLoading || yesterdayLoading || productsLoading || operationsLoading,
  };
}
