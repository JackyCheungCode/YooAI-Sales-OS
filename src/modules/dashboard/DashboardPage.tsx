import { Column, Grid, InlineNotification, Tag, Tile } from '../../components/carbon/compat';
import { LineChart, BarChart } from '@carbon/charts-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dashboard, UserMultiple, Filter, Download, WarningAlt, ChartLine, ShoppingCart, Headset, Currency, Trophy, Renew } from '../../components/carbon/icons';
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

const risks = [
  { type: '逾期回款', title: '华东区域 · 星河工业', detail: '应收 ¥ 186,000 · 已逾期 18 天', level: '高风险' },
  { type: 'SLA 超时', title: '客户支持工单 #CS-2048', detail: '首次响应超时 42 分钟 · 指派服务组待处理', level: '高风险' },
  { type: '大单停滞', title: '北美区域 · Orion Systems', detail: '商机金额 ¥ 820,000 · 14 天无活动', level: '需关注' },
];


const revenueTrendData = [
  { group: '收入', key: '3 月', value: 1.42 },
  { group: '收入', key: '4 月', value: 1.68 },
  { group: '收入', key: '5 月', value: 1.61 },
  { group: '收入', key: '6 月', value: 1.98 },
  { group: '收入', key: '7 月', value: 2.08 },
  { group: '收入', key: '8 月', value: 2.34 },
  { group: '收入', key: '9 月', value: 2.27 },
  { group: '收入', key: '10 月', value: 2.49 },
];
const revenueTrendOptions: any = {
  axes: {
    bottom: { mapsTo: 'key', scaleType: 'labels', title: '月份' },
    left: { mapsTo: 'value', scaleType: 'linear', title: '收入（百万）' },
  },
  legend: { enabled: false },
  theme: 'g10',
  height: '20rem',
};
function TrendChart() {
  return <div className="dash-chart">
    <div className="chart-summary"><strong>¥ 2.49M</strong><span className="dash-positive">↗ 12.8%</span><span className="chart-summary__note">本期累计收入</span></div>
    <LineChart data={revenueTrendData} options={revenueTrendOptions} />
    <p className="chart-summary__note">演示指标；实时财务数据服务尚未接入。</p>
  </div>;
}

const funnelChartData = [
  { group: '销售漏斗', key: '潜在线索', value: 12.8 },
  { group: '销售漏斗', key: '已确认需求', value: 8.6 },
  { group: '销售漏斗', key: '方案与报价', value: 5.4 },
  { group: '销售漏斗', key: '商务谈判', value: 3.2 },
  { group: '销售漏斗', key: '赢单', value: 1.9 },
];
const funnelChartOptions: any = {
  axes: {
    left: { mapsTo: 'key', scaleType: 'labels', title: '阶段' },
    bottom: { mapsTo: 'value', scaleType: 'linear', title: '金额（百万）' },
  },
  bars: { orientation: 'horizontal' },
  legend: { enabled: false },
  theme: 'g10',
  height: '20rem',
};
function FunnelChart() {
  return <div className="funnel-chart"><BarChart data={funnelChartData} options={funnelChartOptions} /></div>;
}


const areaPerformanceData: Record<Exclude<Area, 'overview'>, { group: string; key: string; value: number }[]> = {
  sales: [{group:'业绩',key:'预测业绩',value:86},{group:'业绩',key:'目标业绩',value:100},{group:'业绩',key:'已签订单',value:68},{group:'业绩',key:'加权商机',value:79}],
  orders: [{group:'订单链路',key:'商机',value:100},{group:'订单链路',key:'报价',value:72},{group:'订单链路',key:'订单',value:54},{group:'订单链路',key:'开票',value:43},{group:'订单链路',key:'回款',value:36}],
  service: [{group:'服务',key:'按时响应',value:96},{group:'服务',key:'SLA 达成',value:97},{group:'服务',key:'一次解决',value:81},{group:'服务',key:'满意度',value:94}],
  marketing: [{group:'渠道',key:'自然搜索',value:74},{group:'渠道',key:'付费广告',value:91},{group:'渠道',key:'合作伙伴',value:63},{group:'渠道',key:'客户推荐',value:82}],
  commerce: [{group:'商品',key:'商品 A',value:89},{group:'商品',key:'商品 B',value:72},{group:'商品',key:'商品 C',value:61},{group:'商品',key:'商品 D',value:48}],
};
const areaPerformanceOptions: any = {
  axes: {
    left: { mapsTo: 'key', scaleType: 'labels', title: '指标' },
    bottom: { mapsTo: 'value', scaleType: 'linear', title: '达成率（%）' },
  },
  legend: { enabled: false },
  theme: 'g10',
  height: '20rem',
};
function AreaPerformanceChart({ area }: { area: Exclude<Area, 'overview'> }) {
  return <BarChart data={areaPerformanceData[area]} options={areaPerformanceOptions} />;
}

export function DashboardPage() {
  const [area, setArea] = useState<Area>('overview');
  const areaTabsRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const tabs = areaTabsRef.current;
    if (!tabs) return;
    const onSelected = (event: Event) => {
      const target = event.target as HTMLElement & { value?: string };
      const detail = (event as CustomEvent<{ value?: string }>).detail;
      const next = target.value ?? detail?.value;
      if (areas.some(item => item.id === next)) setArea(next as Area);
    };
    tabs.addEventListener('cds-tabs-selected', onSelected);
    return () => tabs.removeEventListener('cds-tabs-selected', onSelected);
  }, []);
  const [period, setPeriod] = useState('month');
  const [region, setRegion] = useState('all');
  const [product, setProduct] = useState('all');
  const [team, setTeam] = useState('all');
  const [tier, setTier] = useState('all');
  const [updatedAt, setUpdatedAt] = useState('10:00');
  const metrics = useMemo(() => metricSets[area], [area]);
  const activeTitle = areas.find(item => item.id === area)?.label ?? '管理层总览';
  const refresh = () => setUpdatedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
  const [notice, setNotice] = useState('');
  const showDrilldown = (name: string) => setNotice('“' + name + '”明细下钻入口已预留，明细数据服务尚未接入。');

  return <div className="dashboard-page">
    {notice && <InlineNotification kind="info" lowContrast title="功能状态" subtitle={notice} onCloseButtonClick={() => setNotice('')} />}
    <div className="page-heading dashboard-heading">
      <div><div className="eyebrow">YOOAI BUSINESS INTELLIGENCE</div><h1>经营智控中枢</h1><p className="page-subtitle">以统一指标看清增长、现金流、客户体验与经营风险。</p></div>
      <div className="dashboard-heading__actions"><Button variant="secondary" renderIcon={Download} onClick={() => setNotice('报表导出暂不可用：报表生成与下载服务尚未配置。')}>导出报表</Button><Button renderIcon={Renew} onClick={refresh}>刷新视图</Button></div>
    </div>

    <Tile className="dashboard-filter-panel">
      <div className="dashboard-filter-title"><div><strong>全局分析条件</strong><span>所有经营板块共享当前筛选条件</span></div><Button type="button" variant="ghost" className="filter-reset" onClick={()=>{setPeriod('month');setRegion('all');setProduct('all');setTeam('all');setTier('all')}}>重置筛选</Button></div>
      <Grid fullWidth className="dashboard-filters">
        <Column sm={4} md={4} lg={3}><SelectInput id="dash-period" labelText="统计时间" value={period} onChange={e=>setPeriod(e.target.value)}><SelectItem value="day" text="今日"/><SelectItem value="week" text="本周"/><SelectItem value="month" text="本月"/><SelectItem value="quarter" text="本季度"/><SelectItem value="year" text="本年度"/></SelectInput></Column>
        <Column sm={4} md={4} lg={3}><SelectInput id="dash-region" labelText="区域" value={region} onChange={e=>setRegion(e.target.value)}><SelectItem value="all" text="全部区域"/><SelectItem value="cn" text="中国区"/><SelectItem value="apac" text="亚太区"/><SelectItem value="emea" text="欧洲中东非"/><SelectItem value="americas" text="美洲区"/></SelectInput></Column>
        <Column sm={4} md={4} lg={3}><SelectInput id="dash-product" labelText="产品线" value={product} onChange={e=>setProduct(e.target.value)}><SelectItem value="all" text="全部产品线"/><SelectItem value="software" text="软件与订阅"/><SelectItem value="hardware" text="硬件设备"/><SelectItem value="service" text="专业服务"/></SelectInput></Column>
        <Column sm={4} md={4} lg={3}><SelectInput id="dash-team" labelText="销售团队" value={team} onChange={e=>setTeam(e.target.value)}><SelectItem value="all" text="全部团队"/><SelectItem value="enterprise" text="大客户团队"/><SelectItem value="growth" text="增长团队"/><SelectItem value="channel" text="渠道团队"/></SelectInput></Column>
        <Column sm={4} md={4} lg={4}><SelectInput id="dash-tier" labelText="客户等级" value={tier} onChange={e=>setTier(e.target.value)}><SelectItem value="all" text="全部等级"/><SelectItem value="strategic" text="战略客户"/><SelectItem value="key" text="重点客户"/><SelectItem value="standard" text="普通客户"/></SelectInput></Column>
      </Grid>
    </Tile>

    <cds-tabs id="dashboard-area-tabs" ref={areaTabsRef} value={area} aria-label="经营分析板块">{areas.map(item => <cds-tab key={item.id} id={"dashboard-tab-" + item.id} value={item.id} target="dashboard-area-panel">{item.label}</cds-tab>)}</cds-tabs>

    <div id="dashboard-area-panel" role="tabpanel" aria-label={activeTitle}>
    <div className="dashboard-section-heading"><div><div className="eyebrow">BUSINESS PERFORMANCE</div><h2>{activeTitle}</h2><p>{area==='overview'?'核心经营指标、收入走势与需要管理层关注的风险。':'当前板块的关键指标与经营分析；选择图表或风险项目可进入对应明细。'}</p></div><div className="dashboard-refresh"><span className="refresh-dot"/><span>视图刷新于 {updatedAt}</span></div></div>

    <Grid fullWidth className="dashboard-metrics">{metrics.map(metric=><Column key={metric.label} sm={4} md={4} lg={8} xlg={8}><Tile className="dashboard-metric-card"><div className="dashboard-metric-card__label"><span>{metric.label}</span><span className="dashboard-metric-icon">{metric.icon}</span></div><div className="dashboard-metric-card__value">{metric.value}</div><div className={'dashboard-metric-card__delta '+(metric.tone==='good'?'is-good':metric.tone==='warn'?'is-warn':'')}>{metric.delta}</div><Button type="button" variant="ghost" className="metric-drilldown" onClick={()=>showDrilldown(metric.label)}>查看明细 <span aria-hidden="true">↗</span></Button></Tile></Column>)}</Grid>

    {area==='overview' ? <Grid fullWidth className="dashboard-charts">
      <Column sm={4} md={8} lg={10}><Tile className="dashboard-panel"><div className="dashboard-panel__heading"><div><h3>月度收入趋势</h3><p>近 8 个月 · 按确认收入统计</p></div><Tag type="green">持续增长</Tag></div><TrendChart/><div className="dashboard-panel__footer"><span>收入趋势用于观察经营变化，不代表已连接实时财务数据。</span><Button type="button" onClick={()=>showDrilldown('月度收入趋势')}>下钻分析 ↗</Button></div></Tile></Column>
      <Column sm={4} md={8} lg={6}><Tile className="dashboard-panel"><div className="dashboard-panel__heading"><div><h3>销售漏斗</h3><p>金额与阶段分布</p></div><Button type="button" variant="ghost" className="text-action" onClick={()=>setArea('sales')}>销售分析 ↗</Button></div><FunnelChart/><div className="funnel-summary"><div><span>漏斗总额</span><strong>¥ 12.84M</strong></div><div><span>预计赢单金额</span><strong>¥ 1.90M</strong></div></div></Tile></Column>
    </Grid> : <Grid fullWidth className="dashboard-charts">
      <Column sm={4} md={8} lg={10}><Tile className="dashboard-panel"><div className="dashboard-panel__heading"><div><h3>{area==='sales'?'业绩预测 vs 目标':area==='orders'?'订单到回款全链路':area==='service'?'工单与 SLA 趋势':area==='marketing'?'营销渠道表现':'线上交易表现'}</h3><p>按所选时间与全局筛选条件汇总</p></div><Tag type="blue">趋势分析</Tag></div><AreaPerformanceChart area={area as Exclude<Area, 'overview'>} /><div className="dashboard-panel__footer"><span>图表 · 数据接口接入后按实际业务记录计算</span><Button type="button" onClick={()=>showDrilldown(activeTitle)}>查看分析明细 ↗</Button></div></Tile></Column>
      <Column sm={4} md={8} lg={6}><Tile className="dashboard-panel"><div className="dashboard-panel__heading"><div><h3>{area==='sales'?'销售个人排名':area==='orders'?'回款账龄分布':area==='service'?'坐席负载概览':area==='marketing'?'客户分群价值':'商品表现排行'}</h3><p>重点指标与待处理事项</p></div></div>{(area==='sales'?[['陈经理','¥ 680K'],['林经理','¥ 524K'],['王经理','¥ 416K'],['赵经理','¥ 308K']]:area==='orders'?[['未逾期','¥ 1.09M'],['1–30 天','¥ 126K'],['31–60 天','¥ 42K'],['60 天以上','¥ 18K']]:area==='service'?[['服务组 A','负载 82%'],['服务组 B','负载 74%'],['服务组 C','负载 68%'],['服务组 D','负载 51%']]:area==='marketing'?[['高价值客户','186 家'],['成长客户','524 家'],['待培育线索','1,248 条'],['流失预警','23 家']]:[['商品 A','¥ 286K'],['商品 B','¥ 218K'],['商品 C','¥ 164K'],['商品 D','¥ 98K']]).map(([name,val],i)=><Button type="button" variant="ghost" className="ranking-row" key={name} onClick={()=>showDrilldown(name)}><span className="ranking-number">{String(i+1).padStart(2,'0')}</span><span>{name}</span><strong>{val}</strong><span className="ranking-arrow">↗</span></Button>)}<div className="dashboard-panel__footer"><span>选择条目查看对应明细</span><Button type="button" onClick={()=>showDrilldown(activeTitle)}>全部明细 ↗</Button></div></Tile></Column>
    </Grid>}

    <Tile className="dashboard-panel risk-panel"><div className="dashboard-panel__heading"><div><h3>{area==='overview'?'经营风险预警':'待处理事项与风险预警'}</h3><p>优先关注逾期回款、SLA 超时与长时间停滞的重点商机</p></div><Tag type="red">3 项待关注</Tag></div><div className="risk-list">{(area==='overview'?risks:risks.filter((_,i)=>area==='orders'?i===0:area==='service'?i===1:area==='sales'?i===2:true)).map((risk)=><Button variant="ghost" className="risk-row" type="button" key={risk.title} onClick={()=>showDrilldown(risk.title)}><span className="risk-mark"><WarningAlt size={18}/></span><span className="risk-main"><strong>{risk.title}</strong><small>{risk.detail}</small></span><Tag type={risk.level==='高风险'?'red':'warm-gray'}>{risk.type} · {risk.level}</Tag><span className="ranking-arrow">↗</span></Button>)}</div><div className="dashboard-panel__footer"><span>提醒规则与责任人需在业务数据及 SLA 配置接入后启用。</span><Button type="button" onClick={()=>showDrilldown('全部风险预警')}>查看全部预警 ↗</Button></div></Tile>
    </div>
  </div>;
}
