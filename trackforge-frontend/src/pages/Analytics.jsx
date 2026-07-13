import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import {
  TrendingUp, TrendingDown, Activity, Zap, BookOpen, Clock,
  Target, Award, BarChart2, Flame, CheckCircle2, Brain,
  Layers, Code2, Star, RefreshCw, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const CHART_COLORS = ['#6f472d', '#c9852d', '#8a7a4f', '#4d7d54', '#aa8261', '#b77422', '#5c4938', '#d69a45'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white shadow-2xl">
      {label && <p className="font-bold mb-1 text-slate-300">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name || p.dataKey}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

// ─── Stat Card Component ─────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, delta, color = 'text-primary' }) => {
  const isPos = delta > 0;
  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-750 transition">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-slate-950/40 border border-slate-850 flex-shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5 leading-tight">{value}</p>
        {(sub || delta !== undefined) && (
          <div className="flex items-center gap-2 mt-0.5">
            {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
            {delta !== undefined && (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(delta)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Section Title ────────────────────────────────────────────────────────────
const SectionTitle = ({ icon: Icon, title, sub, color = 'text-primary' }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-slate-950/40 border border-slate-850`}>
      <Icon size={16} className={color} />
    </div>
    <div>
      <p className="font-extrabold text-white text-sm">{title}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  </div>
);

// ─── Main Analytics Component ─────────────────────────────────────────────────
const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('7d'); // for future expansion

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-52 bg-slate-900/40 border border-slate-800 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-900/40 border border-slate-800 rounded-2xl" />)}
      </div>
      {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-900/40 border border-slate-800 rounded-2xl" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-red-400 font-semibold">{error}</p>
        <button onClick={fetchAnalytics} className="mt-3 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition">Retry</button>
      </div>
    </div>
  );

  const { overview, taskTrend, lcTrend, pomodoroTrend, habitBreakdown, topicDistribution, subjectProgress, leetcodeProfile } = data || {};

  // LeetCode difficulty pie data
  const lcDiffPie = [
    { name: 'Easy', value: overview?.easyLC || 0, color: '#4d7d54' },
    { name: 'Medium', value: overview?.mediumLC || 0, color: '#c9852d' },
    { name: 'Hard', value: overview?.hardLC || 0, color: '#a84b38' },
  ].filter(d => d.value > 0);

  // Combined trend for comparison chart
  const combinedTrend = (taskTrend || []).map((t, i) => ({
    label: t.label,
    Tasks: t.completed,
    LeetCode: (lcTrend || [])[i]?.solved || 0,
    'Pomodoro (×5min)': Math.round(((pomodoroTrend || [])[i]?.minutes || 0) / 5)
  }));

  // Habit radar data
  const radarData = (habitBreakdown || []).slice(0, 6).map(h => ({
    habit: h.name,
    streak: h.streak,
    best: h.best
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Comprehensive overview of your placement preparation progress.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition hover:border-slate-700"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* ── Key Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Task Completion" value={`${overview?.taskCompletionRate || 0}%`} sub={`${overview?.completedTasks || 0} of ${overview?.totalTasks || 0} tasks`} color="text-emerald-400" />
        <StatCard icon={Code2} label="LeetCode Solved" value={overview?.solvedLC || 0} sub={`${overview?.easyLC}E / ${overview?.mediumLC}M / ${overview?.hardLC}H`} color="text-amber-400" />
        <StatCard icon={Flame} label="Avg Habit Streak" value={`${overview?.avgStreak || 0}d`} sub={`Best: ${overview?.maxStreak || 0} days`} color="text-orange-400" />
        <StatCard icon={Clock} label="Total Focus Time" value={`${Math.floor((overview?.totalFocusMinutes || 0) / 60)}h ${(overview?.totalFocusMinutes || 0) % 60}m`} sub={`${overview?.totalFocusSessions || 0} sessions`} color="text-violet-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Today's Tasks Done" value={overview?.completedToday || 0} sub={`of ${overview?.tasksToday || 0} planned today`} color="text-blue-400" />
        <StatCard icon={Brain} label="Study Mastery" value={`${overview?.studyMastery || 0}%`} sub="Confident topics" color="text-primary" />
        <StatCard icon={Layers} label="Sys Design Mastered" value={overview?.sdMastered || 0} sub={`${overview?.sdLearning || 0} still learning`} color="text-cyan-400" />
        <StatCard icon={Activity} label="Focus Today" value={`${overview?.focusToday || 0}m`} sub="Pomodoro sessions today" color="text-rose-400" />
      </div>

      {/* ── 7-Day Combined Activity Chart ───────────────────────────────────── */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
        <SectionTitle icon={BarChart2} title="7-Day Activity Comparison" sub="Tasks completed, LeetCode solved, and Pomodoro focus time" color="text-primary" />
        {combinedTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={combinedTrend} barCategoryGap="25%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 12 }} />
              <Bar dataKey="Tasks" fill="#6f472d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="LeetCode" fill="#c9852d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pomodoro (×5min)" fill="#8a7a4f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm text-center py-12">No activity data yet. Start completing tasks!</p>
        )}
      </div>

      {/* ── Tasks + Pomodoro Trends Side by Side ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Task Completion Trend */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <SectionTitle icon={CheckCircle2} title="Task Completion Trend" sub="Daily completed tasks (7 days)" color="text-emerald-400" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={taskTrend}>
              <defs>
                <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4d7d54" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4d7d54" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="completed" name="Tasks Done" stroke="#4d7d54" fill="url(#taskGrad)" strokeWidth={2} dot={{ fill: '#4d7d54', r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pomodoro Focus Trend */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <SectionTitle icon={Clock} title="Daily Focus Time" sub="Pomodoro minutes per day (7 days)" color="text-violet-400" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={pomodoroTrend}>
              <defs>
                <linearGradient id="pomGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#aa8261" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#aa8261" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="minutes" name="Focus (mins)" stroke="#aa8261" fill="url(#pomGrad)" strokeWidth={2} dot={{ fill: '#aa8261', r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── LeetCode + Topics Analysis ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LeetCode Difficulty Pie */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <SectionTitle icon={Code2} title="LeetCode Difficulty Split" sub="Distribution across Easy / Medium / Hard" color="text-amber-400" />
          {lcDiffPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={lcDiffPie}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                  >
                    {lcDiffPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-5 mt-2">
                {lcDiffPie.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-400">{d.name}: <strong className="text-white">{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-500 text-sm">Log LeetCode problems to see difficulty split.</div>
          )}
          {leetcodeProfile && (
            <div className="mt-3 pt-3 border-t border-slate-850 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs font-black text-emerald-400">{leetcodeProfile.easySolved}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold">LC Easy</p>
              </div>
              <div>
                <p className="text-xs font-black text-amber-400">{leetcodeProfile.mediumSolved}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold">LC Medium</p>
              </div>
              <div>
                <p className="text-xs font-black text-red-400">{leetcodeProfile.hardSolved}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold">LC Hard</p>
              </div>
            </div>
          )}
        </div>

        {/* Topic Bar Chart */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <SectionTitle icon={Layers} title="LeetCode Problem Topics" sub="Most practiced DSA topics" color="text-blue-400" />
          {topicDistribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topicDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={95} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Problems" radius={[0, 4, 4, 0]}>
                  {topicDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-500 text-sm">Log problems to see topic breakdown.</div>
          )}
        </div>
      </div>

      {/* ── Habit Radar Chart ────────────────────────────────────────────────── */}
      {radarData.length > 0 && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <SectionTitle icon={Flame} title="Habit Consistency Radar" sub="Current streak vs personal best across active habits" color="text-orange-400" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="habit" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} />
              <Radar name="Current Streak" dataKey="streak" stroke="#8a7a4f" fill="#8a7a4f" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Best Streak" dataKey="best" stroke="#6f472d" fill="#6f472d" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 3" />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 10 }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Subject Progress + LeetCode Trend Bottom Row ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subject Mastery Progress */}
        {subjectProgress?.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
            <SectionTitle icon={BookOpen} title="Core Subjects Mastery" sub="Topic confidence % per subject" color="text-emerald-400" />
            <div className="space-y-3 mt-2">
              {subjectProgress.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold truncate">{s.name}</span>
                    <span className="text-slate-500 flex-shrink-0 ml-2">{s.confident}/{s.total} confident</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                  <p className="text-right text-[10px] font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{s.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LeetCode Trend Line Chart */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
          <SectionTitle icon={TrendingUp} title="LeetCode Solved Trend" sub="Problems solved per day (7 days)" color="text-amber-400" />
          {lcTrend?.some(t => t.solved > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lcTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="solved" name="Solved"
                  stroke="#c9852d" strokeWidth={2.5}
                  dot={{ fill: '#c9852d', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <Code2 size={28} className="text-slate-700" />
              Start solving problems to see your trend here.
            </div>
          )}
        </div>
      </div>

      {/* ── Insight Badges Row ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900/50 via-slate-900/30 to-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Star size={13} className="text-amber-400" /> Auto-Generated Insights
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            overview?.taskCompletionRate >= 70
              ? { text: `🔥 Great job! You've completed ${overview?.taskCompletionRate}% of all planned tasks.`, col: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' }
              : { text: `📋 Task completion is at ${overview?.taskCompletionRate}%. Try breaking tasks into smaller steps.`, col: 'border-amber-500/20 bg-amber-500/5 text-amber-300' },
            overview?.maxStreak >= 7
              ? { text: `⚡ Incredible! You have a personal best streak of ${overview?.maxStreak} days.`, col: 'border-violet-500/20 bg-violet-500/5 text-violet-300' }
              : { text: `🧘 Build consistency. Aim for a 7-day habit streak for best results.`, col: 'border-blue-500/20 bg-blue-500/5 text-blue-300' },
            overview?.studyMastery >= 50
              ? { text: `📚 You've mastered ${overview?.studyMastery}% of your core subject topics. Keep going!`, col: 'border-sky-500/20 bg-sky-500/5 text-sky-300' }
              : { text: `📖 Core subject mastery at ${overview?.studyMastery}%. Focus on revising unconfident topics daily.`, col: 'border-slate-700 bg-slate-900/40 text-slate-400' },
          ].map((ins, i) => (
            <div key={i} className={`p-3 rounded-xl border text-xs leading-relaxed ${ins.col}`}>
              {ins.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;


