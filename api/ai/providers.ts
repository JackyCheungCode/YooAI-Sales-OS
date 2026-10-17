import { createClient } from '@supabase/supabase-js';

interface ApiRequest {
  method?: string;
  headers: { authorization?: string; Authorization?: string };
  body?: unknown;
}
interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(value: unknown): void;
  end(): void;
}
type AIProviderId = 'openai' | 'deepseek' | 'qwen' | 'zhipu' | 'moonshot';
type ProviderConfig = {
  id: AIProviderId; name: string; keyName: string; modelName: string; defaultModel: string;
  baseUrlName: string; defaultBaseUrl: string; consoleUrl: string; docsUrl: string;
};
const providers: ProviderConfig[] = [
  { id: 'openai', name: 'OpenAI', keyName: 'OPENAI_API_KEY', modelName: 'OPENAI_MODEL', defaultModel: 'gpt-4.1-mini', baseUrlName: 'OPENAI_BASE_URL', defaultBaseUrl: 'https://api.openai.com/v1', consoleUrl: 'https://platform.openai.com/api-keys', docsUrl: 'https://platform.openai.com/docs/api-reference/chat/create' },
  { id: 'deepseek', name: 'DeepSeek', keyName: 'DEEPSEEK_API_KEY', modelName: 'DEEPSEEK_MODEL', defaultModel: 'deepseek-chat', baseUrlName: 'DEEPSEEK_BASE_URL', defaultBaseUrl: 'https://api.deepseek.com', consoleUrl: 'https://platform.deepseek.com/api_keys', docsUrl: 'https://api-docs.deepseek.com/' },
  { id: 'qwen', name: '阿里云通义千问', keyName: 'DASHSCOPE_API_KEY', modelName: 'DASHSCOPE_MODEL', defaultModel: 'qwen-plus', baseUrlName: 'DASHSCOPE_BASE_URL', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', consoleUrl: 'https://bailian.console.aliyun.com/', docsUrl: 'https://help.aliyun.com/zh/model-studio/' },
  { id: 'zhipu', name: '智谱 GLM', keyName: 'ZHIPU_API_KEY', modelName: 'ZHIPU_MODEL', defaultModel: 'glm-4-flash', baseUrlName: 'ZHIPU_BASE_URL', defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4', consoleUrl: 'https://open.bigmodel.cn/usercenter/apikeys', docsUrl: 'https://open.bigmodel.cn/dev/api' },
  { id: 'moonshot', name: '月之暗面 Kimi', keyName: 'MOONSHOT_API_KEY', modelName: 'MOONSHOT_MODEL', defaultModel: 'kimi-k2.5', baseUrlName: 'MOONSHOT_BASE_URL', defaultBaseUrl: 'https://api.moonshot.ai/v1', consoleUrl: 'https://platform.moonshot.ai/console/api-keys', docsUrl: 'https://platform.moonshot.ai/docs' },
];
const dataProviders = [
  { id: 'brave', name: 'Brave Search', keyName: 'BRAVE_SEARCH_API_KEY', consoleUrl: 'https://brave.com/search/api/', docsUrl: 'https://api.search.brave.com/app/documentation' },
  { id: 'hunter', name: 'Hunter.io', keyName: 'HUNTER_API_KEY', consoleUrl: 'https://hunter.io/api-keys', docsUrl: 'https://hunter.io/api-documentation' },
];
function sendError(res: ApiResponse, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}
function getBearerToken(req: ApiRequest): string | null {
  const value = req.headers.authorization ?? req.headers.Authorization;
  return value?.startsWith('Bearer ') ? value.slice(7).trim() || null : null;
}
async function isAuthenticated(req: ApiRequest): Promise<boolean> {
  const token = getBearerToken(req);
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return false;
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data, error } = await client.auth.getUser(token);
    return !error && Boolean(data.user);
  } catch { return false; }
}
function getProviderStatus() {
  return {
    providers: providers.map((p) => ({
      id: p.id, name: p.name, category: 'ai' as const, configured: Boolean(process.env[p.keyName]),
      keyName: p.keyName, model: process.env[p.modelName] || p.defaultModel,
      baseUrl: process.env[p.baseUrlName] || p.defaultBaseUrl, consoleUrl: p.consoleUrl, docsUrl: p.docsUrl, canTest: true,
    })),
    dataProviders: dataProviders.map((p) => ({
      id: p.id, name: p.name, category: 'discovery' as const, configured: Boolean(process.env[p.keyName]),
      keyName: p.keyName, consoleUrl: p.consoleUrl, docsUrl: p.docsUrl, canTest: false,
    })),
  };
}
async function testProvider(providerId: AIProviderId) {
  const provider = providers.find((p) => p.id === providerId);
  if (!provider) return { status: 400, body: { error: { code: 'UNKNOWN_PROVIDER', message: '不支持的模型供应商。' } } };
  const key = process.env[provider.keyName];
  if (!key) return { status: 400, body: { error: { code: 'NOT_CONFIGURED', message: '尚未配置该供应商的服务端 API Key。' } } };
  const baseUrl = (process.env[provider.baseUrlName] || provider.defaultBaseUrl).replace(/\/+$/, '');
  const model = process.env[provider.modelName] || provider.defaultModel;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const startedAt = Date.now();
  try {
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with OK.' }], max_tokens: 1, temperature: 0 }),
      signal: controller.signal,
    });
    const durationMs = Date.now() - startedAt;
    if (response.ok) return { status: 200, body: { providerId, ok: true, durationMs, message: '连接成功。供应商已接受测试请求。' } };
    const message = response.status === 401 || response.status === 403 ? '供应商拒绝认证，请检查 API Key 与项目权限。'
      : response.status === 429 ? '供应商返回限流或额度限制，请检查余额与配额。'
      : response.status === 400 || response.status === 404 ? '请求被拒绝，请核对模型 ID、API Base URL 与模型可用状态。'
      : '供应商返回 HTTP ' + response.status + '，请查看供应商控制台。';
    return { status: 200, body: { providerId, ok: false, durationMs, message } };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return { status: 200, body: { providerId, ok: false, durationMs: Date.now() - startedAt, message: timedOut ? '连接超时（12 秒），请检查网络和 API Base URL。' : '无法连接供应商，请检查网络与服务状态。' } };
  } finally { clearTimeout(timeout); }
}
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Authorization');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', '仅支持 GET 与 POST 请求。');
  }
  if (!(await isAuthenticated(req))) return sendError(res, 401, 'UNAUTHORIZED', '登录状态无效或已过期，请重新登录。');
  if (req.method === 'GET') return res.status(200).json(getProviderStatus());
  const body = req.body && typeof req.body === 'object' ? req.body as { action?: unknown; providerId?: unknown } : {};
  if (body.action !== 'test-connection' || typeof body.providerId !== 'string') return sendError(res, 400, 'INVALID_REQUEST', '请求参数无效。');
  if (!providers.some((p) => p.id === body.providerId)) return sendError(res, 400, 'UNKNOWN_PROVIDER', '不支持的模型供应商。');
  const result = await testProvider(body.providerId as AIProviderId);
  return res.status(result.status).json(result.body);
}
