import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LayoutDashboard, BarChart3, LogOut, Ticket } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
          <Ticket size={24} className="glow-effect" />
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
            Aegis<span className="text-indigo-400 font-semibold font-mono">Desk</span>
          </span>
          <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Smart AI
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link
          to="/"
          className={`flex items-center gap-2 text-sm font-medium transition-all ${
            isActive('/') ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        {isAdmin && (
          <Link
            to="/analytics"
            className={`flex items-center gap-2 text-sm font-medium transition-all ${
              isActive('/analytics') ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={18} />
            Analytics
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-100">{user.fullname}</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              {isAdmin ? (
                <>
                  <Shield size={10} className="text-amber-500" />
                  Admin
                </>
              ) : (
                'Employee'
              )}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
            {user.fullname.charAt(0).toUpperCase()}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-300"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
