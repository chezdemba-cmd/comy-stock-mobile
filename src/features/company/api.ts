import { supabase } from '@/services/supabase';
import type { AppRole, Company, Shop } from '@/types/database';

export interface Memberships {
  companies: Company[];
  shops: Shop[];
  companyRoles: Record<string, AppRole>;
}

export async function fetchMyMemberships(userId: string): Promise<Memberships> {
  const [companyResult, shopResult] = await Promise.all([
    supabase.from('company_members').select('role, companies(*)').eq('user_id', userId),
    supabase.from('shop_members').select('shops(*)').eq('user_id', userId),
  ]);

  if (companyResult.error) throw companyResult.error;
  if (shopResult.error) throw shopResult.error;

  const companyRows = (companyResult.data ?? []) as unknown as { role: AppRole; companies: Company | null }[];

  const companies = companyRows
    .map((row) => row.companies)
    .filter((company): company is Company => company !== null);

  const companyRoles = companyRows.reduce<Record<string, AppRole>>((acc, row) => {
    if (row.companies) acc[row.companies.id] = row.role;
    return acc;
  }, {});

  const shops = (shopResult.data ?? [])
    .map((row) => row.shops as unknown as Shop | null)
    .filter((shop): shop is Shop => shop !== null);

  return { companies, shops, companyRoles };
}

export async function fetchCompanyShops(companyId: string): Promise<Shop[]> {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('company_id', companyId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Shop[];
}

export interface CreateCompanyInput {
  name: string;
  country: string;
  city: string;
  currency: string;
  businessType: string;
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const { data, error } = await supabase
    .rpc('create_company', {
      p_name: input.name,
      p_country: input.country,
      p_city: input.city,
      p_currency: input.currency,
      p_business_type: input.businessType,
    })
    .single();

  if (error) throw error;
  return data as Company;
}

export interface CreateShopInput {
  companyId: string;
  name: string;
  location: string;
  phone: string;
  address?: string;
}

export async function createShop(input: CreateShopInput): Promise<Shop> {
  const { data, error } = await supabase
    .rpc('create_shop', {
      p_company_id: input.companyId,
      p_name: input.name,
      p_location: input.location,
      p_phone: input.phone,
      p_address: input.address ?? null,
    })
    .single();

  if (error) throw error;
  return data as Shop;
}

export async function updateCompanySettings(companyId: string, input: CreateCompanyInput): Promise<Company> {
  const { data, error } = await supabase.rpc('update_company_settings', {
    p_company_id: companyId,
    p_name: input.name,
    p_country: input.country,
    p_city: input.city,
    p_currency: input.currency,
    p_business_type: input.businessType,
  }).single();
  if (error) throw error;
  return data as Company;
}

export async function updateShopSettings(shopId: string, input: CreateShopInput): Promise<Shop> {
  const { data, error } = await supabase.rpc('update_shop_settings', {
    p_company_id: input.companyId,
    p_shop_id: shopId,
    p_name: input.name,
    p_location: input.location,
    p_phone: input.phone,
    p_address: input.address ?? '',
  }).single();
  if (error) throw error;
  return data as Shop;
}
