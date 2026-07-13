import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  BarChart3, BookOpen, CheckSquare, Code, Flame, LayoutDashboard,
  Layers, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search,
  Settings, Sparkles, Sun, Timer, Trello, X
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Focus',
    items: [
      { name: 'Today', path: '/', icon: LayoutDashboard, hint: 'Next best action' },
      { name: 'Planner', path: '/planner', icon: CheckSquare, hint: 'Tasks and deadlines' },
      { name: 'Pomodoro', path: '/pomodoro', icon: Timer, hint: 'Deep work blocks' }
    ]
  },
  {
    label: 'Placement Prep',
    items: [
      { name: 'LeetCode', path: '/leetcode', icon: Code, hint: 'DSA practice' },
      { name: 'Core Subjects', path: '/subjects', icon: BookOpen, hint: 'CS fundamentals' },
      { name: 'System Design', path: '/system-design', icon: Layers, hint: 'Architecture prep' }
    ]
  },
  {
    label: 'Operating System',
    items: [
      { name: 'Habits', path: '/habits', icon: Flame, hint: 'Consistency loops' },
      { name: 'Kanban', path: '/kanban', icon: Trello, hint: 'Project flow' },
      { name: 'Analytics', path: '/analytics', icon: BarChart3, hint: 'Progress signals' }
    ]
  }
];

const isActivePath = (pathname, path) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

const DashboardLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const activeItem = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const match = group.items.find((item) => isActivePath(location.pathname, item.path));
      if (match) return match;
    }
    return NAV_GROUPS[0].items[0];
  }, [location.pathname]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const sidebar = (
    <motion.aside
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      className="glassmorphism flex h-full flex-col overflow-hidden rounded-[32px]"
    >
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[18px] bg-primary text-sm font-black text-white shadow-tactile">
              TF
            </div>
            {!collapsed && (
              <div>
                <p className="text-lg font-black tracking-tight text-white">TrackForge</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Placement OS</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden rounded-2xl border border-border/70 bg-surface/45 p-2 text-slate-500 hover:border-primary/45 hover:text-primary md:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {!collapsed && (
          <button
            type="button"
            className="mt-7 flex w-full items-center gap-2 rounded-2xl border border-border/70 bg-surface/45 px-3 py-2.5 text-left text-xs font-medium text-slate-500 hover:-translate-y-0.5 hover:border-primary/40 hover:text-slate-700 dark:hover:text-slate-100"
          >
            <Search size={14} />
            Search workspace
            <span className="ml-auto rounded-lg border border-border/70 bg-background/50 px-1.5 py-0.5 text-[9px] text-slate-500">Soon</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className={`mt-3 flex w-full items-center rounded-2xl border border-border/70 bg-surface/45 p-1 text-xs font-bold text-slate-500 hover:border-primary/40 ${collapsed ? 'justify-center' : 'justify-between'}`}
          aria-label="Toggle color theme"
        >
          <span className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 ${theme === 'light' ? 'bg-primary text-white shadow-tactile' : 'text-slate-500'}`}>
            <Sun size={14} />
            {!collapsed && 'Sage'}
          </span>
          {!collapsed && (
            <span className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 ${theme === 'dark' ? 'bg-primary text-white shadow-tactile' : 'text-slate-500'}`}>
              <Moon size={14} />
              Forest
            </span>
          )}
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{group.label}</p>}
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(location.pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 rounded-2xl border px-3 py-3 ${
                      active
                        ? 'border-primary/35 bg-primary/15 text-white shadow-tactile'
                        : 'border-transparent text-slate-500 hover:-translate-y-0.5 hover:border-border/80 hover:bg-surface/45 hover:text-white'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-nav"
                        className="absolute left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-primary"
                      />
                    )}
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${active ? 'bg-primary text-white' : 'bg-background/65 text-slate-500'}`}>
                      <Icon size={16} strokeWidth={1.9} />
                    </span>
                    {!collapsed && (
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{item.name}</span>
                        <span className="block truncate text-[10px] text-slate-500">{item.hint}</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-5">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-surface/45 p-3 text-left hover:-translate-y-0.5 hover:border-primary/40"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-background">
            {user?.avatar ? (
              <img src={user.avatar.startsWith('/') ? `http://localhost:5000${user.avatar}` : user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <Settings size={16} className="text-slate-500" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{user?.name || 'Guest User'}</p>
              <p className="truncate text-[10px] text-slate-500">{user?.targetRole || 'CS Student'}</p>
            </div>
          )}
        </button>
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:border-red-500/30 hover:bg-red-500/15"
          >
            <LogOut size={14} />
            Sign out
          </button>
        )}
      </div>
    </motion.aside>
  );

  return (
    <div className="app-surface min-h-screen text-white">
      <button
        onClick={() => setMobileOpen((open) => !open)}
        className="fixed left-4 top-4 z-50 rounded-2xl border border-border/70 bg-surface/80 p-2 text-slate-600 shadow-paper backdrop-blur md:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`fixed inset-y-0 left-0 z-40 w-72 transform p-4 transition-all duration-300 md:translate-x-0 ${collapsed ? 'md:w-28' : 'md:w-[19rem]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>

      <main className={`relative min-h-screen min-w-0 transition-[padding] duration-300 ${collapsed ? 'md:pl-28' : 'md:pl-[19rem]'}`}>
        <header className="sticky top-0 z-20 border-b border-border/30 bg-background/45 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-10">
            <div className="min-w-0 pl-12 md:pl-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-dark dark:text-primary-light">
                <Sparkles size={12} /> {activeItem.hint}
              </p>
              <h1 className="truncate text-2xl font-black tracking-tight text-white">{activeItem.name}</h1>
            </div>
            <Link
              to="/planner"
              className="tactile-button hidden rounded-2xl border border-primary/20 bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-dark sm:block"
            >
              Plan next block
            </Link>
          </div>
        </header>

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="mx-auto max-w-7xl px-5 pb-12 pt-5 md:px-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
