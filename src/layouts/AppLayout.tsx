import { Building, ChevronDown, Dashboard, Help, Settings, UserMultiple } from '@carbon/react/icons';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';

export function AppLayout() {
  const { signOut } = useAuth();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand__mark"><Building size={19} /></div><div><div className="brand__name">Global Prospect</div><div className="brand__caption">SALES WORKSPACE</div></div></div>
      <div className="workspace-label">工作空间</div>
      <nav className="nav-list"><NavLink to="/customers" className={({ isActive }) => 'nav-item ' + (isActive ? 'nav-item--active' : '')}><UserMultiple size={18} /><span>客户管理</span></NavLink></nav>
      <div className="sidebar-bottom"><div className="nav-item nav-item--muted"><Dashboard size={18} /><span>工作台</span></div><div className="nav-item nav-item--muted"><Settings size={18} /><span>系统设置</span></div></div>
    </aside>
    <div className="app-main">
      <header className="topbar"><div className="breadcrumb">客户关系管理 <span>/</span> <strong>客户管理</strong></div><div className="topbar__actions"><button className="icon-button" aria-label="帮助"><Help size={18} /></button><button className="profile-button" onClick={() => void signOut()} title="退出登录"><span className="avatar">Y</span><span>工作账户</span><ChevronDown size={14} /></button></div></header>
      <main className="page-content"><Outlet /></main>
    </div>
  </div>;
}
