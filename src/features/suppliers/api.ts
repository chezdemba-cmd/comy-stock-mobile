import { supabase } from '@/services/supabase';
import type { Purchase, PurchaseItem, Supplier, SupplierDebtPayment } from '@/types/database';

export async function fetchSuppliers(companyId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) throw error;
  return (data ?? []) as Supplier[];
}

export async function fetchSupplierById(supplierId: string): Promise<Supplier> {
  const { data, error } = await supabase.from('suppliers').select('*').eq('id', supplierId).single();
  if (error) throw error;
  return data as Supplier;
}

export interface SupplierInput {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
}

export async function createSupplierFull(companyId: string, input: SupplierInput): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      company_id: companyId,
      name: input.name,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      email: input.email || null,
      address: input.address || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplier(supplierId: string, input: SupplierInput): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update({
      name: input.name,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      email: input.email || null,
      address: input.address || null,
    })
    .eq('id', supplierId)
    .select()
    .single();

  if (error) throw error;
  return data as Supplier;
}

export interface SupplierStats {
  totalPurchases: number;
  purchaseCount: number;
  suppliedProductNames: string[];
}

export async function fetchSupplierStats(supplierId: string): Promise<SupplierStats> {
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('id, total')
    .eq('supplier_id', supplierId);

  if (purchasesError) throw purchasesError;

  const purchaseIds = (purchases ?? []).map((purchase) => purchase.id as string);
  let suppliedProductNames: string[] = [];

  if (purchaseIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('purchase_items')
      .select('product_name')
      .in('purchase_id', purchaseIds);

    if (itemsError) throw itemsError;
    suppliedProductNames = Array.from(new Set((items ?? []).map((item) => item.product_name as string)));
  }

  return {
    totalPurchases: (purchases ?? []).reduce((sum, purchase) => sum + (purchase.total as number), 0),
    purchaseCount: (purchases ?? []).length,
    suppliedProductNames,
  };
}

export interface SupplierDebtSummary {
  totalOutstanding: number;
  payments: (SupplierDebtPayment & { debt_original_amount: number })[];
}

export async function fetchSupplierDebtSummary(supplierId: string): Promise<SupplierDebtSummary> {
  const { data: debts, error: debtsError } = await supabase
    .from('supplier_debts')
    .select('id, original_amount')
    .eq('supplier_id', supplierId);

  if (debtsError) throw debtsError;

  const debtIds = (debts ?? []).map((debt) => debt.id as string);
  const totalDebts = (debts ?? []).reduce((sum, debt) => sum + (debt.original_amount as number), 0);

  if (debtIds.length === 0) {
    return { totalOutstanding: 0, payments: [] };
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('supplier_debt_payments')
    .select('*')
    .in('debt_id', debtIds)
    .order('paid_at', { ascending: false });

  if (paymentsError) throw paymentsError;

  const debtAmountById = new Map((debts ?? []).map((debt) => [debt.id as string, debt.original_amount as number]));
  const totalPaid = (payments ?? []).reduce((sum, payment) => sum + (payment.amount as number), 0);

  return {
    totalOutstanding: Math.max(totalDebts - totalPaid, 0),
    payments: (payments ?? []).map((payment) => ({
      ...(payment as SupplierDebtPayment),
      debt_original_amount: debtAmountById.get(payment.debt_id as string) ?? 0,
    })),
  };
}

export async function fetchOutstandingDebtsBySupplier(companyId: string): Promise<Record<string, number>> {
  const { data: debts, error: debtsError } = await supabase
    .from('supplier_debts')
    .select('id, supplier_id, original_amount')
    .eq('company_id', companyId);

  if (debtsError) throw debtsError;
  if (!debts || debts.length === 0) return {};

  const debtIds = debts.map((debt) => debt.id as string);

  const { data: payments, error: paymentsError } = await supabase
    .from('supplier_debt_payments')
    .select('debt_id, amount')
    .in('debt_id', debtIds);

  if (paymentsError) throw paymentsError;

  const paidByDebt = new Map<string, number>();
  for (const payment of payments ?? []) {
    const debtId = payment.debt_id as string;
    paidByDebt.set(debtId, (paidByDebt.get(debtId) ?? 0) + (payment.amount as number));
  }

  const outstandingBySupplier: Record<string, number> = {};
  for (const debt of debts) {
    const supplierId = debt.supplier_id as string;
    const remaining = (debt.original_amount as number) - (paidByDebt.get(debt.id as string) ?? 0);
    outstandingBySupplier[supplierId] = (outstandingBySupplier[supplierId] ?? 0) + Math.max(remaining, 0);
  }

  return outstandingBySupplier;
}

export async function paySupplierDebt(supplierId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc('pay_supplier_debt', {
    p_supplier_id: supplierId,
    p_amount: amount,
  });

  if (error) throw error;
}

export interface PurchaseItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInput {
  companyId: string;
  shopId: string;
  supplierId: string | null;
  items: PurchaseItemInput[];
  amountPaid: number;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const { data, error } = await supabase
    .rpc('create_purchase', {
      p_company_id: input.companyId,
      p_shop_id: input.shopId,
      p_supplier_id: input.supplierId,
      p_items: input.items.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_cost: item.unitCost,
      })),
      p_amount_paid: input.amountPaid,
    })
    .single();

  if (error) throw error;
  return data as Purchase;
}

export async function fetchSupplierPurchases(supplierId: string): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Purchase[];
}

export async function fetchPurchaseItems(purchaseId: string): Promise<PurchaseItem[]> {
  const { data, error } = await supabase.from('purchase_items').select('*').eq('purchase_id', purchaseId);
  if (error) throw error;
  return (data ?? []) as PurchaseItem[];
}
