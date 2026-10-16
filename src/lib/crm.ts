import { supabase } from './supabase';

export type LeadRecord = {
  id: string;
  owner_id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_title: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | 'converted';
  estimated_value: number | null;
  currency_code: string;
  country: string | null;
  city: string | null;
  website: string | null;
  product_interest: string | null;
  estimated_volume: string | null;
  target_price: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  converted_at: string | null;
  converted_customer_id: string | null;
  converted_contact_id: string | null;
  converted_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadConversionResult = {
  lead_id: string;
  customer_id: string;
  contact_id: string;
  opportunity_id: string;
  customer_reused: boolean;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase 尚未配置，当前操作没有写入云端。');
  }
  return supabase;
}

/** Always returns persisted, owner-scoped rows. Never substitutes demo data on failure. */
export async function listLeadRecords(): Promise<LeadRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('leads')
    .select('id,owner_id,company_name,contact_name,contact_title,email,phone,source,stage,estimated_value,currency_code,country,city,website,product_interest,estimated_volume,target_price,next_follow_up_at,notes,converted_at,converted_customer_id,converted_contact_id,converted_opportunity_id,created_at,updated_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`读取云端线索失败：${error.message}`);
  return (data ?? []) as LeadRecord[];
}

/** Database RPC creates/reuses customer and contact, creates opportunity, locks lead, and audits atomically. */
export async function convertLeadToCustomer(
  leadId: string,
  customerId?: string,
): Promise<LeadConversionResult> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('convert_lead', {
    p_lead_id: leadId,
    p_customer_id: customerId ?? null,
  });
  if (error) throw new Error(`线索转化失败，数据库未确认提交：${error.message}`);
  if (!data || typeof data !== 'object' || !('customer_id' in data) || !('opportunity_id' in data)) {
    throw new Error('线索转化返回结果不完整，未能确认客户、联系人和商机关系。');
  }
  return data as LeadConversionResult;
}

export async function listOpportunities() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('opportunities')
    .select('id,customer_id,primary_contact_id,title,stage,amount,currency_code,expected_close_date,source_lead_id,created_at,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`读取云端商机失败：${error.message}`);
  return data ?? [];
}
