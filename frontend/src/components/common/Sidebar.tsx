import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Truck, ClipboardList, Package,
  BarChart3, LogOut, Wrench, ChevronRight, Zap, Users
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'WORKSHOP_STAFF'] },
  { to: '/vehicles', icon: Truck, label: 'Vehicles', roles: ['ADMIN', 'MANAGER', 'WORKSHOP_STAFF'] },
  { to: '/job-cards', icon: ClipboardList, label: 'Job Cards', roles: ['ADMIN', 'MANAGER', 'WORKSHOP_STAFF'] },
  { to: '/inventory', icon: Package, label: 'Inventory', roles: ['ADMIN', 'MANAGER', 'WORKSHOP_STAFF'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['ADMIN', 'MANAGER'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['ADMIN'] },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display text-white font-bold text-base leading-none">GMS</div>
            <div className="text-slate-500 text-xs mt-0.5">Garage Management</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-sky-400/60" />}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-slate-800">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500/5 to-purple-500/5 border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Zap size={12} className="text-sky-400" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-slate-800/50">
          <div className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center text-sky-400 text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
