import { Column, Grid, InlineNotification, Search as CarbonSearch, Tag, Tile } from '../../components/carbon/compat';
import { Add, Download, Filter, UserMultiple } from '@carbon/icons-react';
import { useState, type ReactNode } from 'react';
import { Button } from '../../components/ui/Button';
import { SelectInput, SelectItem } from '../../components/ui/Field';
import { isSupabaseConfigured } from '../../lib/supabase';

function StatTile({ label, icon, value, note }: { label: string; icon: ReactNode; value: string; note: string }) {
  return <Tile className="stat-card">
    <div className="stat-card__top"><span>{label}</span><span className="stat-icon">{icon}</span></div>
    <div className="stat-value">{value}</div>
    <div className="stat-foot">{note}</div>
  </Tile>;
}

export function CustomersPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [notice, setNotice] = useState('');

  return <div className="customers-page">
    {notice && <InlineNotification kind="info" lowContrast title="功能状态" subtitle={notice} onCloseButtonClick={() => setNotice('')} />}
    <div className="page-heading">
      <div><div className="eyebrow">CUSTOMER RELATIONSHIP</div><h1>客户管理</h1><p className="page-subtitle">集中管理客户档案、联系人和业务关系。</p></div>
      <div className="heading-actions">
        <Button variant="secondary" onClick={() => setNotice('导出暂不可用：客户数据查询与导出服务尚未接入。')}><Download size={16} />导出</Button>
        <Button renderIcon={Add} onClick={() => setNotice('新建客户暂不可用：客户主数据的数据库写入流程尚未接入。')}>新建客户</Button>
      </div>
    </div>
    <Grid fullWidth className="stat-grid">
      <Column sm={4} md={4} lg={5}><StatTile label="客户总数" icon={<UserMultiple size={17} />} value="—" note="连接数据库后显示实时数据" /></Column>
      <Column sm={4} md={4} lg={5}><StatTile label="本月新增" icon={<Add size={17} />} value="—" note="按客户创建时间统计" /></Column>
      <Column sm={4} md={4} lg={5}><StatTile label="重点客户" icon={<Filter size={17} />} value="—" note="按客户等级统计" /></Column>
    </Grid>
    <Grid fullWidth>
      <Column sm={4} md={8} lg={16}><Tile className="panel">
      <div className="panel__heading">
        <div><h2>客户档案</h2><p>搜索、筛选并维护客户信息</p></div>
        <Tag type={isSupabaseConfigured ? 'green' : 'warm-gray'}>{isSupabaseConfigured ? 'Supabase 配置已读取' : '等待配置 Supabase'}</Tag>
      </div>
      <div className="filter-row">
        <CarbonSearch id="customer-search" labelText="搜索客户" placeholder="搜索客户名称、邮箱或联系人" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <div className="filter-select">
          <SelectInput id="customer-status" labelText="客户状态" value={status} onChange={(event) => setStatus(event.target.value)}>
            <SelectItem value="all" text="全部状态" />
            <SelectItem value="active" text="合作中" />
            <SelectItem value="qualified" text="已确认" />
            <SelectItem value="inactive" text="已暂停" />
          </SelectInput>
        </div>
        <Button variant="secondary" onClick={() => { setKeyword(''); setStatus('all'); }}>重置</Button>
      </div>
      <div className="empty-state">
        <div className="empty-state__icon"><UserMultiple size={25} /></div>
        <h3>{keyword ? '尚无匹配客户' : '客户数据准备就绪'}</h3>
        <p>{isSupabaseConfigured ? 'Supabase 连接配置已检测到。完成数据库表结构和权限策略后，这里将展示真实客户数据。' : '当前还没有加载客户数据。下一步将接入 Supabase 数据表与安全访问策略。'}</p>
        <Button renderIcon={Add} onClick={() => setNotice('客户数据尚未接入：需要完成 Supabase 表结构、RLS 权限策略和新增/编辑流程。')}>规划客户数据接入</Button>
      </div>
      <div className="table-footer"><span>当前为基础界面阶段，未写入任何客户数据</span><span>第 1 页 <span className="footer-divider">·</span> 共 0 条</span></div>
      </Tile></Column>
    </Grid>
  </div>;
}
