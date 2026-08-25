import { supabase } from '@/services/supabase';
import type {
  DailyRevenueRow,
  EmployeeSalesReportRow,
  ProductSalesReportRow,
  SalesSummary,
} from '@/types/database';
import type { DateRange } from './periods';

export async function fetchSalesSummary(
  companyId: string,
  shopId: string,
  range: DateRange
): Promise<SalesSummary> {
  const { data, error } = await supabase
    .rpc('report_sales_summary', {
      p_company_id: companyId,
      p_shop_id: shopId,
      p_start: range.from,
      p_end: range.to,
    })
    .single();

  if (error) throw error;
  return data as SalesSummary;
}

export async function fetchProductSales(
  companyId: string,
  shopId: string,
  range: DateRange
): Promise<ProductSalesReportRow[]> {
  const { data, error } = await supabase.rpc('report_product_sales', {
    p_company_id: companyId,
    p_shop_id: shopId,
    p_start: range.from,
    p_end: range.to,
  });

  if (error) throw error;
  return (data ?? []) as ProductSalesReportRow[];
}

export async function fetchDailyRevenue(
  companyId: string,
  shopId: string,
  range: DateRange
): Promise<DailyRevenueRow[]> {
  const { data, error } = await supabase.rpc('report_daily_revenue', {
    p_company_id: companyId,
    p_shop_id: shopId,
    p_start: range.from,
    p_end: range.to,
  });

  if (error) throw error;
  return (data ?? []) as DailyRevenueRow[];
}

export async function fetchEmployeeSales(
  companyId: string,
  shopId: string,
  range: DateRange
): Promise<EmployeeSalesReportRow[]> {
  const { data, error } = await supabase.rpc('report_employee_sales', {
    p_company_id: companyId,
    p_shop_id: shopId,
    p_start: range.from,
    p_end: range.to,
  });

  if (error) throw error;
  return (data ?? []) as EmployeeSalesReportRow[];
}
