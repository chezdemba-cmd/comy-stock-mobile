import { supabase } from '@/services/supabase';
import type {
  CashRegisterSession,
  Customer,
  Payment,
  PaymentMethod,
  Sale,
  SaleItem,
} from '@/types/database';
import type { CartItem } from '@/stores/cartStore';

export async function fetchOpenSession(shopId: string): Promise<CashRegisterSession | null> {
  const { data, error } = await supabase
    .from('cash_register_sessions')
    .select('*')
    .eq('shop_id', shopId)
    .eq('status', 'open')
    .maybeSingle();

  if (error) throw error;
  return data as CashRegisterSession | null;
}

export async function openCashSession(shopId: string, openingAmount: number): Promise<CashRegisterSession> {
  const { data, error } = await supabase
    .rpc('open_cash_session', { p_shop_id: shopId, p_opening_amount: openingAmount })
    .single();

  if (error) throw error;
  return data as CashRegisterSession;
}

export async function closeCashSession(
  sessionId: string,
  closingReal: number,
  notes: string
): Promise<CashRegisterSession> {
  const { data, error } = await supabase
    .rpc('close_cash_session', { p_session_id: sessionId, p_closing_real: closingReal, p_notes: notes })
    .single();

  if (error) throw error;
  return data as CashRegisterSession;
}

export async function addCashMovement(input: {
  companyId: string;
  shopId: string;
  sessionId: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
}): Promise<void> {
  const { error } = await supabase.from('cash_movements').insert({
    company_id: input.companyId,
    shop_id: input.shopId,
    session_id: input.sessionId,
    type: input.type,
    amount: input.amount,
    reason: input.reason || null,
  });

  if (error) throw error;
}

export async function fetchCustomers(companyId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function createCustomer(companyId: string, name: string, phone: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({ company_id: companyId, name, phone: phone || null })
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export interface SalePaymentInput {
  method: PaymentMethod;
  amount: number;
}

export interface CreateSaleInput {
  companyId: string;
  shopId: string;
  customerId: string | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  items: CartItem[];
  payments: SalePaymentInput[];
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const { data, error } = await supabase
    .rpc('create_sale', {
      p_company_id: input.companyId,
      p_shop_id: input.shopId,
      p_customer_id: input.customerId,
      p_subtotal: input.subtotal,
      p_discount_amount: input.discountAmount,
      p_total: input.total,
      p_items: input.items.map((item) => ({
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost,
      })),
      p_payments: input.payments,
    })
    .single();

  if (error) throw error;
  return data as Sale;
}

export interface SaleReceipt {
  sale: Sale;
  items: SaleItem[];
  payments: Payment[];
  customer: Customer | null;
  sellerName: string | null;
}

export async function fetchSaleReceipt(saleId: string): Promise<SaleReceipt> {
  const [saleResult, itemsResult, paymentsResult] = await Promise.all([
    supabase.from('sales').select('*').eq('id', saleId).single(),
    supabase.from('sale_items').select('*').eq('sale_id', saleId),
    supabase.from('payments').select('*').eq('sale_id', saleId),
  ]);

  if (saleResult.error) throw saleResult.error;
  if (itemsResult.error) throw itemsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const sale = saleResult.data as Sale;

  let customer: Customer | null = null;
  if (sale.customer_id) {
    const { data } = await supabase.from('customers').select('*').eq('id', sale.customer_id).maybeSingle();
    customer = data as Customer | null;
  }

  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', sale.created_by)
    .maybeSingle();

  return {
    sale,
    items: (itemsResult.data ?? []) as SaleItem[],
    payments: (paymentsResult.data ?? []) as Payment[],
    customer,
    sellerName: (sellerProfile as { full_name: string | null } | null)?.full_name ?? null,
  };
}
