import { useMemo, useState, type FormEvent } from 'react';
import { Add, Filter, Search, UserMultiple, Renew, ArrowRight, Close, CheckmarkFilled, WarningAlt } from '@carbon/react/icons';
import { Tag, Tile } from '@carbon/react';
import { Button } from '../../components/ui/Button';
import './leads.css';

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
const initialLeads: Lead[] = [
  {id:'LD-20261016-001',name:'Oliver Smith',title:'采购总监',company:'Northstar Industrial Ltd.',website:'https://northstar.example',email:'oliver@northstar.example',whatsapp:'+1 415 555 0188',phone:'',country:'美国',city:'San Francisco',timezone:'America/Los_Angeles',language:'English',source:'LinkedIn',sourceDetail:'Industrial sourcing campaign',enteredAt:'2026-10-16',inquiryAt:'2026-10-16',product:'工业传感器',volume:'2,000 件/季度',targetPrice:'',customerType:'进口商',inquiry:'We are evaluating suppliers for industrial sensors. Please share your catalog and MOQ.',owner:'公共线索池',status:'新线索',score:92,grade:'A',lastFollowUp:'—',nextFollowUp:'2026-10-16',lossReason:'',pool:true},
  {id:'LD-20261015-008',name:'Maria Garcia',title:'Sourcing Manager',company:'Iberia Trade Group',website:'https://iberiatrade.example',email:'m.garcia@iberiatrade.example',whatsapp:'',phone:'+34 91 555 0180',country:'西班牙',city:'Madrid',timezone:'Europe/Madrid',language:'Español',source:'展会',sourceDetail:'Feria Valencia 2026',enteredAt:'2026-10-15',inquiryAt:'2026-10-15',product:'包装设备',volume:'1 条生产线',targetPrice:'€ 30,000–40,000',customerType:'批发商',inquiry:'Interested in packaging line options and delivery lead time.',owner:'销售团队 A',status:'跟进中',score:81,grade:'A',lastFollowUp:'2026-10-16',nextFollowUp:'2026-10-19',lossReason:'',pool:false},
  {id:'LD-20261014-003',name:'Kenji Tanaka',title:'CEO',company:'',website:'',email:'kenji.t@example.jp',whatsapp:'+81 90 5555 0192',phone:'',country:'日本',city:'大阪',timezone:'Asia/Tokyo',language:'日本語',source:'阿里国际站',sourceDetail:'RFQ #JP-4482',enteredAt:'2026-10-14',inquiryAt:'2026-10-14',product:'电子配件',volume:'待确认',targetPrice:'',customerType:'其他',inquiry:'Requesting samples and product specifications.',owner:'销售团队 B',status:'跟进中',score:58,grade:'C',lastFollowUp:'2026-10-15',nextFollowUp:'2026-10-17',lossReason:'',pool:false},
  {id:'LD-20261012-006',name:'Sofia Müller',title:'E-commerce Buyer',company:'Alpine Retail GmbH',website:'https://alpineretail.example',email:'sofia@alpineretail.example',whatsapp:'',phone:'+49 30 555 0104',country:'德国',city:'Berlin',timezone:'Europe/Berlin',language:'Deutsch',source:'独立站',sourceDetail:'Product page contact form',enteredAt:'2026-10-12',inquiryAt:'2026-10-12',product:'智能家居产品',volume:'500–800 件',targetPrice:'€ 18/件以内',customerType:'电商卖家',inquiry:'Looking for a long-term OEM supplier for smart home products.',owner:'销售团队 A',status:'已确认',score:87,grade:'A',lastFollowUp:'2026-10-16',nextFollowUp:'2026-10-17',lossReason:'',pool:false},
];

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

export function LeadsPage() {
  const [leads,setLeads] = useState<Lead[]>(initialLeads);
  const [query,setQuery] = useState('');
  const [statusFilter,setStatusFilter] = useState('全部线索');
  const [sourceFilter,setSourceFilter] = useState('全部来源');
  const [poolOnly,setPoolOnly] = useState(false);
  const [modalOpen,setModalOpen] = useState(false);
  const [editing,setEditing] = useState<Lead|null>(null);
  const [draft,setDraft] = useState<Lead>(blankLead());
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('当前为界面样例数据，尚未连接真实线索数据库。');

  const filtered = useMemo(()=>leads.filter(lead=>{
    const text = [lead.name,lead.company,lead.email,lead.country,lead.id,lead.product].join(' ').toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (statusFilter==='全部线索'||lead.status===statusFilter) && (sourceFilter==='全部来源'||lead.source===sourceFilter) && (!poolOnly||lead.pool);
  }),[leads,query,statusFilter,sourceFilter,poolOnly]);
  const counts = useMemo(()=>({all:leads.length,fresh:leads.filter(l=>l.status==='新线索').length,follow:leads.filter(l=>l.status==='跟进中').length,qualified:leads.filter(l=>l.status==='已确认').length,pool:leads.filter(l=>l.pool&&l.status!=='已转化').length}),[leads]);

  const openNew=()=>{setEditing(null);setDraft(blankLead());setError('');setModalOpen(true);};
  const openEdit=(lead:Lead)=>{if(lead.status==='已转化'){setNotice('已转化线索只读，请在关联的客户或商机中维护后续信息。');return;}setEditing(lead);setDraft({...lead});setError('');setModalOpen(true);};
  const saveLead=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!draft.company.trim()&&!draft.name.trim()){setError('请填写公司名称或联系人姓名。');return;}
    if(!draft.email.trim()&&!draft.whatsapp.trim()){setError('至少填写邮箱或 WhatsApp。');return;}
    if(!draft.source.trim()){setError('请选择线索来源。');return;}
    if(!draft.country.trim()){setError('国家/地区为必填项。');return;}
    const score=calculateScore(draft); const next={...draft,id:editing?.id??'LD-'+Date.now().toString().slice(-8),score,grade:gradeOf(score)};
    setLeads(old=>editing?old.map(l=>l.id===editing.id?next:l):[next,...old]);
    setModalOpen(false);setNotice('已更新当前页面的样例状态。请注意：目前不会保存到云端数据库。');
  };
  const updateStatus=(lead:Lead,status:LeadStatus)=>{
    if(status==='已转化'){
      if(!lead.company.trim()||!lead.name.trim()||!lead.product.trim()||!lead.country.trim()){setNotice('转化条件未满足：请先补齐公司名称、联系人姓名、产品品类和国家/地区。');return;}
      setNotice('转化流程入口已预留；当前版本不会自动创建 Account、Contact 或 Opportunity。');return;
    }
    setLeads(old=>old.map(l=>l.id===lead.id?{...l,status}:l));
  };
  return <div className="leads-page">
    <div className="page-heading leads-heading"><div><div className="eyebrow">LEAD MANAGEMENT</div><h1>线索（Lead）</h1><p className="page-subtitle">集中管理尚未确认的潜在客户，从来源采集、资格判断到转化为正式客户关系。</p></div><div className="leads-heading-actions"><Button variant="secondary" renderIcon={Renew} onClick={()=>setNotice('已刷新当前页面状态；样例数据并未从服务器同步。')}>刷新</Button><Button renderIcon={Add} onClick={openNew}>新建线索</Button></div></div>
    <div className="leads-notice" role="status"><WarningAlt size={17}/><span>{notice}</span></div>
    <div className="lead-stat-grid">
      <button type="button" className={'lead-stat'+(statusFilter==='全部线索'?' active':'')} onClick={()=>setStatusFilter('全部线索')}><span>线索总数</span><strong>{counts.all}</strong><small>全部状态</small></button>
      <button type="button" className={'lead-stat'+(statusFilter==='新线索'?' active':'')} onClick={()=>setStatusFilter('新线索')}><span>新线索</span><strong>{counts.fresh}</strong><small>待首次处理</small></button>
      <button type="button" className={'lead-stat'+(statusFilter==='跟进中'?' active':'')} onClick={()=>setStatusFilter('跟进中')}><span>跟进中</span><strong>{counts.follow}</strong><small>等待回复或推进</small></button>
      <button type="button" className={'lead-stat'+(statusFilter==='已确认'?' active':'')} onClick={()=>setStatusFilter('已确认')}><span>已确认</span><strong>{counts.qualified}</strong><small>具备转化条件</small></button>
      <button type="button" className={'lead-stat'+(poolOnly?' active':'')} onClick={()=>setPoolOnly(v=>!v)}><span>公共线索池</span><strong>{counts.pool}</strong><small>{poolOnly?'正在查看公共池':'点击查看待认领'}</small></button>
    </div>
    <Tile className="leads-table-panel">
      <div className="leads-panel-heading"><div><h2>线索工作台</h2><p>点击线索行查看和维护资料；已转化线索为只读状态。</p></div><Tag type="blue">样例数据</Tag></div>
      <div className="leads-toolbar"><label className="lead-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索姓名、公司、邮箱、国家或产品" aria-label="搜索线索"/></label><label className="lead-filter"><span>来源</span><select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option>全部来源</option>{sourceOptions.map(s=><option key={s}>{s}</option>)}</select></label><label className="lead-filter"><span>状态</span><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>{['全部线索','新线索','跟进中','已确认','已转化','无效','暂缓'].map(s=><option key={s}>{s}</option>)}</select></label><Button variant="ghost" renderIcon={Filter} onClick={()=>{setQuery('');setSourceFilter('全部来源');setStatusFilter('全部线索');setPoolOnly(false);}}>重置筛选</Button></div>
      <div className="leads-table-wrap"><table className="leads-table"><thead><tr><th>联系人 / 公司</th><th>国家 / 地区</th><th>来源</th><th>产品需求</th><th>负责人</th><th>评分</th><th>状态</th><th>下次跟进</th><th aria-label="操作"/></tr></thead><tbody>{filtered.map(lead=><tr key={lead.id} onClick={()=>openEdit(lead)} className={lead.status==='已转化'?'is-converted':''} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')openEdit(lead);}}><td><div className="lead-person"><strong>{lead.name||'未填写联系人'}</strong><span>{lead.company||'公司待确认'}</span><small>{lead.email||lead.whatsapp||lead.phone||'暂无联系方式'}</small></div></td><td>{lead.country||'—'}{lead.city&&<small className="lead-cell-sub">{lead.city}</small>}</td><td><span className="lead-source">{lead.source}</span><small className="lead-cell-sub">{lead.sourceDetail||'—'}</small></td><td>{lead.product||'待确认'}<small className="lead-cell-sub">{lead.volume||'采购量待确认'}</small></td><td><span className={lead.pool?'pool-owner':''}>{lead.owner}</span></td><td><span className={'lead-grade grade-'+lead.grade.toLowerCase()}>{lead.grade}</span><strong className="lead-score">{lead.score}</strong></td><td><span className={'lead-status status-'+lead.status.replace('线索','fresh').replace('跟进中','follow').replace('已确认','qualified').replace('已转化','converted').replace('无效','invalid').replace('暂缓','paused')}>{lead.status}</span></td><td>{lead.nextFollowUp||'—'}</td><td onClick={e=>e.stopPropagation()}><button type="button" className="lead-row-action" aria-label={'编辑 '+lead.name} onClick={()=>openEdit(lead)}><ArrowRight size={17}/></button></td></tr>)}</tbody></table>{filtered.length===0&&<div className="leads-empty"><UserMultiple size={28}/><strong>没有符合条件的线索</strong><span>尝试调整搜索词或筛选条件。</span></div>}</div>
      <div className="leads-table-footer"><span>显示 {filtered.length} 条线索 · 样例数据</span><span>评分规则：目标市场 +25、客户类型 +15、明确采购量 +20、公司官网 +20、企业邮箱 +20</span></div>
    </Tile>
    {modalOpen&&<div className="lead-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModalOpen(false);}}><section className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title"><header className="lead-modal-header"><div><div className="eyebrow">{editing?'LEAD PROFILE':'CREATE LEAD'}</div><h2 id="lead-modal-title">{editing?'线索资料':'新建线索'}</h2><p>创建必填：公司名或姓名、邮箱或 WhatsApp、来源、国家/地区。</p></div><button type="button" className="lead-close" onClick={()=>setModalOpen(false)} aria-label="关闭"><Close size={20}/></button></header>
      <form onSubmit={saveLead} className="lead-form"><div className="lead-form-section"><h3>基本信息</h3><div className="lead-form-grid"><label>联系人姓名<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="姓名"/></label><label>职位<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="职位"/></label><label>公司名称<input value={draft.company} onChange={e=>setDraft({...draft,company:e.target.value})} placeholder="公司法定或常用名称"/></label><label>公司网站<input value={draft.website} onChange={e=>setDraft({...draft,website:e.target.value})} placeholder="https://"/></label><label>邮箱<input type="email" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})} placeholder="name@company.com"/></label><label>WhatsApp<input value={draft.whatsapp} onChange={e=>setDraft({...draft,whatsapp:e.target.value})} placeholder="+国家区号"/></label><label>电话<input value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})} placeholder="电话号码"/></label><label>国家 / 地区<input required value={draft.country} onChange={e=>setDraft({...draft,country:e.target.value})} placeholder="国家或地区"/></label><label>城市<input value={draft.city} onChange={e=>setDraft({...draft,city:e.target.value})} placeholder="城市"/></label><label>时区<input value={draft.timezone} onChange={e=>setDraft({...draft,timezone:e.target.value})} placeholder="如 Europe/Berlin"/></label><label>沟通语言<select value={draft.language} onChange={e=>setDraft({...draft,language:e.target.value})}><option>English</option><option>中文</option><option>Español</option><option>日本語</option><option>Deutsch</option><option>Français</option><option>العربية</option><option>其他</option></select></label></div></div>
      <div className="lead-form-section"><h3>来源信息</h3><div className="lead-form-grid"><label>线索来源<select required value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})}><option value="">请选择来源</option>{sourceOptions.map(s=><option key={s}>{s}</option>)}</select></label><label>来源明细<input value={draft.sourceDetail} onChange={e=>setDraft({...draft,sourceDetail:e.target.value})} placeholder="展会、广告系列、关键词、推荐人等"/></label><label>首次询盘时间<input type="date" value={draft.inquiryAt} onChange={e=>setDraft({...draft,inquiryAt:e.target.value})}/></label><label>进入系统时间<input type="date" value={draft.enteredAt} onChange={e=>setDraft({...draft,enteredAt:e.target.value})}/></label></div></div>
      <div className="lead-form-section"><h3>需求信息</h3><div className="lead-form-grid"><label>感兴趣的产品品类<input value={draft.product} onChange={e=>setDraft({...draft,product:e.target.value})} placeholder="产品类别"/></label><label>预估采购量<input value={draft.volume} onChange={e=>setDraft({...draft,volume:e.target.value})} placeholder="数量 / 周期"/></label><label>目标价格（选填）<input value={draft.targetPrice} onChange={e=>setDraft({...draft,targetPrice:e.target.value})} placeholder="币种与目标价格"/></label><label>客户类型<select value={draft.customerType} onChange={e=>setDraft({...draft,customerType:e.target.value})}><option value="">请选择</option>{customerTypes.map(s=><option key={s}>{s}</option>)}</select></label><label className="lead-form-full">询盘原文<textarea value={draft.inquiry} onChange={e=>setDraft({...draft,inquiry:e.target.value})} rows={4} placeholder="保留原始邮件或消息，不覆盖原文"/></label></div></div>
      <div className="lead-form-section"><h3>分配与跟进</h3><div className="lead-form-grid"><label>负责人<input value={draft.owner} onChange={e=>setDraft({...draft,owner:e.target.value})} placeholder="负责人或公共线索池"/></label><label>线索状态<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as LeadStatus})}><option>新线索</option><option>跟进中</option><option>已确认</option><option>无效</option><option>暂缓</option></select></label><label>下次跟进日期<input type="date" value={draft.nextFollowUp} onChange={e=>setDraft({...draft,nextFollowUp:e.target.value})}/></label><label>无效 / 丢失原因<input value={draft.lossReason} onChange={e=>setDraft({...draft,lossReason:e.target.value})} placeholder="如垃圾询盘、同行、暂无需求"/></label></div><div className="lead-score-preview"><span>当前预估评分</span><strong>{calculateScore(draft)} / 100</strong><span className={'lead-grade grade-'+gradeOf(calculateScore(draft)).toLowerCase()}>{gradeOf(calculateScore(draft))} 级</span><small>评分由国家、客户类型、采购量、官网和企业邮箱计算。</small></div></div>
      {error&&<p className="lead-form-error" role="alert">{error}</p>}<footer className="lead-modal-footer">{editing&&<Button variant="secondary" type="button" onClick={()=>updateStatus(draft,'已转化')}>检查转化条件</Button>}<Button variant="secondary" type="button" onClick={()=>setModalOpen(false)}>取消</Button><Button type="submit" renderIcon={CheckmarkFilled}>{editing?'保存修改':'创建线索'}</Button></footer></form></section></div>}
  </div>;
}
