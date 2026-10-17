import { InlineNotification } from '../../components/carbon/compat';
import { TextInput } from '../../components/ui/Field';
import { useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

function LoginShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="YooAI Sales OS 产品介绍">
        <a className="auth-brand" href="/login" aria-label="YooAI Sales OS 登录首页">
          <span className="auth-brand__mark" aria-hidden="true">Y</span>
          <span className="auth-brand__name">YooAI <strong>Sales OS</strong></span>
        </a>
        <div className="auth-brand__content">
          <p className="auth-eyebrow">AI-POWERED SALES WORKSPACE</p>
          <h1>让全球销售<br />更清晰、更高效。</h1>
          <p className="auth-brand__description">
            将客户、联系人与销售机会汇聚在一个工作空间，让团队专注于真正重要的客户关系。
          </p>
          <div className="auth-brand__rule" aria-hidden="true" />
          <p className="auth-brand__caption">一个工作空间，连接每一次客户互动。</p>
        </div>
        <footer className="auth-brand__footer">YooAI Sales OS <span>·</span> 企业销售工作平台</footer>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-panel__inner">
          {children}
          <p className="auth-legal">登录即表示你正在访问组织授权的工作空间。</p>
        </div>
      </section>
    </main>
  );
}

export function LoginPage() {
  const { session, loading, signIn } = useAuth();
  const location = useLocation();
  const requestedRoute = location.state?.from as { pathname?: string; search?: string; hash?: string } | undefined;
  const redirectTo = requestedRoute?.pathname
    ? `${requestedRoute.pathname}${requestedRoute.search ?? ''}${requestedRoute.hash ?? ''}`
    : '/customers';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (session) return <Navigate to={redirectTo} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage('');
    setBusy(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result) setMessage(result);
    } catch {
      setMessage('暂时无法连接登录服务，请检查网络后重试。');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <LoginShell>
        <div className="auth-loading" role="status" aria-live="polite">
          <div className="auth-form__eyebrow">SECURE WORKSPACE</div>
          <h2>正在检查登录状态</h2>
          <p>请稍候，我们正在安全地连接你的工作空间。</p>
        </div>
      </LoginShell>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <LoginShell>
        <div className="auth-form__eyebrow">SECURE WORKSPACE</div>
        <h2>登录服务尚未配置</h2>
        <p className="auth-form__intro">请联系系统管理员检查 Supabase 连接配置后再试。</p>
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title="暂时无法登录"
          subtitle="登录服务未完成配置。"
        />
      </LoginShell>
    );
  }

  return (
    <LoginShell>
      <div className="auth-form__eyebrow">WELCOME BACK</div>
      <h2>登录你的工作空间</h2>
      <p className="auth-form__intro">使用管理员为你开通的账户继续。</p>

      <form ref={formRef} className="auth-form" onSubmit={submit}>
        <TextInput
          id="login-email"
          type="email"
          labelText="邮箱地址"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          disabled={busy}
        />
        <TextInput
          id="login-password"
          type="password"
          labelText="密码"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="输入你的密码"
          disabled={busy}
        />
        {message ? (
          <InlineNotification
            kind="error"
            lowContrast
            hideCloseButton
            title="登录失败"
            subtitle={message}
          />
        ) : null}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        <Button
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={busy}
          className="auth-submit"
        >
          {busy ? '正在验证…' : '登录'}
        </Button>
      </form>

      <div className="auth-access-note">
        <span className="auth-access-note__indicator" aria-hidden="true" />
        <p><strong>尚未获得账户？</strong><br />此工作空间暂不开放公开注册，请先由管理员创建账户并设置初始密码。</p>
      </div>
    </LoginShell>
  );
}
