import { supabase } from '@/services/supabase';
import type { Company, Shop } from '@/types/database';

export interface Memberships {
  companies: Company[];
  shops: Shop[];
}

export async function fetchMyMemberships(userId: string): Promise<Memberships> {
  const [companyResult, shopResult] = await Promise.all([
    supabase.from('company_members').select('companies(*)').eq('user_id', userId),
    supabase.from('shop_members').select('shops(*)').eq('user_id', userId),
  ]);

  if (companyResult.error) throw companyResult.error;
  if (shopResult.error) throw shopResult.error;

  const companies = (companyResult.data ?? [])
    .map((row) => row.companies as unknown as Company | null)
    .filter((company): company is Company => company !== null);

  const shops = (shopResult.data ?? [])
    .map((row) => row.shops as unknown as Shop | null)
    .filter((shop): shop is Shop => shop !== null);

  return { companies, shops };
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
