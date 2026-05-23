import React from 'react';

const variants = {
  status: {
    open: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/25',
    in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    resolved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    closed: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
  },
  priority: {
    Low: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
    Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    High: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
    Critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 animate-pulse-soft',
  },
  default: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  ai: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
};

export const StatusBadge = ({ status }) => {
  const key = status?.replace(' ', '_') || 'open';
  const cls = variants.status[key] || variants.status.open;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${cls}`}>
      {status?.replace('_', ' ') || 'open'}
    </span>
  );
};

export const PriorityBadge = ({ priority, size = 'sm' }) => {
  const cls = variants.priority[priority] || variants.priority.Medium;
  const sizeCls = size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
  return (
    <span className={`inline-flex items-center rounded-md font-bold uppercase tracking-wider border ${cls} ${sizeCls}`}>
      {priority}
    </span>
  );
};

export const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${variants[variant] || variants.default} ${className}`}>
    {children}
  </span>
);

export default Badge;
