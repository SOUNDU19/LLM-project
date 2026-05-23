import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const configs = {
  error: {
    icon: AlertCircle,
    wrapper: 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300',
    iconCls: 'text-rose-500',
  },
  success: {
    icon: CheckCircle2,
    wrapper: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300',
    iconCls: 'text-emerald-500',
  },
  info: {
    icon: Info,
    wrapper: 'bg-brand-500/10 border-brand-500/25 text-slate-700 dark:text-slate-300',
    iconCls: 'text-brand-500',
  },
};

const Alert = ({ variant = 'error', children, className = '' }) => {
  const { icon: Icon, wrapper, iconCls } = configs[variant] || configs.error;
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium animate-fade-in ${wrapper} ${className}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${iconCls}`} aria-hidden />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};

export default Alert;
