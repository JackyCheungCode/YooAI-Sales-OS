import { useCallback, useEffect, useMemo, useState } from 'react';
import { Api, CheckmarkFilled, Launch, Renew, WarningFilled } from '../../components/carbon/icons';
import { Column, Grid, InlineNotification, Tag, Tile } from '../../components/carbon/compat';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/AuthContext';
import type { ConnectionTestResult, ProviderStatus } from '../../lib/ai-providers';
import './ai-providers.css';

type ProviderResponse = { providers: ProviderStatus[]; dataProviders: ProviderStatus[] };
type TestState = Record<string, ConnectionTestResult | undefined>;

function StatusTag({ configured }: { configured: boolean }) {
  return <Tag type={configured ? 'green' : 'warm-gray'}>{configured ? '已配置' : '待配置'}</Tag>;
}

function ProviderCard({ provider, testResult, testing, onTest }: {
  provider: ProviderStatus;
  testResult?: ConnectionTestResult;
  testing: boolean;
  onTest: (providerId: string) => void;
}) {
  return <Tile className="ai-provider-card">
    <div className="ai-provider-card__header">
      <div className="ai-provider-card__identity">
        <span className="ai-provider-card__icon" aria-hidden="true"><Api size={20} /></span>
        <div>
          <h3 className="ai-provider-card__title">{provider.name}</h3>
          <p className="ai-provider-card__category">{provider.category === 'ai' ? 'AI 模型供应商' : '客户发现数据服务'}</p>
        </div>
      </div>
      <StatusTag configured={provider.configured} />
    </div>
    <dl className="ai-provider-card__details">
      <div><dt>环境变量</dt><dd><code>{provider.keyName}</code></dd></div>
      {provider.model ? <div><dt>默认模型</dt><dd><code>{provider.model}</code></dd></div> : null}
      {provider.baseUrl ? <div><dt>API Base URL</dt><dd className="ai-provider-card__url">{provider.baseUrl}</dd></div> : null}
    </dl>
    {testResult ? <div className={'ai-provider-card__result ' + (testResult.ok ? 'is-success' : 'is-error')} role="status" aria-live="polite">
      {testResult.ok ? <CheckmarkFilled size={16} /> : <WarningFilled size={16} />}
      <span>{testResult.message}{testResult.durationMs ? `（${testResult.durationMs} ms）` : ''}</span>
    </div> : null}
    <div className="ai-provider-card__actions">
      {provider.canTest
        ? <Button variant="primary" size="sm" disabled={!provider.configured || testing} onClick={() => onTest(provider.id)} renderIcon={testing ? Renew : Api}>{testing ? '正在测试' : '测试连接'}</Button>
        : <span className="ai-provider-card__helper">数据服务连接测试将在客户发现模块接入时启用</span>}
      <a className="ai-provider-card__external" href={provider.consoleUrl} target="_blank" rel="noreferrer">供应商控制台 <Launch size={14} aria-hidden="true" /></a>
    </div>
  </Tile>;
}

export function AIProvidersPage() {
  const { session } = useAuth();
  const [data, setData] = useState<ProviderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestState>({});

  const loadStatus = useCallback(async (quiet = false) => {
    if (!session?.access_token) {
      setError('无法读取当前登录凭证，请重新登录后再试。');
      setLoading(false);
      return;
    }
    if (quiet) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai/providers', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const payload = await response.json() as ProviderResponse | { error?: { message?: string } };
      if (!response.ok) throw new Error('error' in payload ? payload.error?.message : '读取供应商状态失败。');
      setData(payload as ProviderResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '读取供应商状态失败，请稍后重试。');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);
  const configuredAI = useMemo(() => data?.providers.filter((provider) => provider.configured).length ?? 0, [data]);

  const testConnection = useCallback(async (providerId: string) => {
    if (!session?.access_token) {
      setError('登录凭证已失效，请重新登录后再试。');
      return;
    }
    setTestingId(providerId);
    setTestResults((current) => ({ ...current, [providerId]: undefined }));
    setError('');
    try {
      const response = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-connection', providerId }),
        cache: 'no-store',
      });
      const payload = await response.json() as ConnectionTestResult | { error?: { message?: string } };
      if (!response.ok) throw new Error('error' in payload ? payload.error?.message : '连接测试请求失败。');
      setTestResults((current) => ({ ...current, [providerId]: payload as ConnectionTestResult }));
    } catch (cause) {
      setTestResults((current) => ({ ...current, [providerId]: {
        providerId: providerId as ConnectionTestResult['providerId'], ok: false, durationMs: 0,
        message: cause instanceof Error ? cause.message : '连接测试失败，请稍后重试。',
      } }));
    } finally {
      setTestingId(null);
    }
  }, [session?.access_token]);

  return <div className="ai-providers-page">
    <div className="page-heading">
      <div>
        <div className="eyebrow">AI & INTEGRATIONS</div>
        <h1 className="ai-providers-page__title">AI 模型与数据服务</h1>
        <p className="page-subtitle">统一查看模型供应商与客户发现 API 的服务端配置状态。</p>
      </div>
      <div className="heading-actions">
        <Button variant="secondary" size="sm" disabled={loading || refreshing} onClick={() => void loadStatus(true)} renderIcon={Renew}>{refreshing ? '正在刷新' : '刷新状态'}</Button>
      </div>
    </div>

    {error ? <InlineNotification kind="error" lowContrast title="无法读取配置状态" subtitle={error} hideCloseButton /> : null}

    <Tile className="ai-providers-summary">
      <div className="ai-providers-summary__copy">
        <span className="ai-providers-summary__icon" aria-hidden="true"><Api size={22} /></span>
        <div>
          <h2 className="ai-providers-summary__title">模型接入状态</h2>
          <p className="ai-providers-summary__description">连接测试会向所选供应商发送一条极短请求，可能产生少量 API 费用。</p>
        </div>
      </div>
      <div className="ai-providers-summary__count" aria-live="polite">
        <strong>{loading ? '—' : `${configuredAI}/${data?.providers.length ?? 5}`}</strong>
        <span>AI 供应商已配置</span>
      </div>
    </Tile>

    <section className="ai-provider-section" aria-labelledby="ai-models-heading">
      <div className="ai-provider-section__heading">
        <div><h2 id="ai-models-heading">AI 模型供应商</h2><p>支持国际模型与中国主流模型，模型 ID 可通过环境变量覆盖。</p></div>
      </div>
      {loading ? <Tile className="ai-provider-loading" role="status">正在安全读取服务端配置状态…</Tile> : (
        <Grid fullWidth className="ai-provider-grid">
          {(data?.providers ?? []).map((provider) => <Column key={provider.id} sm={4} md={4} lg={8} xlg={8}>
            <ProviderCard provider={provider} testResult={testResults[provider.id]} testing={testingId === provider.id} onTest={(id) => void testConnection(id)} />
          </Column>)}
        </Grid>
      )}
    </section>

    <section className="ai-provider-section" aria-labelledby="discovery-heading">
      <div className="ai-provider-section__heading">
        <div><h2 id="discovery-heading">客户发现数据服务</h2><p>首批数据源用于企业搜索与商务邮箱发现；此页面不会调用或写入客户数据。</p></div>
      </div>
      {loading ? <Tile className="ai-provider-loading">正在读取数据服务配置状态…</Tile> : (
        <Grid fullWidth className="ai-provider-grid">
          {(data?.dataProviders ?? []).map((provider) => <Column key={provider.id} sm={4} md={4} lg={8} xlg={8}>
            <ProviderCard provider={provider} testing={false} onTest={() => undefined} />
          </Column>)}
        </Grid>
      )}
    </section>
    <p className="ai-providers-footnote">安全提示：API Key 仅在 Vercel 服务端环境变量中配置，不会返回浏览器。请只在 Preview 环境测试，并在供应商控制台设置用量上限。</p>
  </div>;
}
