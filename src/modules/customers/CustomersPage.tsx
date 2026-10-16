import { Column, Grid, Search as CarbonSearch, Tag, Tile } from '@carbon/react';
import { Add, Download, Filter, Renew, UserMultiple } from '@carbon/react/icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '../../components/ui/Button';
import { SelectInput, SelectItem } from '../../components/ui/Field';
import { isSupabaseConfigured } from '../../lib/supabase';
import { listCustomers, type CustomerRecord } from './customerService';

function StatTile({ label, icon, value, note }: { label: string; icon: ReactNode; value: string; note: string }) {
  return <Tile className="stat-card">
    <div className="stat-card__top"><span>{label}</span><span className="stat-icon">{icon}</span></div>
    <div className="stat-value">{value}</div>
    <div className="stat-foot">{note}</div>
  </Tile>;
}

function customerStatus(customer: CustomerRecord): string {
  const value = customer.payload?.status;
  return typeof value === 'string' && value.trim() ? value.trim() : '未分类';
}

function statusMatches(customer: CustomerRecord, filter: string): boolean {
  if (filter === 'all') return true;
  const value = customerStatus(customer).toLowerCase();
  if (filter === 'active') return ['active', '合作中', 'active customer'].includes(value);
  if (filter === 'qualified') return ['qualified', '已确认', 'confirmed'].includes(value);
  if (filter === 'inactive') return ['inactive', '已暂停', 'suspended'].includes(value);
  return true;
}

export function CustomersPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadCustomers() {
    setLoading(true);
    setError('');
    try {
      setCustomers(await listCustomers());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '读取客户数据时发生未知错误。');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = keyword.trim().toLocaleLowerCase();
    return customers.filter((customer) => {
      const matchesKeyword = !term || [
        customer.company,
        customer.legal_name ?? '',
        customer.country ?? '',
        customer.city ?? '',
        customer.id,
      ].some((value) => value.toLocaleLowerCase().includes(term));
      return matchesKeyword && statusMatches(customer, status);
    });
  }, [customers, keyword, status]);

  return <div className="customers-page">
    <div className="page-heading">
      <div><div className="eyebrow">CUSTOMER RELATIONSHIP</div><h1>客户管理</h1><p className="page-subtitle">集中管理客户档案、联系人和业务关系。</p></div>
      <div className="heading-actions">
        <Button variant="secondary" disabled={customers.length === 0} onClick={() => window.alert('导出功能将在下一阶段实现。')}><Download size={16} />导出</Button>
        <Button renderIcon={Add} disabled>新建客户（待启用）</Button>
      </div>
    </div>
    <Grid fullWidth className="stat-grid">
      <Column sm={4} md={4} lg={5}><StatTile label="客户总数" icon={<UserMultiple size={17} />} value={loading ? '…' : String(customers.length)} note="来自 gp_customers 数据表" /></Column>
      <Column sm={4} md={4} lg={5}><StatTile label="本月新增" icon={<Add size={17} />} value="—" note="待接入统计口径" /></Column>
      <Column sm={4} md={4} lg={5}><StatTile label="重点客户" icon={<Filter size={17} />} value="—" note="待配置客户分级字段" /></Column>
    </Grid>
    <Grid fullWidth>
      <Column sm={4} md={8} lg={16}><Tile className="panel">
      <div className="panel__heading">
        <div><h2>客户档案</h2><p>搜索、筛选并查看数据库中的客户信息</p></div>
        <Tag type={error ? 'red' : isSupabaseConfigured ? 'green' : 'warm-gray'}>{error ? '数据读取异常' : isSupabaseConfigured ? loading ? '正在读取 Supabase' : 'Supabase 已连接' : '等待配置 Supabase'}</Tag>
      </div>
      <div className="filter-row">
        <CarbonSearch id="customer-search" labelText="搜索客户" placeholder="搜索企业名称、注册名称、国家或城市" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <div className="filter-select">
          <SelectInput id="customer-status" labelText="客户状态" value={status} onChange={(event) => setStatus(event.target.value)}>
            <SelectItem value="all" text="全部状态" />
            <SelectItem value="active" text="合作中" />
            <SelectItem value="qualified" text="已确认" />
            <SelectItem value="inactive" text="已暂停" />
          </SelectInput>
        </div>
        <Button variant="secondary" onClick={() => { setKeyword(''); setStatus('all'); }}>重置</Button>
        <Button variant="ghost" renderIcon={Renew} onClick={() => void loadCustomers()} disabled={loading}>刷新</Button>
      </div>
      {error ? <div className="customer-feedback customer-feedback--error" role="alert">
        <strong>暂时无法读取客户数据</strong><p>{error}</p><Button variant="secondary" onClick={() => void loadCustomers()}>重试</Button>
      </div> : loading ? <div className="empty-state" role="status"><div className="empty-state__icon"><Renew size={25} /></div><h3>正在加载客户档案</h3><p>正在通过当前登录会话读取 Supabase 客户数据。</p></div> : filteredCustomers.length === 0 ? <div className="empty-state">
        <div className="empty-state__icon"><UserMultiple size={25} /></div>
        <h3>{customers.length === 0 ? '数据库中暂无可见客户' : '没有匹配的客户'}</h3>
        <p>{customers.length === 0 ? '查询已完成，但当前账户没有可显示的客户记录。请确认成员权限与数据范围。' : '请调整搜索关键词或状态筛选条件。'}</p>
      </div> : <div className="customer-list" aria-label="客户档案列表">
        {filteredCustomers.map((customer) => <article className="customer-row" key={customer.id}>
          <div className="customer-row__identity">
            <strong>{customer.company || customer.legal_name || '未命名企业'}</strong>
            {customer.legal_name && customer.legal_name !== customer.company ? <span>{customer.legal_name}</span> : null}
            <small>{customer.id}</small>
          </div>
          <div className="customer-row__location">
            <span>{[customer.city, customer.country].filter(Boolean).join('，') || '未填写地区'}</span>
            <small>{customer.default_currency ? `默认币种：${customer.default_currency}` : '未设置默认币种'}</small>
          </div>
          <div className="customer-row__terms">
            <Tag type="cool-gray">{customerStatus(customer)}</Tag>
            <small>{customer.incoterms ? `贸易术语：${customer.incoterms}` : '未设置贸易术语'}</small>
          </div>
        </article>)}
      </div>}
      <div className="table-footer"><span>{error ? '数据未能加载，未使用演示记录替代' : loading ? '正在读取数据库' : '数据来源：Supabase gp_customers'}</span><span>显示 {filteredCustomers.length} 条 <span className="footer-divider">·</span> 总计 {customers.length} 条</span></div>
      </Tile></Column>
    </Grid>
  </div>;
}
