import { SideNavItems, SideNavLink } from '@carbon/react';
import { Activity, Ai, Building, Close, Dashboard, Document, Help, Menu, Plug, Search, Settings, ShoppingCart, UserMultiple } from '@carbon/react/icons';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../app/AuthContext';

const pageTitles: Record<string, string> = {
  '/dashboard': '全球客户看板',
  '/prospecting': '智能获客中心',
  '/leads': '潜在客户管理',
  '/customers': '客户与联系人',
  '/sales': '销售跟进与沟通',
  '/quotes': '报价管理',
  '/orders': '订单管理',
  '/agents': 'AI 智能体中心',
  '/integrations': 'API 与集成',
  '/settings': '系统设置与数据管理',
};

export function AppLayout() {
  const { signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentTitle = pageTitles[location.pathname] ?? '销售工作台';
  const goTo = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(path);
    setMobileNavOpen(false);
  };
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`app-shell${mobileNavOpen ? " app-shell--mobile-nav-open" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark"><Building size={19} /></div>
          <div>
            <div className="brand__name">Yooai Sales OS</div>
            <div className="brand__caption">GLOBAL SALES PLATFORM</div>
          </div>
          <Button className="mobile-nav-toggle" variant="ghost" size="sm" aria-label={mobileNavOpen ? "关闭导航" : "打开导航"} aria-expanded={mobileNavOpen} aria-controls="primary-navigation" renderIcon={mobileNavOpen ? Close : Menu} onClick={() => setMobileNavOpen((open) => !open)} />
        </div>

        <nav id="primary-navigation" className={`nav-list${mobileNavOpen ? " nav-list--open" : ""}`} aria-label="主导航">
          <div className="workspace-label">销售业务</div>
          <SideNavItems>
            <SideNavLink href="/dashboard" isActive={isActive('/dashboard')} renderIcon={Dashboard} onClick={goTo('/dashboard')}>销售工作台</SideNavLink>
            <SideNavLink href="/prospecting" isActive={isActive('/prospecting')} renderIcon={Search} onClick={goTo('/prospecting')}>智能获客中心</SideNavLink>
            <SideNavLink href="/leads" isActive={isActive('/leads')} renderIcon={UserMultiple} onClick={goTo('/leads')}>潜在客户管理</SideNavLink>
            <SideNavLink href="/customers" isActive={isActive('/customers')} renderIcon={Building} onClick={goTo('/customers')}>客户与联系人</SideNavLink>
            <SideNavLink href="/sales" isActive={isActive('/sales')} renderIcon={Activity} onClick={goTo('/sales')}>销售跟进与沟通</SideNavLink>
            <SideNavLink href="/quotes" isActive={isActive('/quotes')} renderIcon={Document} onClick={goTo('/quotes')}>报价管理</SideNavLink>
            <SideNavLink href="/orders" isActive={isActive('/orders')} renderIcon={ShoppingCart} onClick={goTo('/orders')}>订单管理</SideNavLink>
          </SideNavItems>

          <div className="workspace-label nav-section-label">智能与集成</div>
          <SideNavItems>
            <SideNavLink href="/agents" isActive={isActive('/agents')} renderIcon={Ai} onClick={goTo('/agents')}>AI 智能体中心</SideNavLink>
            <SideNavLink href="/integrations" isActive={isActive('/integrations')} renderIcon={Plug} onClick={goTo('/integrations')}>API 与集成</SideNavLink>
          </SideNavItems>

          <div className="workspace-label nav-section-label">系统管理</div>
          <SideNavItems>
            <SideNavLink href="/settings" isActive={isActive('/settings')} renderIcon={Settings} onClick={goTo('/settings')}>系统设置与数据管理</SideNavLink>
          </SideNavItems>
        </nav>

        <div className="sidebar-bottom">
          <Button variant="ghost" size="sm" renderIcon={Help} onClick={() => navigate('/settings')}>帮助与支持</Button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb"><span>Yooai Sales OS</span><span>/</span><strong>{currentTitle}</strong></div>
          <div className="topbar__actions">
            <Button variant="ghost" size="sm" renderIcon={Ai} onClick={() => navigate('/agents')}>AI 助手</Button>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>工作账户 · 退出登录</Button>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
