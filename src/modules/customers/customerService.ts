import { supabase } from '../../lib/supabase';

export type CustomerRecord = {
  id: string;
  company: string;
  legal_name: string | null;
  country: string | null;
  city: string | null;
  default_currency: string | null;
  payment_terms: string | null;
  incoterms: string | null;
  created_at: string;
  payload: Record<string, unknown> | null;
};

export async function listCustomers(): Promise<CustomerRecord[]> {
  if (!supabase) {
    throw new Error('尚未配置 Supabase。请在 Vercel Preview 环境配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。');
  }

  const { data, error } = await supabase
    .from('gp_customers')
    .select('id, company, legal_name, country, city, default_currency, payment_terms, incoterms, created_at, payload')
    .order('company', { ascending: true });

  if (error) {
    if (error.code === 'PGRST301' || error.code === '42501') {
      throw new Error('当前账户无权读取客户数据，请检查登录状态与 gp_customers 的 RLS 成员权限。');
    }
    throw new Error(`读取客户数据失败：${error.message}`);
  }

  return (data ?? []) as CustomerRecord[];
}
