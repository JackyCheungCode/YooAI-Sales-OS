import type { ProspectingChannel, ProspectingPlan, ProspectingRequest } from './types';

const channelLabels: Record<ProspectingChannel, string> = {
  maps: '地图与地点数据',
  'web-search': '搜索引擎',
  'company-sites': '企业官方网站',
  linkedin: 'LinkedIn 授权数据源',
  facebook: 'Facebook / Meta 授权数据源',
  import: 'Excel / CSV 导入',
};

const channelSteps: Record<ProspectingChannel, string> = {
  maps: '按国家、城市、行业和区域筛选企业地点，并保留地点 ID 与来源。',
  'web-search': '通过配置的搜索 API 查找企业目录、行业名录和公开企业页面。',
  'company-sites': '读取允许访问的企业网站，提取主营产品、企业类型和公开业务联系方式。',
  linkedin: '仅通过获准的 API 或授权数据服务补充企业与业务联系人信息。',
  facebook: '仅通过已授权的 Meta API 和允许的数据范围获取企业主页信息。',
  import: '解析用户提供的名单，规范字段并检查重复企业。',
};

export function buildProspectingPlan(request: ProspectingRequest): ProspectingPlan {
  const channelNames = request.channels.map((channel) => channelLabels[channel]);
  const criteria = [
    '目标国家 / 地区：' + (request.countries.trim() || '未指定'),
    '行业：' + (request.industry.trim() || '未指定'),
    '客户类型：' + request.customerType,
    '关键词：' + (request.keywords.trim() || '未指定'),
    '目标数量：' + request.targetCount + ' 家企业',
  ];
  const steps = [
    '校验获客条件并确认各数据源的权限与配置状态。',
    ...request.channels.map((channel) => channelSteps[channel]),
    '统一企业名称、官网域名和国家地区字段，识别重复记录。',
    '为每条候选企业保存来源 URL、采集时间和证据摘要。',
    '在真实数据源接入后，调用 AI 研究流程进行画像、评分和下一步建议。',
    '将通过规则检查的结果写入潜在客户池，并记录任务与审计状态。',
  ];

  return {
    title: '全球潜在客户发现计划',
    criteria,
    channelNames,
    steps,
    limitations: [
      '当前只生成计划预览，不会调用外部 API、抓取网页或写入数据库。',
      'AI 模型、获客连接器、任务队列和数据持久化需要在后续步骤接通后才能执行。',
      '正式运行时应遵守各平台授权、速率限制、隐私要求和数据使用条款。',
    ],
    generatedAt: new Date().toISOString(),
  };
}
