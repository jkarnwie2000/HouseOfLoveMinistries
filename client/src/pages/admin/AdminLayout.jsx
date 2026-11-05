import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, ClipboardList, ExternalLink, HandCoins, Inbox, LayoutDashboard, LogOut, Menu, Package, Tags, UserCog } from 'lucide-react';
import Logo from '../../components/ui/Logo.jsx';
import { RequireAuth, useAuth } from '../../context/AuthContext.jsx';
import { usePageMeta } from '../../lib/hooks.js';
import '../../styles/admin.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/donations', label: 'Donations', icon: HandCoins, role: 'admin' },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/messages', label: 'Messages & Subscribers', icon: Inbox },
  { to: '/admin/users', label: 'Staff Accounts', icon: UserCog, role: 'admin' },
];

function Shell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  usePageMeta('Admin Dashboard');
  useEffect(() => { setOpen(false); }, [pathname]);

  // Keep admin pages out of search engines.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`} aria-label="Admin navigation">
        <Logo to="/admin" />
        <ul className="admin-nav">
          {NAV.filter((n) => !n.role || n.role === user.role).map(({ to, label, icon: I, end }) => (
            <li key={to}><NavLink to={to} end={end}><I size={18} aria-hidden="true" /> {label}</NavLink></li>
          ))}
        </ul>
        <div className="admin-sidebar-foot">
          <a href="/" target="_blank" rel="noopener noreferrer">View website <ExternalLink size={13} aria-hidden="true" /></a>
        </div>
      </aside>
      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" style={{ zIndex: 205 }} />}
      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="btn btn-ghost btn-icon admin-menu-toggle" onClick={() => setOpen(true)} aria-label="Open admin menu"><Menu size={22} aria-hidden="true" /></button>
          <span className="small muted">House of Love · Admin</span>
          <div className="who">
            <span className="avatar" aria-hidden="true">{user.name?.[0]?.toUpperCase() || 'A'}</span>
            <span><strong>{user.name}</strong><br /><span className="muted small">{user.role}</span></span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}><LogOut size={16} aria-hidden="true" /> Sign out</button>
          </div>
        </header>
        <main className="admin-content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return <RequireAuth><Shell /></RequireAuth>;
}
