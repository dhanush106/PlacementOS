import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import {
  Play, Pause, RotateCcw, SkipForward, Info, Flame,
  Clock, Award, CheckCircle2, BookOpen, X, Check,
  ChevronDown, AlertCircle, Link2
} from 'lucide-react';
import SageLineChart from '../components/Charts/SageLineChart.jsx';

const TIMER_MODES = {
  work:       { label: 'Focus', emoji: '🔥', color: '#f97316', bgClass: 'bg-orange-500/10 border-orange-500/20' },
  shortBreak: { label: 'Short Break', emoji: '🧘', color: '#38bdf8', bgClass: 'bg-sky-500/10 border-sky-500/20' },
  longBreak:  { label: 'Long Break', emoji: '🌴', color: '#8b5cf6', bgClass: 'bg-violet-500/10 border-violet-500/20' },
};

const Pomodoro = () => {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsDoneToday, setSessionsDoneToday] = useState(0);
  const [focusMinutesToday, setFocusMinutesToday] = useState(0);
  const [allTimeSessions, setAllTimeSessions] = useState(0);
  const [recentSessions, setRecentSessions] = useState([]);

  const [customDurations, setCustomDurations] = useState({ work: 25, shortBreak: 5, longBreak: 15 });

  // Task linking
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');

  // Session complete celebration
  const [sessionComplete, setSessionComplete] = useState(false);
  const timerRef = useRef(null);

  // Synthesize completion bell sound
  const playSound = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();

      // Play 3 tones
      [0, 0.3, 0.6].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime([880, 1047, 1319][i], ctx.currentTime + offset);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.5);
      });
    } catch {}
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/pomodoro/stats');
      const s = res.data.data;
      if (s) {
        setSessionsDoneToday(s.sessionsToday || 0);
        setFocusMinutesToday(s.focusMinutesToday || 0);
        setAllTimeSessions(s.totalSessionsAllTime || 0);
        setRecentSessions(s.recentSessions || []);
      }
    } catch {}
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      // Get today's planner tasks (pending/in progress only)
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/planner/tasks?date=${today}`);
      const grouped = res.data.data || {};
      const flat = [
        ...(grouped.morning || []),
        ...(grouped.afternoon || []),
        ...(grouped.evening || []),
        ...(grouped.night || [])
      ].filter(t => t.status !== 'Completed');
      setTasks(flat);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTasks();
  }, [fetchStats, fetchTasks]);

  // Timer countdown effect
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            handleCycleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  // Reset timer when mode or duration changes
  useEffect(() => {
    setTimeLeft(customDurations[mode] * 60);
    setIsActive(false);
    setSessionComplete(false);
  }, [mode, customDurations]);

  const handleCycleComplete = async () => {
    playSound();
    setSessionComplete(true);
    setTimeout(() => setSessionComplete(false), 4000);

    if (mode === 'work') {
      try {
        await api.post('/pomodoro/sessions', {
          duration: customDurations.work,
          type: 'work',
          taskId: selectedTask?._id || null,
          taskLabel: selectedTask?.title || ''
        });
        fetchStats();
      } catch {}

      // Auto-switch to short break
      setMode('shortBreak');
    } else {
      setMode('work');
    }
  };

  const handleToggle = () => setIsActive(prev => !prev);

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(customDurations[mode] * 60);
  };

  const handleSkip = () => {
    setIsActive(false);
    if (mode === 'work') setMode('shortBreak');
    else if (mode === 'shortBreak') setMode('longBreak');
    else setMode('work');
  };

  const handleDurationChange = (type, val) => {
    const mins = Math.max(1, Math.min(180, parseInt(val) || 1));
    setCustomDurations(prev => ({ ...prev, [type]: mins }));
  };

  // Space-bar shortcut to toggle timer
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && !['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        setIsActive(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSec = customDurations[mode] * 60;
  const progressPct = ((totalSec - timeLeft) / totalSec) * 100;

  const modeInfo = TIMER_MODES[mode];

  // SVG ring params
  const R = 90, SIZE = 200, CIRC = 2 * Math.PI * R;
  const strokeOffset = CIRC - (progressPct / 100) * CIRC;

  const filteredTasks = tasks.filter(t =>
    !taskSearch || t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const focusTrend = useMemo(() => {
    const byDate = {};
    recentSessions.forEach((session) => {
      const rawDate = session.completedAt || session.createdAt || session.date;
      if (!rawDate) return;
      const date = new Date(rawDate).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + (session.duration || customDurations.work || 25);
    });
    return Array.from({ length: 14 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - index));
      const date = d.toISOString().split('T')[0];
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: byDate[date] || 0
      };
    });
  }, [customDurations.work, recentSessions]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Pomodoro Timer</h1>
        <p className="text-sm text-slate-400 mt-1">Focus deeper with timed sessions linked to your tasks.</p>
      </div>

      {/* Session Complete Toast */}
      {sessionComplete && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shadow-xl text-sm flex items-center gap-2 animate-pulse">
          <CheckCircle2 size={16} /> Session complete! 🎉 Great focus session.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Timer Panel ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-3xl p-8 flex flex-col items-center gap-6">

          {/* Mode Switcher */}
          <div className="flex bg-slate-950/60 border border-slate-850 rounded-2xl p-1 gap-1 w-full max-w-sm">
            {Object.entries(TIMER_MODES).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold transition ${mode === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                {cfg.emoji} {cfg.label}
              </button>
            ))}
          </div>

          {/* SVG Ring Progress Timer */}
          <div className="relative flex items-center justify-center" style={{ width: SIZE + 20, height: SIZE + 20 }}>
            <svg width={SIZE} height={SIZE} className="rotate-[-90deg] absolute">
              <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#1e293b" strokeWidth={10} />
              <circle
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none" stroke={modeInfo.color} strokeWidth={10}
                strokeDasharray={CIRC} strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.7s linear' }}
              />
            </svg>
            <div className="z-10 text-center select-none">
              <div className="text-5xl font-black text-white tabular-nums tracking-tight leading-none">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">
                {isActive ? (mode === 'work' ? 'Focusing…' : 'Resting…') : 'Ready'}
              </div>
            </div>
          </div>

          {/* Linked Task Widget */}
          <div className="w-full max-w-md space-y-2 relative">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 size={10} /> Linked Task {mode !== 'work' && <span className="text-slate-600">(Focus mode only)</span>}
              </p>
              {selectedTask && (
                <button onClick={() => setSelectedTask(null)} className="text-[10px] text-slate-500 hover:text-red-400 transition">Clear</button>
              )}
            </div>

            {selectedTask ? (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${modeInfo.bgClass}`}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: modeInfo.color }} />
                <span className="text-xs font-semibold text-slate-200 flex-1 truncate">{selectedTask.title}</span>
                <span className="text-[9px] text-slate-500 bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-850 font-bold uppercase">{selectedTask.priority}</span>
                <button onClick={() => setSelectedTask(null)} className="text-slate-500 hover:text-white transition"><X size={12} /></button>
              </div>
            ) : (
              <button
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                disabled={mode !== 'work'}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-950/30 border border-slate-850 rounded-xl text-xs text-slate-500 hover:text-white hover:border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Select a task to focus on…</span>
                <ChevronDown size={13} />
              </button>
            )}

            {/* Task Picker Dropdown */}
            {showTaskPicker && mode === 'work' && (
              <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-slate-850">
                  <input
                    type="text" autoFocus
                    placeholder="Search tasks..."
                    value={taskSearch}
                    onChange={e => setTaskSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                  {filteredTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 italic">
                      {tasks.length === 0 ? "No pending tasks found. Add tasks in the Daily Planner." : "No tasks match your search."}
                    </p>
                  ) : (
                    filteredTasks.map(t => {
                      const priorityColors = { High: 'bg-red-500', Medium: 'bg-amber-500', Low: 'bg-slate-600' };
                      return (
                        <button
                          key={t._id}
                          onClick={() => { setSelectedTask(t); setShowTaskPicker(false); setTaskSearch(''); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-850 transition"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityColors[t.priority] || 'bg-slate-600'}`} />
                          <span className="text-xs text-slate-200 font-medium flex-1 truncate">{t.title}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">{t.timeSlot}</span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="p-2 border-t border-slate-850 text-center">
                  <button onClick={() => setShowTaskPicker(false)} className="text-[10px] text-slate-500 hover:text-white">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-5">
            <button
              onClick={handleReset}
              className="p-3.5 bg-slate-950/40 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={handleToggle}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-black/30 transition transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: modeInfo.color }}
            >
              {isActive ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-1" />}
            </button>
            <button
              onClick={handleSkip}
              className="p-3.5 bg-slate-950/40 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition"
              title="Skip"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <p className="text-[9px] text-slate-650 flex items-center gap-1 italic">
            <Info size={9} /> Press [Space] to start or pause the timer.
          </p>
        </div>

        {/* ── Settings + Stats Side Panel ─────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Custom Durations */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4">
            <p className="text-xs font-bold text-slate-350 uppercase tracking-wider">Session Durations</p>
            {[
              { key: 'work', label: '🔥 Focus', color: 'text-orange-400' },
              { key: 'shortBreak', label: '🧘 Short Break', color: 'text-sky-400' },
              { key: 'longBreak', label: '🌴 Long Break', color: 'text-purple-400' },
            ].map(item => (
              <div key={item.key} className="flex justify-between items-center bg-slate-950/40 border border-slate-850 px-3 py-2.5 rounded-xl">
                <span className={`text-xs font-semibold ${item.color}`}>{item.label}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={customDurations[item.key]}
                    onChange={e => handleDurationChange(item.key, e.target.value)}
                    className="w-12 text-right text-xs font-black text-white bg-transparent outline-none border-none"
                  />
                  <span className="text-[10px] text-slate-500">min</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4">
            <p className="text-xs font-bold text-slate-350 uppercase tracking-wider">Today's Focus</p>
            {[
              { icon: Flame, label: 'Sessions Done Today', value: `${sessionsDoneToday}`, color: 'text-orange-400' },
              { icon: Clock, label: 'Focus Minutes Today', value: `${focusMinutesToday}m`, color: 'text-violet-400' },
              { icon: Award, label: 'All-Time Sessions', value: `${allTimeSessions}`, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon size={18} className={s.color} />
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">{s.label}</p>
                  <p className="text-lg font-black text-white leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-350 uppercase tracking-wider">Focus trend</p>
              <p className="mt-1 text-[10px] text-slate-500">Minutes completed across recent days</p>
            </div>
            <SageLineChart data={focusTrend} height={170} valueLabel="Focus minutes" showYAxis compact />
          </div>

          {/* Recent Sessions Log */}
          {recentSessions.length > 0 && (
            <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-3 flex-1">
              <p className="text-xs font-bold text-slate-350 uppercase tracking-wider">Recent Sessions</p>
              <div className="space-y-2 overflow-y-auto max-h-48">
                {recentSessions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] bg-slate-950/30 p-2.5 rounded-xl border border-slate-850">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-300 truncate">{s.taskLabel || 'General Focus'}</p>
                      <p className="text-slate-600">{s.duration}min · {new Date(s.completedAt).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;
