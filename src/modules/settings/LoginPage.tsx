import { TextInput } from '@carbon/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export function LoginPage() {
  const { session, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <main className="setup-screen"><section className="setup-card">正在加载…</section></main>;
  if (session) return <Navigate to="/customers" replace />;
  if (!isSupabaseConfigured) return <main className="setup-screen"><section className="setup-card"><h1>尚未配置登录服务</h1><p>请先在环境变量中设置 Supabase 项目 URL 和 Publishable Key。</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code></section></main>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result) setMessage(result);
    } catch {
      setMessage('登录请求失败，请检查网络后重试。');
    } finally {
      setBusy(false);
    }
  }

  return <main className="setup-screen"><form className="setup-card login-form" onSubmit={submit}>
    <div className="brand__mark">GP</div><h1>Global Prospect</h1><p>登录客户管理工作台</p>
    <TextInput id="login-email" type="email" labelText="邮箱地址" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
    <TextInput id="login-password" type="password" labelText="登录密码" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
    {message ? <p role="alert" className="login-error">{message}</p> : null}
    <Button type="submit" disabled={busy}>{busy ? '正在登录…' : '登录'}</Button>
    <p className="login-footnote">账户需先在 Supabase Auth 中创建，当前不开放公开注册。</p>
  </form></main>;
}
