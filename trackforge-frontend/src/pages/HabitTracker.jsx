import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import {
  Plus, Flame, Check, X, Edit2, Trash2, Calendar,
  TrendingUp, Activity, Target, Star, ChevronDown, ChevronRight,
  Zap, BarChart2, RefreshCw
} from 'lucide-react';
import SageLineChart from '../components/Charts/SageLineChart.jsx';

// ─── Colour system ────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  fitness:   { ring: '#a96532', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  wellness:  { ring: '#8a7a4f', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  exercise:  { ring: '#4d7d54', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  hydration: { ring: '#827a60', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  knowledge: { ring: '#c9852d', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  routine:   { ring: '#6f472d', bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  skill:     { ring: '#aa8261', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  custom:    { ring: '#6366f1', bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700' },
};

const heatColor = (count) => {
  if (count === 0) return '#f3e8d6';
  if (count === 1) return '#d6a45f';
  if (count === 2) return '#b77422';
  if (count === 3) return '#6f472d';
  return '#3e2b1f';
};

// ─── Mini heatmap (30 days) ───────────────────────────────────────────────────
const MiniHeatmap = ({ heatmap = [] }) => (
  <div className="flex gap-[3px] flex-wrap">
    {heatmap.slice(-30).map((cell, i) => (
      <div
        key={i}
        title={`${cell.date}: ${cell.count} completions`}
        className="w-3 h-3 rounded-sm transition-all duration-200 hover:scale-125 cursor-default"
        style={{ backgroundColor: heatColor(cell.count) }}
      />
    ))}
  </div>
);

const toLast30Trend = (heatmap = []) => {
  const byDate = {};
  heatmap.forEach((cell) => {
    if (cell.date) byDate[cell.date] = cell.count || 0;
  });
  return Array.from({ length: 30 }, (_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - index));
    const date = d.toISOString().split('T')[0];
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: byDate[date] || 0
    };
  });
};

// ─── Full heatmap (365 days, 52-week grid) ────────────────────────────────────
const FullHeatmap = ({ heatmap = [] }) => {
  const weeks = [];
  const padded = [...Array(Math.max(0, 364 - heatmap.length + 1)).fill({ date: '', count: 0 }), ...heatmap.slice(-365)];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-[3px] min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) => (
              <div
                key={di}
                title={cell.date ? `${cell.date}: ${cell.count}` : ''}
                className="w-3 h-3 rounded-sm transition-all hover:scale-125 cursor-default"
                style={{ backgroundColor: cell.date ? heatColor(cell.count) : 'transparent' }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(l => (
          <div key={l} className="w-3 h-3 rounded-sm" style={{ backgroundColor: heatColor(l) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

// ─── Progress ring ───────────────────────────────────────────────────────────
const ProgressRing = ({ pct = 0, color = '#6366f1', size = 52 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

// ─── Habit Form Modal ─────────────────────────────────────────────────────────
const HabitModal = ({ habit, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '', category: 'custom', color: '#6366f1', icon: 'activity', goal: 1, goalType: 'times_per_day'
  });

  useEffect(() => {
    if (habit) setForm({
      name: habit.name || '',
      category: habit.category || 'custom',
      color: habit.color || '#6366f1',
      icon: habit.icon || 'activity',
      goal: habit.goal || 1,
      goalType: habit.goalType || 'times_per_day'
    });
  }, [habit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-white">
            {habit ? '✏️ Edit Habit' : '✨ New Habit'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Habit Name *</label>
            <input
              type="text"
              placeholder="e.g. Morning Run, Read 30 mins…"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="fitness">💪 Fitness</option>
                <option value="wellness">🧘 Wellness</option>
                <option value="exercise">🏃 Exercise</option>
                <option value="hydration">💧 Hydration</option>
                <option value="knowledge">📚 Knowledge</option>
                <option value="routine">⏰ Routine</option>
                <option value="skill">🎯 Skill</option>
                <option value="custom">⭐ Custom</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer p-0.5"
                />
                <span className="text-xs text-slate-400 font-mono">{form.color}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Daily Goal</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.goal}
                onChange={e => setForm(p => ({ ...p, goal: parseInt(e.target.value) || 1 }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Goal Type</label>
              <select
                value={form.goalType}
                onChange={e => setForm(p => ({ ...p, goalType: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="times_per_day">Per Day</option>
                <option value="times_per_week">Per Week</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 rounded-xl text-sm font-semibold transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-extrabold shadow shadow-primary/20 transition">
              {habit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Habit Card ───────────────────────────────────────────────────────────────
const HabitCard = ({ habit, onComplete, onEdit, onDelete, expanded, onToggleExpand }) => {
  const col = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.custom;
  const consistency = habit.consistency || 0;
  const streak = habit.currentStreak || 0;
  const longest = habit.longestStreak || 0;
  const isDoneToday = habit.completedToday;

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isDoneToday ? 'border-emerald-800/40 bg-slate-950/20' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}>
      {/* Card Header */}
      <div className="p-4 flex items-center gap-3">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <ProgressRing pct={consistency} color={habit.color || col.ring} size={52} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-white">{consistency}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-extrabold text-sm leading-snug ${isDoneToday ? 'text-slate-400 line-through' : 'text-white'}`}>
              {habit.name}
            </p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-bold uppercase ${col.bg} ${col.text} ${col.border}`}>
              {habit.category}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Flame size={11} className={streak > 0 ? 'text-orange-400' : ''} />
              <span className={streak > 0 ? 'text-orange-400 font-bold' : ''}>{streak} day streak</span>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={10} />
              <span>Best: {longest}d</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onComplete(habit)}
            disabled={isDoneToday}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isDoneToday
                ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
            }`}
            title={isDoneToday ? 'Already done today!' : 'Mark complete'}
          >
            <Check size={15} />
          </button>
          <button onClick={() => onEdit(habit)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 flex items-center justify-center transition">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(habit._id)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition">
            <Trash2 size={13} />
          </button>
          <button onClick={onToggleExpand} className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 flex items-center justify-center transition">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded: mini heatmap */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-850/60 bg-slate-950/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-wider">Last 30 Days</p>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            <MiniHeatmap heatmap={habit.heatmap} />
            <div className="rounded-2xl border border-border/60 bg-background/35 p-2">
              <SageLineChart data={toLast30Trend(habit.heatmap)} height={96} valueLabel="Completions" compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | 'edit'
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState('cards'); // 'cards' | 'heatmap'
  const [heatmapData, setHeatmapData] = useState([]);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchHabits = useCallback(async () => {
    try {
      const res = await api.get('/habits');
      setHabits(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  // Aggregate heatmap across all habits
  useEffect(() => {
    if (!habits.length) return;
    const map = {};
    habits.forEach(h => {
      (h.heatmap || []).forEach(cell => {
        if (!map[cell.date]) map[cell.date] = 0;
        map[cell.date] += cell.count;
      });
    });

    const days = 365;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({ date: dateStr, count: map[dateStr] || 0 });
    }
    setHeatmapData(result);
  }, [habits]);

  const handleCreate = async (payload) => {
    try {
      const res = await api.post('/habits', payload);
      setHabits(prev => [res.data.data, ...prev]);
      setModal(null);
      showToast('Habit created! 🎯');
    } catch (err) {
      showToast('Failed to create habit', true);
    }
  };

  const handleEdit = async (payload) => {
    try {
      const res = await api.patch(`/habits/${selectedHabit._id}`, payload);
      setHabits(prev => prev.map(h => h._id === selectedHabit._id ? { ...h, ...res.data.data } : h));
      setModal(null);
      setSelectedHabit(null);
      showToast('Habit updated! ✨');
    } catch (err) {
      showToast('Failed to update habit', true);
    }
  };

  const handleComplete = async (habit) => {
    try {
      await api.post(`/habits/${habit._id}/complete`, {});
      showToast(`${habit.name} completed! 🔥`);
      fetchHabits(); // Refresh streaks & heatmap
    } catch (err) {
      const msg = err.response?.data?.message || 'Already completed today';
      showToast(msg, true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this habit? Your completion history will also be lost.')) return;
    try {
      await api.delete(`/habits/${id}`);
      setHabits(prev => prev.filter(h => h._id !== id));
      showToast('Habit deleted');
    } catch {
      showToast('Failed to delete habit', true);
    }
  };

  // Summary stats
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completedToday).length;
  const totalStreak = habits.reduce((s, h) => s + (h.currentStreak || 0), 0);
  const avgConsistency = totalHabits > 0
    ? Math.round(habits.reduce((s, h) => s + (h.consistency || 0), 0) / totalHabits)
    : 0;

  const aggregateTrend = useMemo(() => {
    const byDate = {};
    habits.forEach((habit) => {
      (habit.heatmap || []).forEach((cell) => {
        if (!cell.date) return;
        byDate[cell.date] = (byDate[cell.date] || 0) + (cell.count || 0);
      });
    });
    return Array.from({ length: 30 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - index));
      const date = d.toISOString().split('T')[0];
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: byDate[date] || 0
      };
    });
  }, [habits]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-900/40 border border-slate-800 rounded-xl w-52" />
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-900/40 border border-slate-800 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-lg ${toast.err ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {modal === 'create' && <HabitModal onClose={() => setModal(null)} onSave={handleCreate} />}
      {modal === 'edit' && selectedHabit && (
        <HabitModal
          habit={selectedHabit}
          onClose={() => { setModal(null); setSelectedHabit(null); }}
          onSave={handleEdit}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Habit Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">Build consistency. Track streaks. Win every day.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button onClick={() => setView('cards')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${view === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>
              Cards
            </button>
            <button onClick={() => setView('heatmap')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${view === 'heatmap' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>
              Heatmap
            </button>
          </div>
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow shadow-primary/25 transition"
          >
            <Plus size={15} /> Add Habit
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Target, label: 'Total Habits', value: totalHabits, color: 'text-primary' },
          { icon: Check, label: 'Done Today', value: `${completedToday}/${totalHabits}`, color: 'text-emerald-400' },
          { icon: Flame, label: 'Combined Streak', value: `${totalStreak}d`, color: 'text-orange-400' },
          { icon: BarChart2, label: 'Avg Consistency', value: `${avgConsistency}%`, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">{s.label}</p>
              <p className="text-xl font-extrabold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's progress bar */}
      {totalHabits > 0 && (
        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold">Today's Completion</span>
              <span className="font-bold text-white">{completedToday} / {totalHabits} habits</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-2xl font-black text-white">
            {totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0}%
          </span>
        </div>
      )}

      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark dark:text-primary-light">Habit trend</p>
            <h2 className="text-lg font-black text-white">Completions across the last 30 days</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500">{completedToday}/{totalHabits} completed today</p>
        </div>
        <SageLineChart data={aggregateTrend} height={210} valueLabel="Completions" showYAxis compact />
      </div>

      {/* Views */}
      {view === 'heatmap' && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-emerald-400" />
            <p className="font-extrabold text-slate-200">Combined Activity Heatmap (1 Year)</p>
          </div>
          <p className="text-xs text-slate-500 mb-3">Each cell = total completions across all habits on that day.</p>
          <FullHeatmap heatmap={heatmapData} />
        </div>
      )}

      {view === 'cards' && (
        <div className="space-y-3">
          {habits.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
              <Zap size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">No habits yet.</p>
              <p className="text-slate-500 text-sm mt-1">Start by adding your first habit above.</p>
            </div>
          ) : (
            habits.map(habit => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onComplete={handleComplete}
                onEdit={(h) => { setSelectedHabit(h); setModal('edit'); }}
                onDelete={handleDelete}
                expanded={expandedId === habit._id}
                onToggleExpand={() => setExpandedId(prev => prev === habit._id ? null : habit._id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
