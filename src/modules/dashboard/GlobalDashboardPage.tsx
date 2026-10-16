import { Column, Grid, Tag, Tile } from '@carbon/react';
import { Activity, Ai, ArrowRight, Building, ChartLine, Globe, Map, Search, Task, UserMultiple } from '@carbon/react/icons';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import './dashboard.css';

type MetricCardProps = {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
};

function MetricCard({ label, value, note, icon }: MetricCardProps) {
  return (
    <Tile className="global-metric-card">
      <div className="global-metric-card__header">
        <span>{label}</span>
        <span className="global-metric-card__icon">{icon}</span>
      </div>
      <div className="global-metric-card__value">{value}</div>
      <div className="global-metric-card__note">{note}</div>
    </Tile>
  );
}

function WorldMapIllustration() {
  return (
    <svg className="global-world-map" viewBox="0 0 720 340" role="img" aria-label="全球区域示意图，等待真实客户数据接入">
      <defs>
        <pattern id="map-grid" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 36 0 L 0 0 0 36" className="global-world-map__grid" fill="none" />
        </pattern>
      </defs>
      <rect width="720" height="340" fill="url(#map-grid)" />
      <g className="global-world-map__land">
        <path d="M75 81 L104 54 142 43 166 58 193 57 218 76 205 96 184 103 172 124 153 136 145 163 126 174 111 153 99 129 81 116 68 97 Z" />
        <path d="M173 176 L196 184 214 210 220 238 205 270 194 302 180 282 174 252 162 225 159 200 Z" />
        <path d="M292 70 L316 54 349 60 368 47 403 55 425 72 451 76 466 96 447 111 427 107 415 125 389 119 372 135 348 126 326 109 305 106 291 91 Z" />
        <path d="M340 139 L365 129 391 141 405 165 396 195 378 222 367 248 348 235 343 208 330 183 330 157 Z" />
        <path d="M438 79 L473 64 518 72 547 88 584 88 620 105 639 124 624 143 596 140 577 156 553 151 537 170 513 163 494 146 470 143 455 122 434 110 Z" />
        <path d="M563 201 L588 190 612 202 624 222 612 242 590 251 572 237 557 220 Z" />
        <path d="M268 49 L281 40 293 48 286 61 Z" />
      </g>
      <g className="global-world-map__equator">
        <path d="M24 170 H696" />
      </g>
      <text x="104" y="326" className="global-world-map__label">AMERICAS</text>
      <text x="336" y="326" className="global-world-map__label">EUROPE & AFRICA</text>
      <text x="535" y="326" className="global-world-map__label">ASIA PACIFIC</text>
    </svg>
  );
}

export function GlobalDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="global-dashboard">
      <div className="page-heading">
        <div>
          <div className="eyebrow">GLOBAL SALES INTELLIGENCE</div>
          <h1>全球客户看板</h1>
          <p className="page-subtitle">从全球客户分布到潜在客户开发，集中查看销售业务全貌。</p>
        </div>
        <div className="heading-actions">
          <Button variant="secondary" renderIcon={Search} onClick={() => navigate('/prospecting')}>开始智能获客</Button>
          <Button renderIcon={Ai} onClick={() => navigate('/agents')}>打开 AI 智能体</Button>
        </div>
      </div>

      <div className="global-dashboard__status-row">
        <Tag type="warm-gray">数据状态：等待业务数据接入</Tag>
        <span className="global-dashboard__status-note">当前不展示模拟客户数量；连接数据库和数据源后显示真实统计。</span>
      </div>

      <Grid fullWidth className="global-dashboard__metrics">
        <Column sm={4} md={4} lg={4}>
          <MetricCard label="全球客户" value="—" note="正式客户主档" icon={<Building size={20} />} />
        </Column>
        <Column sm={4} md={4} lg={4}>
          <MetricCard label="潜在客户" value="—" note="待筛选与开发的线索" icon={<UserMultiple size={20} />} />
        </Column>
        <Column sm={4} md={4} lg={4}>
          <MetricCard label="销售机会" value="—" note="进行中的商机" icon={<ChartLine size={20} />} />
        </Column>
        <Column sm={4} md={4} lg={4}>
          <MetricCard label="待跟进任务" value="—" note="需要销售处理的事项" icon={<Task size={20} />} />
        </Column>
      </Grid>

      <Grid fullWidth className="global-dashboard__main-grid">
        <Column sm={4} md={8} lg={10}>
          <Tile className="global-panel global-map-panel">
            <div className="global-panel__heading">
              <div>
                <h2><Globe size={20} /> 全球客户分布</h2>
                <p>按国家、地区与市场查看客户覆盖情况。</p>
              </div>
              <Button variant="ghost" size="sm" renderIcon={ArrowRight} onClick={() => navigate('/customers')}>客户档案</Button>
            </div>
            <div className="global-map-panel__canvas">
              <WorldMapIllustration />
              <div className="global-map-panel__empty">
                <Map size={24} />
                <strong>全球客户地图尚未连接真实数据</strong>
                <span>客户国家、城市和坐标接入后，将在这里呈现可筛选的全球分布。</span>
                <Button size="sm" variant="secondary" onClick={() => navigate('/integrations')}>配置数据源</Button>
              </div>
            </div>
            <div className="global-map-panel__footer">
              <span><span className="global-status-dot" />客户地理数据：未接入</span>
              <span>地图仅展示区域轮廓示意，不代表实际客户位置。</span>
            </div>
          </Tile>
        </Column>
        <Column sm={4} md={8} lg={6}>
          <Tile className="global-panel global-region-panel">
            <div className="global-panel__heading">
              <div>
                <h2><Activity size={20} /> 区域覆盖</h2>
                <p>客户数量与线索转化表现。</p>
              </div>
            </div>
            <div className="global-empty-list">
              {['亚洲及太平洋', '欧洲', '北美洲', '拉丁美洲', '中东及非洲'].map((region) => (
                <div className="global-region-row" key={region}>
                  <span>{region}</span>
                  <Tag type="warm-gray">待接入</Tag>
                </div>
              ))}
            </div>
            <p className="global-panel__footnote">区域统计将在真实客户数据可用后计算。</p>
          </Tile>
        </Column>
      </Grid>

      <Grid fullWidth className="global-dashboard__bottom-grid">
        <Column sm={4} md={8} lg={8}>
          <Tile className="global-panel">
            <div className="global-panel__heading">
              <div>
                <h2><ChartLine size={20} /> 销售漏斗</h2>
                <p>从新线索到报价、订单的阶段转化。</p>
              </div>
            </div>
            <div className="global-funnel-empty">
              <div className="global-funnel-empty__icon"><ChartLine size={24} /></div>
              <strong>暂时没有可统计的销售漏斗数据</strong>
              <span>建立潜在客户、商机和报价记录后，这里将显示阶段数量及转化率。</span>
            </div>
          </Tile>
        </Column>
        <Column sm={4} md={8} lg={8}>
          <Tile className="global-panel">
            <div className="global-panel__heading">
              <div>
                <h2><Ai size={20} /> AI 销售洞察</h2>
                <p>基于客户事实和业务活动生成建议。</p>
              </div>
              <Tag type="warm-gray">等待数据</Tag>
            </div>
            <div className="global-insight">
              <div className="global-insight__item">
                <span className="global-insight__icon"><Ai size={18} /></span>
                <div><strong>客户研究与优先级</strong><p>接入真实线索后，AI 将根据匹配度、信息可信度和商业潜力提供排序建议。</p></div>
              </div>
              <div className="global-insight__item">
                <span className="global-insight__icon"><Task size={18} /></span>
                <div><strong>销售跟进提醒</strong><p>接入活动和任务记录后，识别逾期跟进、待回复客户与下一步行动。</p></div>
              </div>
              <Button variant="ghost" renderIcon={ArrowRight} onClick={() => navigate('/agents')}>查看智能体工作台</Button>
            </div>
          </Tile>
        </Column>
      </Grid>

      <Grid fullWidth className="global-dashboard__bottom-grid">
        <Column sm={4} md={8} lg={16}>
          <Tile className="global-panel global-activity-panel">
            <div className="global-panel__heading">
              <div>
                <h2><Activity size={20} /> 最近业务活动</h2>
                <p>获客任务、客户跟进、报价和订单的统一时间线。</p>
              </div>
              <Button variant="ghost" size="sm" renderIcon={ArrowRight} onClick={() => navigate('/sales')}>查看跟进</Button>
            </div>
            <div className="global-activity-empty">
              <Activity size={24} />
              <div><strong>尚无业务活动记录</strong><p>当前页面没有使用虚构活动填充。数据接入后，将显示真实发生的业务事件。</p></div>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
