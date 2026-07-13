import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="app-surface relative flex min-h-screen items-center justify-center overflow-hidden p-4 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 border-b border-slate-800/50 bg-gradient-to-b from-primary/10 to-transparent" />

      <div className="z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-paper backdrop-blur-xl md:grid-cols-2">
        <div className="flex flex-col justify-between border-r border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-primary/10 p-8 md:p-12">
          <div>
            <div className="mb-8 flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <span className="text-lg font-bold text-white">TF</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">TrackForge</span>
            </div>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white">
              The Placement OS for <span className="text-gradient">focused developers</span>
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              Track LeetCode progress, daily schedules, habits, and core CS revision in one warm, distraction-light workspace.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center space-x-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <p className="text-xs text-slate-300">14 day habit streak protected</p>
            </div>
            <div className="flex items-center space-x-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="text-xs text-slate-300">Daily LeetCode goal: 8/10 problems solved</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

