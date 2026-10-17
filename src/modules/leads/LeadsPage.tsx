import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Search as CarbonSearch, Tag, Tile, Modal, ModalHeader, ModalHeading, ModalBody, InlineNotification } from '../../components/carbon/compat';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Add, Filter, UserMultiple, Renew, ArrowRight, CheckmarkFilled } from '../../components/carbon/icons';

import { Button } from '../../components/ui/Button';
import { TextInput, SelectInput, SelectItem, TextAreaInput } from '../../components/ui/Field';
import './leads.css';
import { supabase } from '../../lib/supabase';

type LeadStatus = '新线索' | '跟进中' | '已确认' | '已转化' | '无效' | '暂缓';
type Lead = {
  id: string; name: string; title: string; company: string; website: string; email: string; whatsapp: string;
  phone: string; country: string; city: string; timezone: string; language: string; source: string; sourceDetail: string;
  enteredAt: string; inquiryAt: string; product: string; volume: string; targetPrice: string; customerType: string;
  inquiry: string; owner: string; status: LeadStatus; score: number; grade: 'A'|'B'|'C'; lastFollowUp: string;
  nextFollowUp: string; lossReason: string; pool: boolean;
};

const sourceOptions = ['阿里国际站','Facebook','独立站','展会','LinkedIn','开发信','WhatsApp','海关数据','AI 获取','搜索引擎','地图','邮件','老客户推荐','其他'];
const customerTypes = ['进口商','批发商','零售商','品牌商','电商卖家','其他'];
const blankLead = (): Lead => ({id:'',name:'',title:'',company:'',website:'',email:'',whatsapp:'',phone:'',country:'',city:'',timezone:'',language:'English',source:'',sourceDetail:'',enteredAt:new Date().toISOString().slice(0,10),inquiryAt:'',product:'',volume:'',targetPrice:'',customerType:'',inquiry:'',owner:'公共线索池',status:'新线索',score:0,grade:'C',lastFollowUp:'—',nextFollowUp:'',lossReason:'',pool:true});
function calculateScore(lead: Partial<Lead>) {
  let score = 0;
  if (['美国','加拿大','德国','英国','法国','西班牙','日本','澳大利亚','荷兰'].includes(lead.country ?? '')) score += 25;
  if (lead.customerType && lead.customerType !== '其他') score += 15;
  if (lead.volume && lead.volume !== '待确认') score += 20;
  if (lead.website?.trim()) score += 20;
  const domain = lead.email?.split('@')[1]?.toLowerCase() ?? '';
  if (domain && !['gmail.com','yahoo.com','outlook.com','hotmail.com','163.com','qq.com'].includes(domain)) score += 20;
  return Math.min(score,100);
}
function gradeOf(score:number):'A'|'B'|'C' { return score >= 80 ? 'A' : score >= 55 ? 'B' : 'C'; }

type DbLead = Record<string, any>;
const stageToStatus: Record<string, LeadStatus> = {
  new: '新线索', contacted: '跟进中', qualified: '已确认', proposal: '已确认',
  won: '已确认', lost: '无效', on_hold: '暂缓', converted: '已转化',
};
const statusToStage: Record<LeadStatus, string> = {
  '新线索': 'new', '跟进中': 'contacted', '已确认': 'qualified',
  '已转化': 'converted', '无效': 'lost', '暂缓': 'on_hold',
};
function fromDbLead(row: DbLead): Lead {
  const draft: Lead = {
    id: row.id, name: row.contact_name ?? '', title: row.contact_title ?? '',
    company: row.company_name ?? '', website: row.website ?? '', email: row.email ?? '',
    whatsapp: row.whatsapp ?? '', phone: row.phone ?? '', country: row.country ?? '',
    city: row.city ?? '', timezone: row.timezone ?? '', language: row.language ?? 'English',
    source: row.source ?? '', sourceDetail: row.source_detail ?? '',
    enteredAt: row.entered_at ?? row.created_at?.slice(0,10) ?? '',
    inquiryAt: row.inquiry_at ?? '', product: row.product_interest ?? '',
    volume: row.estimated_volume ?? '', targetPrice: row.target_price ?? '',
    customerType: row.customer_type ?? '', inquiry: row.notes ?? '',
    owner: row.owner_label ?? '我的线索', status: stageToStatus[row.stage] ?? '新线索',
    score: 0, grade: 'C', lastFollowUp: row.last_follow_up_at?.slice(0,10) ?? '—',
    nextFollowUp: row.next_follow_up_at?.slice(0,10) ?? '', lossReason: row.loss_reason ?? '',
    pool: row.in_public_pool ?? true,
  };
  draft.score = calculateScore(draft);
  draft.grade = gradeOf(draft.score);
  return draft;
}
async function fetchPersistedLeads(): Promise<Lead[]> {
  if (!supabase) throw new Error('Supabase 尚未配置，不能读取真实线索。');
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('读取云端线索失败：' + error.message);
  return (data ?? []).map(fromDbLead);
}

export function LeadsPage() {
  const [leads,setLeads] = useState<Lead[]>([]);
  const [query,setQuery] = useState('');
  const [statusFilter,setStatusFilter] = useState('全部线索');
  const [sourceFilter,setSourceFilter] = useState('全部来源');
  const [poolOnly,setPoolOnly] = useState(false);
  const [modalOpen,setModalOpen] = useState(false);
  const [editing,setEditing] = useState<Lead|null>(null);
  const [draft,setDraft] = useState<Lead>(blankLead());
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('线索工作台已就绪。');
  useEffect(() => {
    let active = true;
    fetchPersistedLeads().then(rows => { if (active) { setLeads(rows); setNotice(rows.length ? '已加载 Supabase 云端线索。' : '云端线索为空，可新建第一条真实线索。'); } })
      .catch(error => { if (active) setNotice(error instanceof Error ? error.message : '读取云端线索失败。'); });
    return () => { active = false; };
  }, []);


  const filtered = useMemo(()=>leads.filter(lead=>{
    const text = [lead.name,lead.company,lead.email,lead.country,lead.id,lead.product].join(' ').toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (statusFilter==='全部线索'||lead.status===statusFilter) && (sourceFilter==='全部来源'||lead.source===sourceFilter) && (!poolOnly||lead.pool);
  }),[leads,query,statusFilter,sourceFilter,poolOnly]);
  const counts = useMemo(()=>({all:leads.length,fresh:leads.filter(l=>l.status==='新线索').length,follow:leads.filter(l=>l.status==='跟进中').length,qualified:leads.filter(l=>l.status==='已确认').length,pool:leads.filter(l=>l.pool&&l.status!=='已转化').length}),[leads]);

  const openNew=()=>{setEditing(null);setDraft(blankLead());setError('');setModalOpen(true);};
  const openEdit=(lead:Lead)=>{if(lead.status==='已转化'){setNotice('已转化线索只读，请在关联的客户或商机中维护后续信息。');return;}setEditing(lead);setDraft({...lead});setError('');setModalOpen(true);};
  const saveLead=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!draft.company.trim()&&!draft.name.trim()){setError('请填写公司名称或联系人姓名。');return;}
    if(!draft.email.trim()&&!draft.whatsapp.trim()){setError('至少填写邮箱或 WhatsApp。');return;}
    if(!draft.source.trim()){setError('请选择线索来源。');return;}
    if(!draft.country.trim()){setError('国家/地区为必填项。');return;}
    if(!supabase){setError('Supabase 未配置；本次没有保存任何数据。');return;}
    setError('');
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if(userError || !userResult.user){setError('登录状态无效，请重新登录后保存。');return;}
    const payload = {
      owner_id: userResult.user.id,
      contact_name: draft.name.trim() || null, contact_title: draft.title.trim() || null,
      company_name: draft.company.trim() || null, website: draft.website.trim() || null,
      email: draft.email.trim() || null, whatsapp: draft.whatsapp.trim() || null,
      phone: draft.phone.trim() || null, country: draft.country.trim(), city: draft.city.trim() || null,
      timezone: draft.timezone.trim() || null, language: draft.language || 'English',
      source: draft.source, source_detail: draft.sourceDetail.trim() || null,
      entered_at: draft.enteredAt || null, inquiry_at: draft.inquiryAt || null,
      product_interest: draft.product.trim() || null, estimated_volume: draft.volume.trim() || null,
      target_price: draft.targetPrice.trim() || null, customer_type: draft.customerType || null,
      notes: draft.inquiry.trim() || null, stage: statusToStage[draft.status],
      next_follow_up_at: draft.nextFollowUp ? new Date(draft.nextFollowUp + 'T12:00:00Z').toISOString() : null,
      loss_reason: draft.lossReason.trim() || null, in_public_pool: draft.pool,
      owner_label: userResult.user.email ?? '我的线索',
    };
    const result = editing
      ? await supabase.from('leads').update(payload).eq('id', editing.id).select('*').single()
      : await supabase.from('leads').insert(payload).select('*').single();
    if(result.error || !result.data){setError('云端保存失败：' + (result.error?.message ?? '服务器未返回保存结果'));return;}
    const next = fromDbLead(result.data);
    setLeads(old=>editing?old.map(l=>l.id===editing.id?next:l):[next,...old]);
    setModalOpen(false);setNotice('已保存到 Supabase 云端。');
  };
  const updateStatus=async(lead:Lead,status:LeadStatus)=>{
    if(lead.status==='已转化'){setNotice('已转化线索为只读状态。');return;}
    if(!supabase){setNotice('Supabase 未配置；状态没有变更。');return;}
    if(status==='已转化'){
      if(!lead.company.trim()||!lead.name.trim()||!lead.country.trim()){setNotice('转化条件未满足：请先补齐公司名称、联系人姓名和国家/地区。');return;}
      try {
        const { data, error } = await supabase.rpc('convert_lead', { p_lead_id: lead.id, p_customer_id: null });
        if(error) throw error;
        if(!data?.customer_id || !data?.contact_id || !data?.opportunity_id) throw new Error('服务端没有返回完整的客户、联系人和商机编号。');
        const rows = await fetchPersistedLeads(); setLeads(rows);
        setModalOpen(false); setEditing(null);
        setNotice('线索已转化；客户、联系人、商机和审计记录已由数据库事务创建。');
      } catch(error) {
        setNotice('线索转化失败，数据库未确认完成：' + (error instanceof Error ? error.message : '未知错误'));
      }
      return;
    }
    const { data, error } = await supabase.from('leads').update({stage:statusToStage[status],loss_reason:lead.lossReason || null})
      .eq('id',lead.id).select('*').single();
    if(error || !data){setNotice('云端状态更新失败：' + (error?.message ?? '服务器未返回更新结果'));return;}
    const next=fromDbLead(data);setLeads(old=>old.map(l=>l.id===lead.id?next:l));setNotice('线索状态已保存到云端。');
  };
  return <div className="leads-page">
    <div className="page-heading leads-heading"><div><div className="eyebrow">LEAD MANAGEMENT</div><h1>线索管理</h1><p className="page-subtitle">集中管理尚未确认的潜在客户，从来源采集、资格判断到转化为正式客户关系。</p></div><div className="leads-heading-actions"><Button variant="secondary" renderIcon={Renew} onClick={()=>{fetchPersistedLeads().then(rows=>{setLeads(rows);setNotice('已刷新 Supabase 云端线索。');}).catch(error=>setNotice(error instanceof Error?error.message:'刷新云端线索失败。'));}}>刷新</Button><Button renderIcon={Add} onClick={openNew}>新建线索</Button></div></div>
    <InlineNotification kind="info" lowContrast title="操作提示" subtitle={notice} hideCloseButton />
    <div className="lead-stat-grid">
      <cds-clickable-tile href="#lead-list" link-role="button" className="lead-stat" aria-pressed={statusFilter==='全部线索'} onClick={(event: Event)=>{event.preventDefault();setStatusFilter('全部线索');}}><span>线索总数</span><strong>{counts.all}</strong><small>全部状态</small></cds-clickable-tile>
      <cds-clickable-tile href="#lead-list" link-role="button" className="lead-stat" aria-pressed={statusFilter==='新线索'} onClick={(event: Event)=>{event.preventDefault();setStatusFilter('新线索');}}><span>新线索</span><strong>{counts.fresh}</strong><small>待首次处理</small></cds-clickable-tile>
      <cds-clickable-tile href="#lead-list" link-role="button" className="lead-stat" aria-pressed={statusFilter==='跟进中'} onClick={(event: Event)=>{event.preventDefault();setStatusFilter('跟进中');}}><span>跟进中</span><strong>{counts.follow}</strong><small>等待回复或推进</small></cds-clickable-tile>
      <cds-clickable-tile href="#lead-list" link-role="button" className="lead-stat" aria-pressed={statusFilter==='已确认'} onClick={(event: Event)=>{event.preventDefault();setStatusFilter('已确认');}}><span>已确认</span><strong>{counts.qualified}</strong><small>具备转化条件</small></cds-clickable-tile>
      <cds-clickable-tile href="#lead-list" link-role="button" className="lead-stat" aria-pressed={poolOnly} onClick={(event: Event)=>{event.preventDefault();setPoolOnly(v=>!v);}}><span>公共线索池</span><strong>{counts.pool}</strong><small>{poolOnly?'正在查看公共池':'点击查看待认领'}</small></cds-clickable-tile>
    </div>
    <Tile className="leads-table-panel">
      <div className="leads-panel-heading"><div><h2>线索工作台</h2><p>点击线索行查看和维护资料；已转化线索为只读状态。</p></div></div>
      <div className="leads-toolbar"><CarbonSearch className="lead-search" labelText="搜索线索" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索姓名、公司、邮箱、国家或产品" /><div className="lead-filter carbon-field"><span>来源</span><SelectInput value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)} labelText="来源" hideLabel><SelectItem value="全部来源" text="全部来源" />{sourceOptions.map(s=><SelectItem key={s} value={s} text={s} />)}</SelectInput></div><div className="lead-filter carbon-field"><span>状态</span><SelectInput value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} labelText="状态" hideLabel>{['全部线索','新线索','跟进中','已确认','已转化','无效','暂缓'].map(s=><SelectItem key={s} value={s} text={s} />)}</SelectInput></div><Button variant="ghost" renderIcon={Filter} onClick={()=>{setQuery('');setSourceFilter('全部来源');setStatusFilter('全部线索');setPoolOnly(false);}}>重置筛选</Button></div>
      <div className="leads-table-wrap"><Table className="leads-table"><TableHead><TableRow><TableHeader>联系人 / 公司</TableHeader><TableHeader>国家 / 地区</TableHeader><TableHeader>来源</TableHeader><TableHeader>产品需求</TableHeader><TableHeader>负责人</TableHeader><TableHeader>评分</TableHeader><TableHeader>状态</TableHeader><TableHeader>下次跟进</TableHeader><TableHeader aria-label="操作"/></TableRow></TableHead><TableBody>{filtered.map(lead=><TableRow key={lead.id} onClick={()=>openEdit(lead)} className={lead.status==='已转化'?'is-converted':''} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')openEdit(lead);}}><TableCell><div className="lead-person"><strong>{lead.name||'未填写联系人'}</strong><span>{lead.company||'公司待确认'}</span><small>{lead.email||lead.whatsapp||lead.phone||'暂无联系方式'}</small></div></TableCell><TableCell>{lead.country||'—'}{lead.city&&<small className="lead-cell-sub">{lead.city}</small>}</TableCell><TableCell><span className="lead-source">{lead.source}</span><small className="lead-cell-sub">{lead.sourceDetail||'—'}</small></TableCell><TableCell>{lead.product||'待确认'}<small className="lead-cell-sub">{lead.volume||'采购量待确认'}</small></TableCell><TableCell><span className={lead.pool?'pool-owner':''}>{lead.owner}</span></TableCell><TableCell><Tag type={lead.grade==='A'?'green':lead.grade==='B'?'blue':'gray'}>{lead.grade}</Tag><strong className="lead-score">{lead.score}</strong></TableCell><TableCell><Tag type={lead.status==='已转化'?'green':lead.status==='无效'?'red':lead.status==='暂缓'?'warm-gray':lead.status==='跟进中'?'blue':'gray'}>{lead.status}</Tag></TableCell><TableCell>{lead.nextFollowUp||'—'}</TableCell><TableCell onClick={e=>e.stopPropagation()}><Button type="button" variant="ghost" className="lead-row-action" aria-label={'编辑 '+lead.name} onClick={()=>openEdit(lead)}><ArrowRight size={17}/></Button></TableCell></TableRow>)}</TableBody></Table>{filtered.length===0&&<div className="leads-empty"><UserMultiple size={28}/><strong>没有符合条件的线索</strong><span>尝试调整搜索词或筛选条件。</span></div>}</div>
      <div className="leads-table-footer"><span>显示 {filtered.length} 条线索</span><span>评分规则：目标市场 +25、客户类型 +15、明确采购量 +20、公司官网 +20、企业邮箱 +20</span></div>
    </Tile>
    {modalOpen&&<Modal open size="lg" aria-label={editing?'线索资料':'新建线索'} onClose={()=>setModalOpen(false)}><ModalHeader><div><div className="eyebrow">{editing?'LEAD PROFILE':'CREATE LEAD'}</div><ModalHeading id="lead-modal-title">{editing?'线索资料':'新建线索'}</ModalHeading><p>创建必填：公司名或姓名、邮箱或 WhatsApp、来源、国家/地区。</p></div><Button type="button" variant="ghost" onClick={()=>setModalOpen(false)} aria-label="关闭">关闭</Button></ModalHeader><ModalBody>
      <form onSubmit={saveLead} className="lead-form"><div className="lead-form-section"><h3>基本信息</h3><div className="lead-form-grid"><div className="carbon-field"><span className="carbon-field__label">联系人姓名</span><TextInput value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="姓名" labelText="联系人姓名" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">职位</span><TextInput value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="职位" labelText="职位" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">公司名称</span><TextInput value={draft.company} onChange={e=>setDraft({...draft,company:e.target.value})} placeholder="公司法定或常用名称" labelText="公司名称" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">公司网站</span><TextInput value={draft.website} onChange={e=>setDraft({...draft,website:e.target.value})} placeholder="https://" labelText="公司网站" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">邮箱</span><TextInput type="email" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})} placeholder="name@company.com" labelText="邮箱" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">WhatsApp</span><TextInput value={draft.whatsapp} onChange={e=>setDraft({...draft,whatsapp:e.target.value})} placeholder="+国家区号" labelText="WhatsApp" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">电话</span><TextInput value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})} placeholder="电话号码" labelText="电话" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">国家 / 地区</span><TextInput required value={draft.country} onChange={e=>setDraft({...draft,country:e.target.value})} placeholder="国家或地区" labelText="国家 / 地区" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">城市</span><TextInput value={draft.city} onChange={e=>setDraft({...draft,city:e.target.value})} placeholder="城市" labelText="城市" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">时区</span><TextInput value={draft.timezone} onChange={e=>setDraft({...draft,timezone:e.target.value})} placeholder="如 Europe/Berlin" labelText="时区" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">沟通语言</span><SelectInput value={draft.language} onChange={e=>setDraft({...draft,language:e.target.value})} labelText="沟通语言" hideLabel><SelectItem value="English" text="English" /><SelectItem value="中文" text="中文" /><SelectItem value="Español" text="Español" /><SelectItem value="日本語" text="日本語" /><SelectItem value="Deutsch" text="Deutsch" /><SelectItem value="Français" text="Français" /><SelectItem value="العربية" text="العربية" /><SelectItem value="其他" text="其他" /></SelectInput></div></div></div>
      <div className="lead-form-section"><h3>来源信息</h3><div className="lead-form-grid"><div className="carbon-field"><span className="carbon-field__label">线索来源</span><SelectInput required value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})} labelText="线索来源" hideLabel><SelectItem value="" text="请选择来源" />{sourceOptions.map(s=><SelectItem key={s} value={s} text={s} />)}</SelectInput></div><div className="carbon-field"><span className="carbon-field__label">来源明细</span><TextInput value={draft.sourceDetail} onChange={e=>setDraft({...draft,sourceDetail:e.target.value})} placeholder="展会、广告系列、关键词、推荐人等" labelText="来源明细" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">首次询盘时间</span><TextInput type="date" value={draft.inquiryAt} onChange={e=>setDraft({...draft,inquiryAt:e.target.value})} labelText="首次询盘时间" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">进入系统时间</span><TextInput type="date" value={draft.enteredAt} onChange={e=>setDraft({...draft,enteredAt:e.target.value})} labelText="进入系统时间" hideLabel/></div></div></div>
      <div className="lead-form-section"><h3>需求信息</h3><div className="lead-form-grid"><div className="carbon-field"><span className="carbon-field__label">感兴趣的产品品类</span><TextInput value={draft.product} onChange={e=>setDraft({...draft,product:e.target.value})} placeholder="产品类别" labelText="感兴趣的产品品类" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">预估采购量</span><TextInput value={draft.volume} onChange={e=>setDraft({...draft,volume:e.target.value})} placeholder="数量 / 周期" labelText="预估采购量" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">目标价格（选填）</span><TextInput value={draft.targetPrice} onChange={e=>setDraft({...draft,targetPrice:e.target.value})} placeholder="币种与目标价格" labelText="目标价格（选填）" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">客户类型</span><SelectInput value={draft.customerType} onChange={e=>setDraft({...draft,customerType:e.target.value})} labelText="客户类型" hideLabel><SelectItem value="" text="请选择" />{customerTypes.map(s=><SelectItem key={s} value={s} text={s} />)}</SelectInput></div><div className="lead-form-full carbon-field"><span className="carbon-field__label">询盘原文</span><TextAreaInput value={draft.inquiry} onChange={e=>setDraft({...draft,inquiry:e.target.value})} rows={4} placeholder="保留原始邮件或消息，不覆盖原文" labelText="询盘原文" hideLabel/></div></div></div>
      <div className="lead-form-section"><h3>分配与跟进</h3><div className="lead-form-grid"><div className="carbon-field"><span className="carbon-field__label">负责人（当前账号）</span><TextInput value={draft.owner} readOnly placeholder="由登录账号自动确定" labelText="负责人（当前账号）" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">线索状态</span><SelectInput value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as LeadStatus})} labelText="线索状态" hideLabel><SelectItem value="新线索" text="新线索" /><SelectItem value="跟进中" text="跟进中" /><SelectItem value="已确认" text="已确认" /><SelectItem value="无效" text="无效" /><SelectItem value="暂缓" text="暂缓" /></SelectInput></div><div className="carbon-field"><span className="carbon-field__label">下次跟进日期</span><TextInput type="date" value={draft.nextFollowUp} onChange={e=>setDraft({...draft,nextFollowUp:e.target.value})} labelText="下次跟进日期" hideLabel/></div><div className="carbon-field"><span className="carbon-field__label">无效 / 丢失原因</span><TextInput value={draft.lossReason} onChange={e=>setDraft({...draft,lossReason:e.target.value})} placeholder="如垃圾询盘、同行、暂无需求" labelText="无效 / 丢失原因" hideLabel/></div></div><div className="lead-score-preview"><span>当前预估评分</span><strong>{calculateScore(draft)} / 100</strong><span className={'lead-grade grade-'+gradeOf(calculateScore(draft)).toLowerCase()}>{gradeOf(calculateScore(draft))} 级</span><small>评分由国家、客户类型、采购量、官网和企业邮箱计算。</small></div></div>
      {error&&<p className="lead-form-error" role="alert">{error}</p>}<footer className="lead-modal-footer">{editing&&draft.status!=='已转化'&&<Button variant="secondary" type="button" onClick={()=>updateStatus(draft,'已转化')}>转化为客户与商机</Button>}<Button variant="secondary" type="button" onClick={()=>setModalOpen(false)}>取消</Button><Button type="submit" renderIcon={CheckmarkFilled}>{editing?'保存修改':'创建线索'}</Button></footer></form></ModalBody></Modal>}
  </div>;
}
