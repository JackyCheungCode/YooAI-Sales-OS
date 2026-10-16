import { Checkbox, Column, Grid, Tag, Tile } from '@carbon/react';
import { SelectInput, SelectItem, TextInput } from '../../components/ui/Field';
import { Ai, ArrowRight, Globe, Map, Search, UserMultiple } from '@carbon/react/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { buildProspectingPlan } from './prospectingPlan';
import type { ProspectingChannel, ProspectingPlan, ProspectingRequest } from './types';
import './prospecting.css';

const channels: { id: ProspectingChannel; label: string; description: string }[] = [
  { id: 'maps', label: '地图与地点数据', description: '按国家、城市、行业和区域查找企业。' },
  { id: 'web-search', label: '搜索引擎', description: '搜索企业目录、行业名录和公开网页。' },
  { id: 'company-sites', label: '企业官方网站', description: '研究主营产品、企业类型和公开联系方式。' },
  { id: 'linkedin', label: 'LinkedIn', description: '通过授权数据源补充企业与业务联系人信息。' },
  { id: 'facebook', label: 'Facebook / Meta', description: '通过获准的 Meta API 获取企业主页信息。' },
  { id: 'import', label: 'Excel / CSV 导入', description: '导入已有名单，统一字段并识别重复企业。' },
];

const initialChannels: ProspectingChannel[] = ['maps', 'web-search', 'company-sites'];

export function ProspectingPage() {
  const navigate = useNavigate();
  const [countries, setCountries] = useState('');
  const [industry, setIndustry] = useState('');
  const [customerType, setCustomerType] = useState('进口商');
  const [keywords, setKeywords] = useState('');
  const [targetCount, setTargetCount] = useState('100');
  const [selectedChannels, setSelectedChannels] = useState<ProspectingChannel[]>(initialChannels);
  const [plan, setPlan] = useState<ProspectingPlan | null>(null);
  const [validationMessage, setValidationMessage] = useState('');

  function toggleChannel(channel: ProspectingChannel, checked: boolean) {
    setSelectedChannels((current) => checked
      ? Array.from(new Set([...current, channel]))
      : current.filter((item) => item !== channel));
  }

  function generatePlan() {
    if (selectedChannels.length === 0) {
      setValidationMessage('请至少选择一个获客渠道。');
      setPlan(null);
      return;
    }
    if (!countries.trim() && !industry.trim() && !keywords.trim()) {
      setValidationMessage('请至少填写国家 / 地区、行业或关键词中的一项。');
      setPlan(null);
      return;
    }

    setValidationMessage('');
    const request: ProspectingRequest = {
      countries,
      industry,
      customerType,
      keywords,
      targetCount: Number(targetCount),
      channels: selectedChannels,
    };
    setPlan(buildProspectingPlan(request));
  }

  return (
    <div className="prospecting-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">GLOBAL PROSPECTING</div>
          <h1>智能获客中心</h1>
          <p className="page-subtitle">创建跨渠道获客计划，统一发现企业、保留来源证据，并为后续 AI 研究与潜客筛选做好准备。</p>
        </div>
        <div className="heading-actions">
          <Button variant="secondary" renderIcon={UserMultiple} onClick={() => navigate('/leads')}>潜在客户池</Button>
          <Button renderIcon={Ai} onClick={() => navigate('/agents')}>AI 智能体中心</Button>
        </div>
      </div>

      <div className="prospecting-status">
        <Tag type="warm-gray">获客执行：尚未启用</Tag>
        <span>当前提供任务规划与界面骨架；真实搜索、网页采集、AI 评分和数据库写入尚未连接。</span>
      </div>

      <Grid fullWidth className="prospecting-layout">
        <Column sm={4} md={8} lg={10}>
          <Tile className="prospecting-panel">
            <div className="prospecting-panel__heading">
              <div>
                <h2><Globe size={20} /> 定义目标客户</h2>
                <p>描述你想开发的市场，AI 工作流后续将把条件转化为可执行任务。</p>
              </div>
            </div>
            <div className="prospecting-form">
              <TextInput id="prospecting-countries" labelText="目标国家 / 地区" placeholder="例如：德国、日本、阿联酋" value={countries} onChange={(event) => setCountries(event.target.value)} />
              <TextInput id="prospecting-industry" labelText="目标行业" placeholder="例如：工业设备、包装材料、汽车零部件" value={industry} onChange={(event) => setIndustry(event.target.value)} />
              <div className="prospecting-form__split">
                <SelectInput id="prospecting-customer-type" labelText="客户类型" value={customerType} onChange={(event) => setCustomerType(event.target.value)}>
                  <SelectItem value="进口商" text="进口商" />
                  <SelectItem value="分销商" text="分销商" />
                  <SelectItem value="批发商" text="批发商" />
                  <SelectItem value="零售商" text="零售商" />
                  <SelectItem value="制造商" text="制造商" />
                  <SelectItem value="品牌商" text="品牌商" />
                  <SelectItem value="采购代理" text="采购代理" />
                </SelectInput>
                <SelectInput id="prospecting-target-count" labelText="目标企业数量" value={targetCount} onChange={(event) => setTargetCount(event.target.value)}>
                  <SelectItem value="25" text="25 家" />
                  <SelectItem value="50" text="50 家" />
                  <SelectItem value="100" text="100 家" />
                  <SelectItem value="250" text="250 家" />
                  <SelectItem value="500" text="500 家" />
                </SelectInput>
              </div>
              <TextInput id="prospecting-keywords" labelText="产品 / 客户关键词" placeholder="例如：industrial pump, importer, distributor" value={keywords} onChange={(event) => setKeywords(event.target.value)} />
              {validationMessage ? <p className="prospecting-validation" role="alert">{validationMessage}</p> : null}
              <div className="prospecting-form__actions">
                <Button renderIcon={Search} onClick={generatePlan}>生成获客计划预览</Button>
                <span>预览不会向外部平台发起请求。</span>
              </div>
            </div>
          </Tile>

          <Tile className="prospecting-panel prospecting-channel-panel">
            <div className="prospecting-panel__heading">
              <div>
                <h2><Map size={20} /> 选择发现渠道</h2>
                <p>一个任务可以组合多个来源。接入后，每条线索都会保留来源与采集证据。</p>
              </div>
              <Tag type="blue">{selectedChannels.length} 个已选择</Tag>
            </div>
            <div className="prospecting-channel-grid">
              {channels.map((channel) => (
                <div className="prospecting-channel" key={channel.id}>
                  <Checkbox
                    id={'channel-' + channel.id}
                    labelText={channel.label}
                    checked={selectedChannels.includes(channel.id)}
                    onChange={(_event, data) => toggleChannel(channel.id, data.checked)}
                  />
                  <p>{channel.description}</p>
                  <Tag type="warm-gray">未配置</Tag>
                </div>
              ))}
            </div>
            <div className="prospecting-channel-footer">
              <span>连接器状态由 API 与集成设置统一管理。</span>
              <Button variant="ghost" size="sm" renderIcon={ArrowRight} onClick={() => navigate('/integrations')}>管理连接器</Button>
            </div>
          </Tile>
        </Column>

        <Column sm={4} md={8} lg={6}>
          <Tile className="prospecting-panel prospecting-execution-panel">
            <div className="prospecting-panel__heading">
              <div>
                <h2><Ai size={20} /> AI 研究与执行流程</h2>
                <p>规划的目标流程，不代表已连接或正在运行。</p>
              </div>
            </div>
            <ol className="prospecting-workflow">
              <li><span>1</span><div><strong>发现企业</strong><p>从选定渠道收集候选企业。</p></div></li>
              <li><span>2</span><div><strong>统一与去重</strong><p>规范企业名称、官网域名和地区。</p></div></li>
              <li><span>3</span><div><strong>AI 企业研究</strong><p>分析主营产品、客户类型和匹配度。</p></div></li>
              <li><span>4</span><div><strong>联系人核验</strong><p>查找公开业务联系信息并记录验证状态。</p></div></li>
              <li><span>5</span><div><strong>进入潜在客户池</strong><p>保留来源证据，供销售确认和跟进。</p></div></li>
            </ol>
            <div className="prospecting-execution-note">
              <strong>安全执行规则</strong>
              <p>平台数据只通过获准的 API、授权数据服务或允许访问的网页获取；对外联系和正式业务操作需要经过权限与审批检查。</p>
            </div>
          </Tile>
        </Column>
      </Grid>

      {plan ? (
        <Tile className="prospecting-panel prospecting-plan">
          <div className="prospecting-panel__heading">
            <div>
              <h2>获客计划预览</h2>
              <p>{plan.title} · 生成时间 {new Date(plan.generatedAt).toLocaleString()}</p>
            </div>
            <Tag type="warm-gray">本地预览 · 未执行</Tag>
          </div>
          <div className="prospecting-plan__content">
            <section>
              <h3>目标条件</h3>
              <ul>{plan.criteria.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>选定渠道</h3>
              {plan.channelNames.length ? <ul>{plan.channelNames.map((item) => <li key={item}>{item}</li>)}</ul> : <p>未选择渠道。</p>}
            </section>
            <section>
              <h3>建议执行步骤</h3>
              <ol>{plan.steps.map((item) => <li key={item}>{item}</li>)}</ol>
              <h3>当前限制</h3>
              <ul>{plan.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          </div>
        </Tile>
      ) : (
        <Tile className="prospecting-plan-empty">
          <div className="prospecting-plan-empty__icon"><Search size={24} /></div>
          <div><strong>获客计划将在这里预览</strong><p>填写目标条件并选择渠道后，生成可检查的执行计划。真实执行能力将在连接器、AI 任务引擎与数据库接入后启用。</p></div>
        </Tile>
      )}
    </div>
  );
}
