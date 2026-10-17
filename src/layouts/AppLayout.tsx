import { SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem } from '../components/carbon/compat';
import { Building, Dashboard, Help, Settings, UserMultiple, Document, Logout } from '@carbon/icons-react';
import { useState, type MouseEvent } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Grid, Column } from '../components/carbon/compat';
import { useAuth } from '../app/AuthContext';

export function AppLayout() {
  const { signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const goTo = (path: string) => (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    navigate(path);
    setMobileNavOpen(false);
  };
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isCustomerArea = ['/customers', '/accounts', '/leads', '/contacts', '/opportunities'].includes(location.pathname);
  const isSalesDocuments = ['/quotes', '/orders', '/shipments', '/payments'].includes(location.pathname);
  const pageTitle = isDashboard ? '经营智控中枢'
    : location.pathname === '/customers' || location.pathname === '/accounts' ? '客户（Account）'
    : location.pathname === '/leads' ? '线索（Lead）'
    : location.pathname === '/contacts' ? '联系人（Contact）'
    : location.pathname === '/opportunities' ? '商机（Opportunity）'
    : location.pathname === '/quotes' ? '报价单（Quote）'
    : location.pathname === '/orders' ? '订单（Order）'
    : location.pathname === '/shipments' ? '出运单（Shipment）'
    : location.pathname === '/payments' ? '收汇记录（Payment）'
    : location.pathname === '/settings/ai-providers' ? 'AI 模型与数据服务'
    : '经营智控中枢';

  return <div className="app-shell">
    <cds-header aria-label="YooAI Sales OS">
      <cds-header-menu-button
        aria-label={mobileNavOpen ? '收起导航菜单' : '展开导航菜单'}
        active={mobileNavOpen}
        onClick={() => setMobileNavOpen(open => !open)}
      />
      <cds-header-name href="/dashboard" prefix="">YooAI Sales OS</cds-header-name>
      <cds-header-global-action aria-label="退出登录" tooltip-text="退出登录" onClick={() => void signOut()}>
        <Logout size={20} />
      </cds-header-global-action>
    </cds-header>
    <cds-side-nav
      className="sidebar"
      aria-label="主导航"
      expanded={mobileNavOpen}
      isPersistent
      onClick={() => setMobileNavOpen(false)}
    >
      <div className="brand" aria-hidden="true">
        <div className="brand__mark"><Building size={19} /></div>
        <div><div className="brand__name">YooAI Sales OS</div><div className="brand__caption">BUSINESS INTELLIGENCE</div></div>
      </div>
      <div className="workspace-label">经营工作空间</div>
      <SideNavItems>
        <SideNavLink href="/dashboard" isActive={isDashboard} renderIcon={Dashboard} onClick={goTo('/dashboard')}>经营智控中枢</SideNavLink>
        <SideNavMenu title="客户管理" renderIcon={UserMultiple} isActive={isCustomerArea}>
          <SideNavMenuItem href="/accounts" isActive={location.pathname === '/accounts' || location.pathname === '/customers'} onClick={goTo('/accounts')}>客户（Account）</SideNavMenuItem>
          <SideNavMenuItem href="/leads" isActive={location.pathname === '/leads'} onClick={goTo('/leads')}>线索（Lead）</SideNavMenuItem>
          <SideNavMenuItem href="/contacts" isActive={location.pathname === '/contacts'} onClick={goTo('/contacts')}>联系人（Contact）</SideNavMenuItem>
          <SideNavMenuItem href="/opportunities" isActive={location.pathname === '/opportunities'} onClick={goTo('/opportunities')}>商机（Opportunity）</SideNavMenuItem>
        </SideNavMenu>
        <SideNavMenu title="销售单据" renderIcon={Document} isActive={isSalesDocuments}>
          <SideNavMenuItem href="/quotes" isActive={location.pathname === '/quotes'} onClick={goTo('/quotes')}>报价单（Quote）</SideNavMenuItem>
          <SideNavMenuItem href="/orders" isActive={location.pathname === '/orders'} onClick={goTo('/orders')}>订单（Order）</SideNavMenuItem>
          <SideNavMenuItem href="/shipments" isActive={location.pathname === '/shipments'} onClick={goTo('/shipments')}>出运单（Shipment）</SideNavMenuItem>
          <SideNavMenuItem href="/payments" isActive={location.pathname === '/payments'} onClick={goTo('/payments')}>收汇记录（Payment）</SideNavMenuItem>
        </SideNavMenu>
      </SideNavItems>
      <cds-side-nav-divider />
      <SideNavItems>
        <SideNavLink href="/dashboard" renderIcon={Help} onClick={goTo('/dashboard')}>帮助中心</SideNavLink>
        <SideNavMenu title="系统设置" isActive={location.pathname.startsWith('/settings')} renderIcon={Settings}>
          <SideNavMenuItem href="/settings/ai-providers" isActive={location.pathname === '/settings/ai-providers'} onClick={goTo('/settings/ai-providers')}>AI 模型与数据服务</SideNavMenuItem>
        </SideNavMenu>
      </SideNavItems>
    </cds-side-nav>
    <div className="app-main">
      <div className="topbar" aria-label="页面路径">
        <div className="breadcrumb">
          <cds-breadcrumb>
            <cds-breadcrumb-item href="/dashboard">经营工作空间</cds-breadcrumb-item>
            <cds-breadcrumb-item aria-current="page">{pageTitle}</cds-breadcrumb-item>
          </cds-breadcrumb>
        </div>
      </div>
      <main className="page-content">
        <Grid fullWidth className="page-layout-grid">
          <Column sm={4} md={8} lg={16} xlg={16}><Outlet /></Column>
        </Grid>
      </main>
    </div>
  </div>;
}
