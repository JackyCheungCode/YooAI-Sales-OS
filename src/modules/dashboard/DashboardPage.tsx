import { Column, Grid, Tag, Tile } from '@carbon/react';
import { useMemo, useState, type ReactNode } from 'react';
import { Dashboard, UserMultiple, Filter, Download, WarningAlt, ChartLine, ShoppingCart, Headset, Currency, Trophy, Renew } from '@carbon/react/icons';
import { Button } from '../../components/ui/Button';
import { SelectInput, SelectItem } from '../../components/ui/Field';
import './dashboard.css';

type Area = 'overview' | 'sales' | 'orders' | 'service' | 'marketing' | 'commerce';
type Metric = { label: string; value: string; delta: string; tone?: 'good' | 'warn' | 'neutral'; icon: ReactNode };

const areas: { id: Area; label: string }[] = [
  { id: 'overview', label: '管理层总览' },
  { id: 'sales', label: '销售绩效' },
  { id: 'orders', label: '订单与回款' },
  { id: 'service', label: '客户服务运营' },
  { id: 'marketing', label: '营销与客户洞察' },
  { id: 'commerce', label: '数字商务经营' },
];

const metricSets: Record<Area, Metric[]> = {
  overview: [
    { label: '本期收入', value: '¥ 2,486,800', delta: '较上期 +12.8%', tone: 'good', icon: <Currency size={20} /> },
    { label: '目标达成率', value: '78.4%', delta: '距目标还差 21.6%', tone: 'warn', icon: <Trophy size={20} /> },
    { label: '新增商机金额', value: '¥ 3,820,000', delta: '较上期 +8.6%', tone: 'good', icon: <ChartLine size={20} /> },
    { label: '赢单率', value: '32.6%', delta: '较上期 +2.4 个百分点', tone: 'good', icon: <Dashboard size={20} /> },
    { label: '未结工单数', value: '28', delta: '7 个临近 SLA 时限', tone: 'warn', icon: <Headset size={20} /> },
    { label: '客户满意度 CSAT', value: '94.2%', delta: '较上期 +1.2 个百分点', tone: 'good', icon: <UserMultiple size={20} /> },
  ],
  sales: [
    { label: '销售漏斗总额', value: '¥ 12.84M', delta: '6 个阶段在跟进', icon: <ChartLine size={20} /> },
    { label: '赢单率', value: '32.6%', delta: '较上期 +2.4 个百分点', tone: 'good', icon: <Trophy size={20} /> },
    { label: '平均成交周期', value: '34 天', delta: '较上期缩短 3 天', tone: 'good', icon: <Renew size={20} /> },
    { label: '预测业绩达成', value: '86.2%', delta: '低于目标 13.8%', tone: 'warn', icon: <Currency size={20} /> },
    { label: '线索转化率', value: '18.7%', delta: '较上期 +1.8 个百分点', tone: 'good', icon: <UserMultiple size={20} /> },
    { label: '活跃销售人员', value: '24 人', delta: '排名按已确认业绩计算', icon: <Trophy size={20} /> },
  ],
  orders: [
    { label: '订单总额', value: '¥ 4.62M', delta: '较上期 +9.3%', tone: 'good', icon: <ShoppingCart size={20} /> },
    { label: '待交付订单', value: '16', delta: '4 笔存在延期风险', tone: 'warn', icon: <WarningAlt size={20} /> },
    { label: '待回款金额', value: '¥ 1.28M', delta: '逾期 ¥ 186,000', tone: 'warn', icon: <Currency size={20} /> },
    { label: '按期交付率', value: '91.4%', delta: '目标 95%', tone: 'warn', icon: <Dashboard size={20} /> },
    { label: '逾期应收账款', value: '¥ 186K', delta: '需优先跟进', tone: 'warn', icon: <WarningAlt size={20} /> },
    { label: '库存可供量', value: '待同步', delta: '接入库存系统后显示', icon: <ShoppingCart size={20} /> },
  ],
  service: [
    { label: '工单总量', value: '386', delta: '本期新建工单', icon: <Headset size={20} /> },
    { label: '未结工单', value: '28', delta: '7 个临近 SLA 时限', tone: 'warn', icon: <WarningAlt size={20} /> },
    { label: 'SLA 达成率', value: '96.8%', delta: '目标 98%', tone: 'warn', icon: <Dashboard size={20} /> },
    { label: '首次响应时长', value: '18 分钟', delta: '较上期缩短 6 分钟', tone: 'good', icon: <Renew size={20} /> },
    { label: '平均解决时长', value: '5.4 小时', delta: '较上期缩短 8.1%', tone: 'good', icon: <ChartLine size={20} /> },
    { label: '一线解决率', value: '81.2%', delta: 'CSAT 94.2%', tone: 'good', icon: <UserMultiple size={20} /> },
  ],
  marketing: [
    { label: '营销活动', value: '12 场', delta: '8 场已完成', icon: <Dashboard size={20} /> },
    { label: '有效线索', value: '1,248', delta: '线索质量评分 82/100', tone: 'good', icon: <UserMultiple size={20} /> },
    { label: '渠道 ROI', value: '3.8×', delta: '按已归因收入估算', tone: 'good', icon: <ChartLine size={20} /> },
    { label: '高价值客户', value: '186', delta: '按客户分群规则统计', icon: <Trophy size={20} /> },
    { label: '复购率', value: '28.4%', delta: '较上期 +3.1 个百分点', tone: 'good', icon: <Renew size={20} /> },
    { label: '流失风险客户', value: '23', delta: '建议安排客户回访', tone: 'warn', icon: <WarningAlt size={20} /> },
  ],
  commerce: [
    { label: '线上订单量', value: '2,486', delta: '较上期 +14.2%', tone: 'good', icon: <ShoppingCart size={20} /> },
    { label: '商品交易总额 GMV', value: '¥ 1.86M', delta: '较上期 +11.6%', tone: 'good', icon: <Currency size={20} /> },
    { label: '下单转化率', value: '3.42%', delta: '较上期 +0.36 个百分点', tone: 'good', icon: <ChartLine size={20} /> },
    { label: '平均客单价', value: '¥ 748', delta: '较上期 +4.8%', tone: 'good', icon: <Dashboard size={20} /> },
    { label: '动销商品', value: '438', delta: '在售商品 612 款', icon: <ShoppingCart size={20} /> },
    { label: '缺货预警商品', value: '17', delta: '需核对库存与补货计划', tone: 'warn', icon: <WarningAlt size={20} /> },
  ],
};

const funnel = [
  { name: '潜在线索', amount: '¥ 12.8M', width: 100, count: '1,248' },
  { name: '已确认需求', amount: '¥ 8.6M', width: 78, count: '684' },
  { name: '方案与报价', amount: '¥ 5.4M', width: 59, count: '326' },
  { name: '商务谈判', amount: '¥ 3.2M', width: 41, count: '142' },
  { name: '赢单', amount: '¥ 1.9M', width: 25, count: '46' },
];
const risks = [
  { type: '逾期回款', title: '华东区域 · 星河工业', detail: '应收 ¥ 186,000 · 已逾期 18 天', level: '高风险' },
  { type: 'SLA 超时', title: '客户支持工单 #CS-2048', detail: '首次响应超时 42 分钟 · 指派服务组待处理', level: '高风险' },
  { type: '大单停滞', title: '北美区域 · Orion Systems', detail: '商机金额 ¥ 820,000 · 14 天无活动', level: '需关注' },
];

function TrendChart() {
  const points = '20,112 68,92 116,101 164,63 212,72 260,42 308,55 356,24';
  return <div className="dash-chart" role="img" aria-label="近八个月收入趋势，整体呈增长趋势">
    <div className="chart-summary"><strong>¥ 2.49M</strong><span className="dash-positive">↗ 12.8%</span><span className="chart-summary__note">本期累计收入</span></div>
    <svg viewBox="0 0 380 145" className="trend-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f62fe" stopOpacity=".20"/><stop offset="100%" stopColor="#0f62fe" stopOpacity="0"/></linearGradient></defs>
      {[25,55,85,115].map(y=><line key={y} x1="0" x2="380" y1={y} y2={y} stroke="var(--cds-border-subtle-01)" strokeDasharray="3 4" />)}
      <polygon points={'20,130 '+points+' 356,130'} fill="url(#revenue-fill)" />
      <polyline points={points} fill="none" stroke="#0f62fe" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.split(' ').map((point,i)=>{const [cx,cy]=point.split(',');return <circle key={i} cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke="#0f62fe" strokeWidth="2"/>})}
    </svg>
    <div className="chart-axis"><span>3 月</span><span>4 月</span><span>5 月</span><span>6 月</span><span>7 月</span><span>8 月</span><span>9 月</span><span>10 月</span></div>
  </div>;
}

function FunnelChart() {
  return <div className="funnel-chart">{funnel.map((item,i)=><div className="funnel-row" key={item.name}>
    <span className="funnel-name">{item.name}</span><div className="funnel-track"><div className="funnel-fill" style={{width: item.width+'%',opacity:1-i*.12}} /></div><strong>{item.amount}</strong><span className="funnel-count">{item.count} 个</span>
  </div>)}</div>;
}

export function DashboardPage() {
  const [area, setArea] = useState<Area>('overview');
  const [period, setPeriod] = useState('month');
  const [region, setRegion] = useState('all');
  const [product, setProduct] = useState('all');
  const [team, setTeam] = useState('all');
  const [tier, setTier] = useState('all');
  const [updatedAt, setUpdatedAt] = useState('10:00');
  const metrics = useMemo(() => metricSets[area], [area]);
  const activeTitle = areas.find(item => item.id === area)?.label ?? '管理层总览';
  const refresh = () => setUpdatedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
  const showDrilldown = (name: string) => window.alert('“' + name + '”明细下钻入口已预留。当前数据为演示样例；接入业务数据源后将展示可追溯的真实记录。');

  return <div className="dashboard-page">
    <div className="page-heading dashboard-heading">
      <div><div className="eyebrow">YOOAI BUSINESS INTELLIGENCE</div><h1>经营智控中枢</h1><p className="page-subtitle">以统一指标看清增长、现金流、客户体验与经营风险。</p></div>
      <div className="dashboard-heading__actions"><Tag type="blue">演示数据 · 待接入真实数据源</Tag><Button variant="secondary" renderIcon={Download} onClick={() => window.alert('报表导出将在接入真实数据后开放。')}>导出报表</Button><Button renderIcon={Renew} onClick={refresh}>刷新视图</Button></div>
    </div>

    <Tile className="dashboard-filter-panel">
      <div className="dashboard-filter-title"><div><strong>全局分析条件</strong><span>所有经营板块共享当前筛选条件</span></div><button type="button" className="filter-reset" onClick={()=>{setPeriod('month');setRegion('all');setProduct('all');setTeam('all');setTier('all')}}>重置筛选</button></div>
      <Grid fullWidth className="dashboard-filters">
        <Column sm={4} md={4} lg={3}><SelectInput id="dash-period" labelText="统计时间" value={period} onChange={e=>setPeriod(e.target.value)}><SelectItem value="day" text="今日"/><SelectItem value="week" text="本周"/><SelectItem value="month" text="本月"/><SelectItem value="quarter" text="本季度"/><SelectItem value="year" text="本年度"/></SelectInput></Column>
        <Column sm={4} md={4} lg={3}><SelectInput id="dash-region" labelText="区域" value={region} onChange={e=>setRegion(e.target.value)}><SelectItem value="all" text="全部区域"/><SelectItem value="cn" text="中国区"/><SelectItem value="apac" text="亚太区"/><SelectItem value="emea" text="欧洲中东非"/><SelectItem value="americas" text="美洲区"/></SelectInput></Column>
        <Column sm={4} md={4} lg={3}><SelectInput id="dash-product" labelText="产品线" value={product} onChange={e=>setProduct(e.target.value)}><SelectItem value="all" text="全部产品线"/><SelectItem value="software" text="软件与订阅"/><SelectItem value="hardware" text="硬件设备"/><SelectItem value="service" text="专业服务"/></SelectInput></Column>
        <Column sm={4} md={4} lg={3}><SelectInput id="dash-team" labelText="销售团队" value={team} onChange={e=>setTeam(e.target.value)}><SelectItem value="all" text="全部团队"/><SelectItem value="enterprise" text="大客户团队"/><SelectItem value="growth" text="增长团队"/><SelectItem value="channel" text="渠道团队"/></SelectInput></Column>
        <Column sm={4} md={4} lg={4}><SelectInput id="dash-tier" labelText="客户等级" value={tier} onChange={e=>setTier(e.target.value)}><SelectItem value="all" text="全部等级"/><SelectItem value="strategic" text="战略客户"/><SelectItem value="key" text="重点客户"/><SelectItem value="standard" text="普通客户"/></SelectInput></Column>
      </Grid>
    </Tile>

    <div className="dashboard-area-nav" role="tablist" aria-label="经营分析板块">{areas.map(item=><button key={item.id} type="button" role="tab" aria-selected={area===item.id} className={area===item.id?'is-active':''} onClick={()=>setArea(item.id)}>{item.label}</button>)}</div>

    <div className="dashboard-section-heading"><div><div className="eyebrow">BUSINESS PERFORMANCE</div><h2>{activeTitle}</h2><p>{area==='overview'?'核心经营指标、收入走势与需要管理层关注的风险。':'当前板块的关键指标与经营分析；选择图表或风险项目可进入对应明细。'}</p></div><div className="dashboard-refresh"><span className="refresh-dot"/><span>视图刷新于 {updatedAt}</span></div></div>

    <Grid fullWidth className="dashboard-metrics">{metrics.map(metric=><Column key={metric.label} sm={4} md={4} lg={area==='overview'?5:5}><Tile className="dashboard-metric-card"><div className="dashboard-metric-card__label"><span>{metric.label}</span><span className="dashboard-metric-icon">{metric.icon}</span></div><div className="dashboard-metric-card__value">{metric.value}</div><div className={'dashboard-metric-card__delta '+(metric.tone==='good'?'is-good':metric.tone==='warn'?'is-warn':'')}>{metric.delta}</div><button type="button" className="metric-drilldown" onClick={()=>showDrilldown(metric.label)}>查看明细 <span aria-hidden="true">↗</span></button></Tile></Column>)}</Grid>

    {area==='overview' ? <Grid fullWidth className="dashboard-charts">
      <Column sm={4} md={8} lg={10}><Tile className="dashboard-panel"><div className="dashboard-panel__heading"><div><h3>月度收入趋势</h3><p>近 8 个月 · 按确认收入统计</p></div><Tag type="green">持续增长</Tag></div><TrendChart/><div className="dashboard-panel__footer"><span>收入趋势用于观察经营变化，不代表已连接实时财务数据。</span><button type="button" onClick={()=>showDrilldown('月度收入趋势')}>下钻分析 ↗</button></div></Tile></Column>
      <Column sm={4} md={8} lg={6}><Tile className="dashboard-panel"><div className="dashboard-panel__heading"><div><h3>销售漏斗</h3><p>金额与阶段分布</p></div><button type="button" className="text-action" onClick={()=>setArea('sales')}>销售分析 ↗</button></div><FunnelChart/><div className="funnel-summary"><div><span>漏斗总额</span><strong>¥ 12.84M</strong></div><div><span>预计赢单金额</span><strong>¥ 1.90M</strong></div></div></Tile></Column>
    </Grid> : <Grid fullWidth className="dashboard-charts">
      <Column sm={4} md={8} lg={10}><Tile className="dashboard-panel"><div className="dashboard-panel__heading"><div><h3>{area==='sales'?'业绩预测 vs 目标':area==='orders'?'订单到回款全链路':area==='service'?'工单与 SLA 趋势':area==='marketing'?'营销渠道表现':'线上交易表现'}</h3><p>按所选时间与全局筛选条件汇总</p></div><Tag type="blue">示例可视化</Tag></div>{area==='orders'?<div className="journey-flow">{['商机','报价','订单','开票','回款'].map((s,i)=><div className="journey-step" key={s}><span>{s}</span><strong>{['100%','72%','54%','43%','36%'][i]}</strong>{i<4&&<i>→</i>}</div>)}</div>:area==='service'?<div className="service-bars">{[['按时响应',96],['SLA 达成',97],['一次解决',81],['满意度',94]].map(([name,val])=><div className="service-bar" key={String(name)}><span>{name}</span><div><i style={{width:String(val)+'%'}}/></div><strong>{val}%</strong></div>)}</div>:<div className="bar-comparison">{(area==='sales'?[['预测业绩',86],['目标业绩',100],['已签订单',68],['加权商机',79]]:area==='marketing'?[['自然搜索',74],['付费广告',91],['合作伙伴',63],['客户推荐',82]]:[['商品 A',89],['商品 B',72],['商品 C',61],['商品 D',48]]).map(([label,val])=><div className="comparison-bar" key={String(label)}><span>{label}</span><div><i style={{width:String(val)+'%'}}/></div><strong>{val}%</strong></div>)}</div>}<div className="dashboard-panel__footer"><span>示例图表 · 数据接口接入后按实际业务记录计算</span><button type="button" onClick={()=>showDrilldown(activeTitle)}>查看分析明细 ↗</button></div></Tile></Column>
      <Column sm={4} md={8} lg={6}><Tile className="dashboard-panel"><div className="dashboard-panel__heading"><div><h3>{area==='sales'?'销售个人排名':area==='orders'?'回款账龄分布':area==='service'?'坐席负载概览':area==='marketing'?'客户分群价值':'商品表现排行'}</h3><p>重点指标与待处理事项</p></div></div>{(area==='sales'?[['陈经理','¥ 680K'],['林经理','¥ 524K'],['王经理','¥ 416K'],['赵经理','¥ 308K']]:area==='orders'?[['未逾期','¥ 1.09M'],['1–30 天','¥ 126K'],['31–60 天','¥ 42K'],['60 天以上','¥ 18K']]:area==='service'?[['服务组 A','负载 82%'],['服务组 B','负载 74%'],['服务组 C','负载 68%'],['服务组 D','负载 51%']]:area==='marketing'?[['高价值客户','186 家'],['成长客户','524 家'],['待培育线索','1,248 条'],['流失预警','23 家']]:[['商品 A','¥ 286K'],['商品 B','¥ 218K'],['商品 C','¥ 164K'],['商品 D','¥ 98K']]).map(([name,val],i)=><button type="button" className="ranking-row" key={name} onClick={()=>showDrilldown(name)}><span className="ranking-number">{String(i+1).padStart(2,'0')}</span><span>{name}</span><strong>{val}</strong><span className="ranking-arrow">↗</span></button>)}<div className="dashboard-panel__footer"><span>选择条目查看对应明细</span><button type="button" onClick={()=>showDrilldown(activeTitle)}>全部明细 ↗</button></div></Tile></Column>
    </Grid>}

    <Tile className="dashboard-panel risk-panel"><div className="dashboard-panel__heading"><div><h3>{area==='overview'?'经营风险预警':'待处理事项与风险预警'}</h3><p>优先关注逾期回款、SLA 超时与长时间停滞的重点商机</p></div><Tag type="red">3 项待关注</Tag></div><div className="risk-list">{(area==='overview'?risks:risks.filter((_,i)=>area==='orders'?i===0:area==='service'?i===1:area==='sales'?i===2:true)).map((risk)=><button className="risk-row" type="button" key={risk.title} onClick={()=>showDrilldown(risk.title)}><span className="risk-mark"><WarningAlt size={18}/></span><span className="risk-main"><strong>{risk.title}</strong><small>{risk.detail}</small></span><Tag type={risk.level==='高风险'?'red':'warm-gray'}>{risk.type} · {risk.level}</Tag><span className="ranking-arrow">↗</span></button>)}</div><div className="dashboard-panel__footer"><span>提醒规则与责任人需在业务数据及 SLA 配置接入后启用。</span><button type="button" onClick={()=>showDrilldown('全部风险预警')}>查看全部预警 ↗</button></div></Tile>
    <div className="dashboard-disclaimer"><span>数据说明</span> 当前为界面演示样例，非真实经营数据。刷新按钮仅更新视图时间；自动刷新频率、筛选联动、数据下钻和预警规则将在接入各业务数据源后启用。订单与回款按每日更新设计，销售与服务按每小时更新设计，营销按每日更新设计。</div>
  </div>;
}
