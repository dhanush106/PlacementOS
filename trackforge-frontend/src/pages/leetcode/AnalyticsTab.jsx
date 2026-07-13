import React from 'react';
import { BarChart2, TrendingUp, Clock, Target, Star, Layers } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#38bdf8', '#ec4899', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white shadow-2xl">
      {label && <p className="font-bold mb-1 text-slate-350">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

const AnalyticsTab = ({ data }) => {
  const { overview = {}, topicTracker = [], patternAnalytics = [], productivity = {} } = data || {};

  // Sort topicTracker by completion and slice top 6 for radar chart
  const radarData = [...topicTracker]
    .filter(t => t.solvedProblems > 0)
    .slice(0, 6)
    .map(t => ({
      subject: t.topic,
      solved: t.solvedProblems,
      target: t.targetProblems
    }));

  // Bar chart pattern data
  const barData = patternAnalytics.map(p => ({
    name: p.pattern.length > 12 ? p.pattern.substring(0, 10) + '..' : p.pattern,
    Mastery: p.masteryPercentage
  }));

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Acceptance Rate', value: `${overview.acceptanceRate || 0}%`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Avg Solve Time', value: `${overview.avgTimePerProblem || 0} min`, icon: Clock, color: 'text-blue-400' },
          { label: 'Avg Attempts', value: `${overview.avgAttempts || 1.0}`, icon: Target, color: 'text-violet-400' },
          { label: 'Level XP', value: overview.leetcodeXP || 0, icon: Star, color: 'text-amber-400' }
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className={m.color} />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{m.label}</p>
                <p className="text-base font-black text-white mt-0.5">{m.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Section ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topic Radar Comparison */}
        <div className="lg:col-span-6 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-primary" /> Topic Solved vs Target
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Compares solved questions against target values</p>
          </div>

          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} />
                <Radar name="Solved" dataKey="solved" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Target" dataKey="target" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#64748b', paddingTop: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500 italic">No topic stats available. Solved questions required.</div>
          )}
        </div>

        {/* Pattern Mastery Bar Chart */}
        <div className="lg:col-span-6 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 size={13} className="text-amber-400" /> Pattern Mastery Status
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Evaluation of pattern mastery percentage values</p>
          </div>

          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Mastery" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500 italic">No pattern statistics logged.</div>
          )}
        </div>
      </div>

      {/* ── Productivity Section ────────────────────────────────────────── */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold text-slate-300">Productivity & Consistency Insights</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Most Active Day</p>
            <p className="text-sm font-black text-white mt-1">{productivity.mostProductiveDay || 'Not Available'}</p>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Avg Daily Target</p>
            <p className="text-sm font-black text-white mt-1">{productivity.avgDailyProblems || 0} Problems/day</p>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Activity Consistency</p>
            <p className="text-sm font-black text-white mt-1">{productivity.consistencyPercentage || 0}% active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;

