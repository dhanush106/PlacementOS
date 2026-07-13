import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export const Panel = ({ children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-800 bg-slate-900/30 ${className}`}>
    {children}
  </section>
);

export const SectionHeader = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      {eyebrow && <p className="text-[10px] font-bold uppercase tracking-wide text-primary">{eyebrow}</p>}
      <h2 className="text-sm font-extrabold text-white">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

export const MetricTile = ({ icon: Icon, label, value, detail, color = 'text-primary' }) => (
  <div className="flex min-h-[92px] items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
    {Icon && (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
        <Icon size={16} className={color} />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-xl font-black text-white">{value}</p>
      {detail && <p className="mt-0.5 truncate text-[10px] text-slate-500">{detail}</p>}
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon = AlertCircle, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 px-4 py-14 text-center">
    <Icon size={34} className="mb-3 text-slate-700" />
    <p className="text-sm font-bold text-slate-300">{title}</p>
    {description && <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const LoadingBlock = ({ label = 'Loading LeetCode data...' }) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
    <Loader2 size={26} className="animate-spin text-primary" />
    <p className="text-xs font-semibold text-slate-500">{label}</p>
  </div>
);

export const ErrorBlock = ({ message, onRetry }) => (
  <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 text-center">
    <AlertCircle size={34} className="mb-3 text-red-400" />
    <p className="text-sm font-bold text-white">Unable to load LeetCode workspace</p>
    <p className="mt-1 max-w-md text-xs leading-5 text-red-200/70">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-100 transition hover:bg-red-500/20"
      >
        Try again
      </button>
    )}
  </div>
);

export const ProgressBar = ({ value, className = 'bg-primary' }) => (
  <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
    <div className={`h-full rounded-full transition-all duration-700 ${className}`} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
  </div>
);
