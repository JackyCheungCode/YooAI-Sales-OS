import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <div className="setup-screen">
        <div className="setup-card">
          <div className="brand__mark">GP</div>
          <h1>连接 Supabase</h1>
          <p>应用骨架已准备好。请在 Vercel 环境变量或本地 .env.local 中设置 Supabase 项目 URL 和 Publishable Key，再启用登录。</p>
          <code>VITE_SUPABASE_URL</code>
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>
          <p className="setup-note">不要将 service_role 或 secret key 放进前端环境变量。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="setup-screen"><div className="setup-card">正在验证登录状态…</div></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
