import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  LayoutDashboard,
  BarChart3,
  LogOut,
  Ticket,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ to: '/analytics', label: 'Analytics', icon: BarChart3 }] : []),
  ];

  const NavContent = () => (
    <>
      <div className="p-5 border-b border-border-subtle">
        <button
          type="button"
          onClick={() => { navigate('/'); setMobileOpen(false); }}
          className="flex items-center gap-3 w-full text-left group"
        >
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow">
            <Ticket size={22} aria-hidden />
          </div>
          <div className="min-w-0">
            <span className="font-display font-bold text-lg text-content tracking-tight block">
              Aegis<span className="text-brand-500">Desk</span>
            </span>
            <span className="text-[10px] font-medium text-content-muted flex items-center gap-1">
              <Sparkles size={10} className="text-brand-500" />
              AI Helpdesk
            </span>
          </div>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={`nav-link ${isActive(to) ? 'nav-link-active' : ''}`}
          >
            <Icon size={18} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border-subtle space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl glass-card">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
            {user.fullname.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-content truncate">{user.fullname}</p>
            <p className="text-[11px] text-content-muted flex items-center gap-1">
              {isAdmin ? (
                <>
                  <Shield size={11} className="text-amber-500" />
                  Administrator
                </>
              ) : (
                'Employee'
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-secondary flex-1 py-2"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-xs">{isDark ? 'Light' : 'Dark'}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary py-2 px-3 text-rose-500 hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/10"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 glass-panel border-b border-border-subtle px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <div className="p-2 rounded-lg bg-brand-500/15 text-brand-500">
            <Ticket size={20} />
          </div>
          <span className="font-display font-bold text-content">AegisDesk</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl btn-secondary"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 glass-panel flex flex-col border-r border-border-subtle transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl btn-secondary"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-30 h-screen w-64 flex-col glass-panel border-r border-border-subtle">
        <NavContent />
      </aside>
    </>
  );
};

export default Sidebar;
