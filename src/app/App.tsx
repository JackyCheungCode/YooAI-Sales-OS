import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { GlobalDashboardPage } from '../modules/dashboard/GlobalDashboardPage';
import { CustomersPage } from '../modules/customers/CustomersPage';
import { ProspectingPage } from '../modules/prospecting/ProspectingPage';
import { ModulePlaceholderPage } from '../modules/shared/ModulePlaceholderPage';
import { LoginPage } from '../modules/settings/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<GlobalDashboardPage />} />
        <Route path="/prospecting" element={<ProspectingPage />} />
        <Route path="/leads" element={<ModulePlaceholderPage eyebrow="LEAD MANAGEMENT" title="潜在客户管理" description="统一管理跨渠道发现的企业线索、AI 研究结果、联系人验证和销售开发优先级。" plannedCapabilities={['统一潜在客户池与高级筛选', '按企业域名、名称和地区识别重复线索', 'AI 客户画像、可解释评分和来源证据', '联系人查找、联系方式验证与状态跟踪', '确认后转为正式客户并保留完整历史']} />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/sales" element={<ModulePlaceholderPage eyebrow="SALES FOLLOW-UP" title="销售跟进与沟通" description="把任务、邮件、WhatsApp、会议和客户互动汇总到统一的销售时间线。" plannedCapabilities={['跟进任务与逾期提醒', '邮件中心与沟通线程关联客户', 'WhatsApp Business Platform 接入', 'AI 个性化开发草稿与下一步建议', '完整客户活动时间线']} />} />
        <Route path="/quotes" element={<ModulePlaceholderPage eyebrow="QUOTATION MANAGEMENT" title="报价管理" description="管理产品价格、报价版本、审批流程，并从已接受报价创建订单。" plannedCapabilities={['产品目录、SKU 与价格规则', '多币种报价、有效期和贸易条件', '报价版本、折扣审批和 PDF 输出', '报价发送状态与客户反馈', '已接受报价转订单']} />} />
        <Route path="/orders" element={<ModulePlaceholderPage eyebrow="ORDER MANAGEMENT" title="订单管理" description="从销售订单确认到交付与付款进度，建立可追溯的交易记录。" plannedCapabilities={['订单主档与订单明细', '订单状态、交付和物流跟踪', '付款条件、已收金额和未收余额', '订单变更、异常与审批记录', '客户、报价和订单关联追溯']} />} />
        <Route path="/agents" element={<ModulePlaceholderPage eyebrow="AI AGENT CENTER" title="AI 智能体中心" description="以对话方式下达任务，并查看任务计划、执行步骤、工具调用、审批和结果。" plannedCapabilities={['真实 AI 模型配置与调用状态', '任务规划、执行队列和步骤状态', '获客、研究、联系人和销售专业智能体', '受控工具调用、权限检查与人工审批', '执行日志、成本、重试和错误诊断']} />} />
        <Route path="/integrations" element={<ModulePlaceholderPage eyebrow="API & INTEGRATIONS" title="API 与集成" description="集中管理 AI 模型、地图、搜索、企业数据、邮件和 WhatsApp 等外部连接器。" plannedCapabilities={['AI 模型提供商与默认模型配置', '地图与搜索 API 连接器', 'Meta / LinkedIn 授权连接器状态', '邮件、WhatsApp 和第三方企业数据源', '密钥状态、配额、限流与同步日志']} />} />
        <Route path="/settings" element={<ModulePlaceholderPage eyebrow="SYSTEM SETTINGS" title="系统设置与数据管理" description="统一管理用户权限、业务字典、数据质量、工作流和操作审计。" plannedCapabilities={['用户、角色和数据访问权限', '业务字典与工作流配置', '导入导出和数据质量检查', '系统操作审计与异常追踪', '连接器权限和自动化审批策略']} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
