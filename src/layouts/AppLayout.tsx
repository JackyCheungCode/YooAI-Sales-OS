import { SideNavItems, SideNavLink } from '@carbon/react';
import { Building, Dashboard, Help, Settings, UserMultiple } from '@carbon/react/icons';
import type { MouseEvent } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../app/AuthContext';

export function AppLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const goTo = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(path);
  };
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const pageTitle = isDashboard ? '经营智控中枢' : location.pathname === '/customers' ? '客户管理' : '经营智控中枢';

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand__mark"><Building size={19} /></div><div><div className="brand__name">YooAI Sales OS</div><div className="brand__caption">BUSINESS INTELLIGENCE</div></div></div>
      <div className="workspace-label">经营工作空间</div>
      <nav className="nav-list" aria-label="主导航"><SideNavItems>
        <SideNavLink href="/dashboard" isActive={isDashboard} renderIcon={Dashboard} onClick={goTo('/dashboard')}>经营智控中枢</SideNavLink>
        <SideNavLink href="/customers" isActive={location.pathname === '/customers'} renderIcon={UserMultiple} onClick={goTo('/customers')}>客户管理</SideNavLink>
      </SideNavItems></nav>
      <div className="sidebar-bottom"><SideNavItems>
        <SideNavLink href="/dashboard" renderIcon={Help} onClick={goTo('/dashboard')}>帮助中心</SideNavLink>
        <SideNavLink href="/dashboard" renderIcon={Settings} onClick={goTo('/dashboard')}>系统设置</SideNavLink>
      </SideNavItems></div>
    </aside>
    <div className="app-main">
      <header className="topbar">
        <div className="breadcrumb">经营分析 <span>/</span> <strong>{pageTitle}</strong></div>
        <div className="topbar__actions">
          <Button variant="ghost" size="sm" renderIcon={Help} onClick={() => window.alert('帮助中心将在后续版本接入。')}>帮助</Button>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>工作账户 · 退出登录</Button>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
    </div>
  </div>;
}
