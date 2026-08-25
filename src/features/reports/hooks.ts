import { useQuery } from '@tanstack/react-query';

import { useCompanyStore } from '@/stores/companyStore';
import { fetchDailyRevenue, fetchEmployeeSales, fetchProductSales, fetchSalesSummary } from './api';
import type { DateRange } from './periods';

function useActiveScope() {
  const companyId = useCompanyStore((state) => state.activeCompanyId);
  const shopId = useCompanyStore((state) => state.activeShopId);
  return { companyId, shopId };
}

export function useSalesSummary(range: DateRange) {
  const { companyId, shopId } = useActiveScope();

  return useQuery({
    queryKey: ['salesSummary', companyId, shopId, range.from, range.to],
    queryFn: () => fetchSalesSummary(companyId as string, shopId as string, range),
    enabled: Boolean(companyId && shopId),
  });
}

export function useProductSales(range: DateRange) {
  const { companyId, shopId } = useActiveScope();

  return useQuery({
    queryKey: ['productSales', companyId, shopId, range.from, range.to],
    queryFn: () => fetchProductSales(companyId as string, shopId as string, range),
    enabled: Boolean(companyId && shopId),
  });
}

export function useDailyRevenue(range: DateRange) {
  const { companyId, shopId } = useActiveScope();

  return useQuery({
    queryKey: ['dailyRevenue', companyId, shopId, range.from, range.to],
    queryFn: () => fetchDailyRevenue(companyId as string, shopId as string, range),
    enabled: Boolean(companyId && shopId),
  });
}

export function useEmployeeSales(range: DateRange) {
  const { companyId, shopId } = useActiveScope();

  return useQuery({
    queryKey: ['employeeSales', companyId, shopId, range.from, range.to],
    queryFn: () => fetchEmployeeSales(companyId as string, shopId as string, range),
    enabled: Boolean(companyId && shopId),
  });
}
