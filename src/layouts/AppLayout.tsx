import { SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem } from '../components/carbon/compat';
import { useState, type MouseEvent } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Grid, Column } from '../components/carbon/compat';
import { useAuth } from '../app/AuthContext';
import { Logout } from '../components/carbon/icons';

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
      <cds-skip-to-content href="#main-content" />
      <cds-header-menu-button
        aria-label={mobileNavOpen ? '收起导航菜单' : '展开导航菜单'}
        active={mobileNavOpen}
        onClick={() => setMobileNavOpen(open => !open)}
      />
      <cds-header-name href="/dashboard" prefix="">YooAI Sales OS</cds-header-name>
      <div className="cds--header__global">
        <cds-header-global-action aria-label="退出登录" tooltip-text="退出登录" onClick={() => void signOut()}>
          <Logout size={20} slot="icon" />
        </cds-header-global-action>
      </div>
    </cds-header>
    <cds-side-nav
      className="sidebar"
      aria-label="主导航"
      expanded={mobileNavOpen}
      isPersistent
      onClick={() => setMobileNavOpen(false)}
    >
      <SideNavItems>
        <SideNavLink href="/dashboard" isActive={isDashboard} onClick={goTo('/dashboard')}>经营智控中枢</SideNavLink>
        <SideNavMenu title="客户管理" isActive={isCustomerArea}>
          <SideNavMenuItem href="/customers" isActive={location.pathname === '/customers'} onClick={goTo('/customers')}>客户总览</SideNavMenuItem>
          <SideNavMenuItem href="/accounts" isActive={location.pathname === '/accounts'} onClick={goTo('/accounts')}>客户档案（Account）</SideNavMenuItem>
          <SideNavMenuItem href="/leads" isActive={location.pathname === '/leads'} onClick={goTo('/leads')}>线索（Lead）</SideNavMenuItem>
          <SideNavMenuItem href="/contacts" isActive={location.pathname === '/contacts'} onClick={goTo('/contacts')}>联系人（Contact）</SideNavMenuItem>
          <SideNavMenuItem href="/opportunities" isActive={location.pathname === '/opportunities'} onClick={goTo('/opportunities')}>商机（Opportunity）</SideNavMenuItem>
        </SideNavMenu>
        <SideNavMenu title="销售单据" isActive={isSalesDocuments}>
          <SideNavMenuItem href="/quotes" isActive={location.pathname === '/quotes'} onClick={goTo('/quotes')}>报价单（Quote）</SideNavMenuItem>
          <SideNavMenuItem href="/orders" isActive={location.pathname === '/orders'} onClick={goTo('/orders')}>订单（Order）</SideNavMenuItem>
          <SideNavMenuItem href="/shipments" isActive={location.pathname === '/shipments'} onClick={goTo('/shipments')}>出运单（Shipment）</SideNavMenuItem>
          <SideNavMenuItem href="/payments" isActive={location.pathname === '/payments'} onClick={goTo('/payments')}>收汇记录（Payment）</SideNavMenuItem>
        </SideNavMenu>
      </SideNavItems>
      <cds-side-nav-divider />
      <SideNavItems>
        <SideNavLink href="/dashboard" onClick={goTo('/dashboard')}>帮助中心</SideNavLink>
        <SideNavMenu title="系统设置" isActive={location.pathname.startsWith('/settings')}>
          <SideNavMenuItem href="/settings/ai-providers" isActive={location.pathname === '/settings/ai-providers'} onClick={goTo('/settings/ai-providers')}>AI 模型与数据服务</SideNavMenuItem>
        </SideNavMenu>
      </SideNavItems>
    </cds-side-nav>
    <div className="app-main">
      <cds-breadcrumb className="page-breadcrumb" aria-label="页面路径">
        <cds-breadcrumb-item href="/dashboard">经营工作空间</cds-breadcrumb-item>
        <cds-breadcrumb-item aria-current="page">{pageTitle}</cds-breadcrumb-item>
      </cds-breadcrumb>
      <main id="main-content" className="page-content cds--content">
        <Grid fullWidth className="page-layout-grid">
          <Column sm={4} md={8} lg={16} xlg={16}><Outlet /></Column>
        </Grid>
      </main>
    </div>
  </div>;
}
