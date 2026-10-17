# AI 模型与客户发现服务接入

## 当前实现
- AI 供应商：OpenAI、DeepSeek、阿里云通义千问、智谱 GLM、月之暗面 Kimi。
- 客户发现数据服务状态：Brave Search、Hunter.io。
- `GET /api/ai/providers`：登录用户查看配置状态；不返回任何 API Key。
- `POST /api/ai/providers`：登录用户发起单条极短模型连接测试，可能产生少量费用。
- 本阶段不搜索真实企业、不验证邮箱、不写入 CRM 数据库。

## 服务端环境变量
- OpenAI：`OPENAI_API_KEY`；可选 `OPENAI_MODEL`、`OPENAI_BASE_URL`
- DeepSeek：`DEEPSEEK_API_KEY`；可选 `DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL`
- 通义千问：`DASHSCOPE_API_KEY`；可选 `DASHSCOPE_MODEL`、`DASHSCOPE_BASE_URL`
- 智谱：`ZHIPU_API_KEY`；可选 `ZHIPU_MODEL`、`ZHIPU_BASE_URL`
- Kimi：`MOONSHOT_API_KEY`；可选 `MOONSHOT_MODEL`、`MOONSHOT_BASE_URL`
- Brave Search：`BRAVE_SEARCH_API_KEY`
- Hunter.io：`HUNTER_API_KEY`
- Supabase 服务端认证：`SUPABASE_URL` 与 `SUPABASE_PUBLISHABLE_KEY`（兼容现有 `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`）。

## Vercel Preview 配置
1. Vercel Project → Settings → Environment Variables。
2. 仅选择 Preview 环境，建议进一步限制到目标分支 `feat/shipment-carbon-module`。
3. API Key 不使用 `VITE_` 前缀，不写入 Git、前端源码或浏览器响应。
4. 先设置供应商控制台的月度预算/用量告警，再点击页面中的“测试连接”。
5. 该接口目前有 12 秒超时，但尚未实现应用级速率限制、月度预算账本或请求缓存；在开放更多用户之前应补齐这些防护。

## 上线前核验
- 核验供应商账户、模型 ID、API Base URL 与区域端点。
- 核验 Preview 部署的 Supabase URL 与 publishable key 指向正确项目。
- 当前实现未进行完整仓库构建或浏览器回归；部署后先验证登录、深层路由刷新、页面状态与 API 401 行为。
- 未执行数据库迁移或写入。
