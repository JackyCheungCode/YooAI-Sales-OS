import { Search as CarbonSearch, Tag } from '@carbon/react';
import { Add, Download, Filter, UserMultiple } from '@carbon/react/icons';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { SelectInput, SelectItem, TextInput } from '../../components/ui/Field';
import { isSupabaseConfigured } from '../../lib/supabase';

export function CustomersPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  return <div className="customers-page">
    <div className="page-heading">
      <div><div className="eyebrow">CUSTOMER RELATIONSHIP</div><h1>客户管理</h1><p className="page-subtitle">集中管理客户档案、联系人和业务关系。</p></div>
      <div className="heading-actions">
        <Button variant="secondary" onClick={() => window.alert('导出功能将在客户数据接入后启用。')}><Download size={16} />导出</Button>
        <Button renderIcon={Add} onClick={() => window.alert('客户新增表单将在下一阶段接入数据库。')}>新建客户</Button>
      </div>
    </div>
    <section className="stat-grid">
      <div className="stat-card"><div className="stat-card__top"><span>客户总数</span><span className="stat-icon"><UserMultiple size={17} /></span></div><div className="stat-value">—</div><div className="stat-foot">连接数据库后显示实时数据</div></div>
      <div className="stat-card"><div className="stat-card__top"><span>本月新增</span><span className="stat-icon stat-icon--green"><Add size={17} /></span></div><div className="stat-value">—</div><div className="stat-foot">按客户创建时间统计</div></div>
      <div className="stat-card"><div className="stat-card__top"><span>重点客户</span><span className="stat-icon stat-icon--amber"><Filter size={17} /></span></div><div className="stat-value">—</div><div className="stat-foot">按客户等级统计</div></div>
    </section>
    <section className="panel">
      <div className="panel__heading"><div><h2>客户档案</h2><p>搜索、筛选并维护客户信息</p></div><Tag type={isSupabaseConfigured ? 'green' : 'warm-gray'}>{isSupabaseConfigured ? 'Supabase 配置已读取' : '等待配置 Supabase'}</Tag></div>
      <div className="filter-row">
        <CarbonSearch id="customer-search" labelText="搜索客户" placeholder="搜索客户名称、邮箱或联系人" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <div className="filter-select"><SelectInput id="customer-status" labelText="客户状态" value={status} onChange={(event) => setStatus(event.target.value)}>
          <SelectItem value="all" text="全部状态" /><SelectItem value="active" text="合作中" /><SelectItem value="qualified" text="已确认" /><SelectItem value="inactive" text="已暂停" />
        </SelectInput></div>
        <Button variant="secondary" onClick={() => { setKeyword(''); setStatus('all'); }}>重置</Button>
      </div>
      <div className="empty-state"><div className="empty-state__icon"><UserMultiple size={25} /></div><h3>{keyword ? '尚无匹配客户' : '客户数据准备就绪'}</h3><p>{isSupabaseConfigured ? 'Supabase 连接配置已检测到。完成数据库表结构和权限策略后，这里将展示真实客户数据。' : '当前还没有加载客户数据。下一步将接入 Supabase 数据表与安全访问策略。'}</p><Button renderIcon={Add} onClick={() => window.alert('下一步将实现客户表结构、RLS 策略和新增/编辑流程。')}>规划客户数据接入</Button></div>
      <div className="table-footer"><span>当前为基础界面阶段，未写入任何客户数据</span><span>第 1 页 <span className="footer-divider">·</span> 共 0 条</span></div>
    </section>
  </div>;
}
