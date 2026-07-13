import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ArrowRight, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock3,
  Code2, Flame, Leaf, ListChecks, Plus, Target, Timer, TrendingUp, X, Zap
} from 'lucide-react';

const TOPICS = [
  'Array', 'String', 'Hash Table', 'Two Pointers', 'Sliding Window', 'Stack',
  'Queue', 'Heap', 'Binary Search', 'Tree', 'Graph', 'DP', 'Greedy',
  'Backtracking', 'Linked List', 'Math', 'Sorting', 'Trie', 'Union Find',
  'Bit Manipulation'
];

const clamp = (value) => Math.max(0, Math.min(100, value || 0));

const Surface = ({ children, className = '', as: Component = 'section' }) => (
  <Component className={`premium-card rounded-[30px] ${className}`}>{children}</Component>
);

const SectionLabel = ({ eyebrow, title, action }) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-dark dark:text-primary-light">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-black tracking-tight text-white md:text-2xl">{title}</h2>
    </div>
    {action}
  </div>
);

const ProgressBar = ({ value }) => (
  <div className="h-2.5 overflow-hidden rounded-full bg-background/70 shadow-inner">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${clamp(value)}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="h-full rounded-full bg-primary"
    />
  </div>
);

const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast.show && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`fixed right-5 top-5 z-50 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-paper backdrop-blur-xl ${
          toast.error
            ? 'border-red-500/20 bg-red-500/10 text-red-400'
            : 'border-primary/25 bg-surface/80 text-white'
        }`}
      >
        {toast.msg}
      </motion.div>
    )}
  </AnimatePresence>
);

const DialogShell = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="glassmorphism w-full max-w-md rounded-[28px] p-5 shadow-paper"
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="rounded-2xl p-2 text-slate-500 hover:bg-background/60 hover:text-white" aria-label="Close dialog">
          <X size={16} />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

const inputClass = 'w-full rounded-2xl border border-border/75 bg-surface/55 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none';
const secondaryButtonClass = 'flex-1 rounded-2xl border border-border/75 bg-surface/35 px-4 py-2.5 text-xs font-bold text-slate-500 hover:border-primary/40 hover:text-white';
const primaryButtonClass = 'tactile-button flex-1 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-50';

const QuickTaskModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ title: '', timeSlot: 'morning', priority: 'Medium', estimatedTime: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post('/planner/tasks', form);
      onSuccess('Task added successfully.');
      onClose();
    } catch {
      onSuccess('Failed to add task.', true);
      setLoading(false);
    }
  };

  return (
    <DialogShell title="Add quick task" subtitle="Capture one concrete study action." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Task title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className={inputClass} required />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.timeSlot} onChange={(event) => setForm((prev) => ({ ...prev, timeSlot: event.target.value }))} className={inputClass}>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
          <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))} className={inputClass}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <input type="number" placeholder="Estimated time (minutes)" value={form.estimatedTime} onChange={(event) => setForm((prev) => ({ ...prev, estimatedTime: event.target.value }))} className={inputClass} />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={loading} className={primaryButtonClass}>{loading ? 'Adding...' : 'Add task'}</button>
        </div>
      </form>
    </DialogShell>
  );
};

const QuickHabitModal = ({ habits, onClose, onSuccess }) => {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      await api.post(`/habits/${selected}/complete`, {});
      onSuccess('Habit logged.');
      onClose();
    } catch (err) {
      onSuccess(err.response?.data?.error?.message || 'Failed to log habit.', true);
      onClose();
    }
  };

  return (
    <DialogShell title="Log habit" subtitle="Close a consistency loop for today." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select value={selected} onChange={(event) => setSelected(event.target.value)} className={inputClass} required>
          <option value="">Select a habit</option>
          {habits.map((habit) => <option key={habit._id} value={habit._id}>{habit.name}{habit.completedToday ? ' (done)' : ''}</option>)}
        </select>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={loading || !selected} className={primaryButtonClass}>{loading ? 'Logging...' : 'Mark complete'}</button>
        </div>
      </form>
    </DialogShell>
  );
};

const QuickLeetcodeModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ title: '', difficulty: 'Medium', topic: '', status: 'Solved' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post('/leetcode/problems', form);
      onSuccess('Problem logged.');
      onClose();
    } catch {
      onSuccess('Failed to log problem.', true);
      setLoading(false);
    }
  };

  return (
    <DialogShell title="Log LeetCode problem" subtitle="Keep DSA progress current without leaving your brief." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Problem title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className={inputClass} required />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.difficulty} onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))} className={inputClass}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className={inputClass}>
            <option value="Solved">Solved</option>
            <option value="Attempted">Attempted</option>
            <option value="Revised">Revised</option>
          </select>
        </div>
        <select value={form.topic} onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))} className={inputClass} required>
          <option value="">Select topic</option>
          {TOPICS.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
        </select>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button>
          <button type="submit" disabled={loading} className={primaryButtonClass}>{loading ? 'Logging...' : 'Log problem'}</button>
        </div>
      </form>
    </DialogShell>
  );
};

const PomodoroWidget = ({ onClose, onSuccess }) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          api.post('/pomodoro/sessions', { duration: 25, type: 'work' })
            .then(() => onSuccess('Focus session complete.'))
            .catch(console.error);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [onSuccess, running]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const pct = ((25 * 60 - secondsLeft) / (25 * 60)) * 100;

  return (
    <DialogShell title="Focus session" subtitle="A single 25-minute block. Start, finish, log." onClose={onClose}>
      <div className="py-4 text-center">
        <div className="mx-auto mb-5 grid h-40 w-40 place-items-center rounded-full border border-primary/20 bg-primary/10">
          <div>
            <p className="text-4xl font-black tabular-nums text-white">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark dark:text-primary-light">{Math.round(pct)}% complete</p>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={() => setRunning((value) => !value)} className="tactile-button rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">
            {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={() => { setSecondsLeft(25 * 60); setRunning(false); }} className="rounded-2xl border border-border/75 bg-surface/35 px-4 py-3 text-sm font-bold text-slate-500 hover:text-white">
            Reset
          </button>
        </div>
      </div>
    </DialogShell>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-80 rounded-[34px] border border-border/60 bg-surface/45" />
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="h-96 rounded-[30px] border border-border/60 bg-surface/45" />
      <div className="h-96 rounded-[30px] border border-border/60 bg-surface/45" />
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', error: false });
  const [modal, setModal] = useState(null);

  const showToast = (msg, error = false) => {
    setToast({ show: true, msg, error });
    setTimeout(() => setToast({ show: false, msg: '', error: false }), 3000);
  };

  const fetchData = async (skeleton = false) => {
    if (skeleton) setLoading(true);
    try {
      const [dashRes, habitRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/habits')
      ]);
      setMetrics(dashRes.data.data);
      setHabits(habitRes.data.data || []);
    } catch (err) {
      console.error(err);
      showToast('Dashboard data could not be refreshed.', true);
    } finally {
      if (skeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteTask = async (taskId) => {
    try {
      await api.post(`/planner/tasks/${taskId}/complete`, { actualTime: 30 });
      showToast('Task completed.');
      fetchData(false);
    } catch {
      showToast('Failed to complete task.', true);
    }
  };

  const model = useMemo(() => {
    const progress = metrics?.dailyProgress || 0;
    const habitsDone = metrics?.habitCompletionPercentage || 0;
    const focusSessions = metrics?.pomodoroSessionsToday || 0;
    const lcSolved = metrics?.leetcodeProblemsToday || 0;
    const studyHours = metrics?.studyHoursToday || 0;
    const nextAction = metrics?.todaysPriorityTask
      ? { label: metrics.todaysPriorityTask.title, detail: `${metrics.todaysPriorityTask.priority} priority task`, route: '/planner', cta: 'Open planner' }
      : lcSolved === 0
        ? { label: 'Solve one DSA problem', detail: 'Protect the coding streak before the day gets noisy.', route: '/leetcode', cta: 'Open LeetCode' }
        : habitsDone < 100
          ? { label: 'Close remaining habits', detail: 'Small consistency loops compound fastest.', route: '/habits', cta: 'Review habits' }
          : { label: 'Start a focus block', detail: 'Use the next 25 minutes for deliberate practice.', route: '/pomodoro', cta: 'Start timer' };

    return { progress, habitsDone, focusSessions, lcSolved, studyHours, nextAction };
  }, [metrics]);

  const insightCards = [
    { label: 'Deep work', value: `${model.studyHours}h`, detail: `${model.focusSessions} focus sessions`, icon: Clock3 },
    { label: 'DSA signal', value: model.lcSolved, detail: 'problems solved today', icon: Code2 },
    { label: 'Habits', value: `${model.habitsDone}%`, detail: 'daily rhythm closed', icon: Flame },
  ];

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-10">
      <Toast toast={toast} />

      {modal === 'task' && <QuickTaskModal onClose={() => setModal(null)} onSuccess={(msg, error) => { showToast(msg, error); fetchData(false); }} />}
      {modal === 'habit' && <QuickHabitModal habits={habits} onClose={() => setModal(null)} onSuccess={(msg, error) => { showToast(msg, error); fetchData(false); }} />}
      {modal === 'leetcode' && <QuickLeetcodeModal onClose={() => setModal(null)} onSuccess={(msg, error) => { showToast(msg, error); fetchData(false); }} />}
      {modal === 'pomodoro' && <PomodoroWidget onClose={() => setModal(null)} onSuccess={(msg) => { showToast(msg); fetchData(false); }} />}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-5 xl:grid-cols-12"
      >
        <div className="relative overflow-hidden rounded-[36px] border border-primary/20 bg-primary/10 p-7 shadow-paper md:p-10 xl:col-span-8 xl:row-span-2">
          <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full bg-primary/20 blur-3xl md:block" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-surface/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark dark:text-primary-light">
                <Leaf size={12} /> Morning brief
              </span>
              <span className="rounded-full border border-border/70 bg-surface/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h1 className="mt-8 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
              {user?.name ? `Good to see you, ${user.name.split(' ')[0]}.` : 'Good to see you.'}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
              {metrics?.dailyMotivationQuote || 'Your consistency today is your competitive advantage tomorrow.'}
            </p>

            <div className="mt-10 max-w-3xl rounded-[28px] border border-primary/20 bg-surface/55 p-5 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-dark dark:text-primary-light">Next best action</p>
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">{model.nextAction.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{model.nextAction.detail}</p>
                </div>
                <Link to={model.nextAction.route} className="tactile-button inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white hover:bg-primary-dark">
                  {model.nextAction.cta} <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Surface className="flex flex-col justify-between p-6 xl:col-span-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Study progress</p>
            <div className="mt-5 flex items-end justify-between">
              <p className="text-6xl font-black tracking-tight text-white">{model.progress}%</p>
              <TrendingUp size={30} className="mb-2 text-primary" />
            </div>
            <div className="mt-5"><ProgressBar value={model.progress} /></div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ['Focus', model.focusSessions],
              ['DSA', model.lcSolved],
              ['Habits', `${model.habitsDone}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border/60 bg-background/45 p-4 text-center">
                <p className="text-xl font-black text-white">{value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6 md:p-7 xl:col-span-4">
          <SectionLabel eyebrow="Today's priorities" title="Protect what matters" />
          <div className="mt-6">
            {metrics?.todaysPriorityTask ? (
              <div className="space-y-5">
                <div className="flex gap-4">
                  <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-tactile">
                    <Target size={20} />
                  </span>
                  <div>
                    <p className="text-xl font-black tracking-tight text-white">{metrics.todaysPriorityTask.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{metrics.todaysPriorityTask.priority} priority / {metrics.todaysPriorityTask.status}</p>
                  </div>
                </div>
                <button onClick={() => handleCompleteTask(metrics.todaysPriorityTask.id)} className="tactile-button w-full rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white hover:bg-primary-dark">
                  Mark complete
                </button>
              </div>
            ) : (
              <div className="grid place-items-center rounded-[26px] border border-dashed border-border/80 bg-background/35 px-5 py-10 text-center">
                <ListChecks size={34} className="mb-4 text-primary" />
                <p className="text-lg font-black text-white">No priority task yet</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Choose one concrete action for the next block.</p>
                <button onClick={() => setModal('task')} className="tactile-button mt-5 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white hover:bg-primary-dark">
                  Add priority
                </button>
              </div>
            )}
          </div>
        </Surface>

        {insightCards.map((card) => {
          const Icon = card.icon;
          return (
            <Surface key={card.label} className="p-5 xl:col-span-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary-dark dark:text-primary-light">
                  <Icon size={17} />
                </span>
              </div>
              <p className="mt-5 text-3xl font-black text-white">{card.value}</p>
              <p className="mt-1 text-sm text-slate-500">{card.detail}</p>
            </Surface>
          );
        })}

        <Surface className="p-6 md:p-7 xl:col-span-8">
          <SectionLabel eyebrow="Weekly momentum" title="A calm view of consistency" />
          <div className="mt-6 grid grid-cols-7 gap-3">
            {(metrics?.weeklyHeatmap || []).map((day) => {
              const intensity = day.value === 0 ? 'bg-background/70' : day.value < 20 ? 'bg-primary/15' : day.value < 40 ? 'bg-primary/35' : day.value < 60 ? 'bg-primary/65' : 'bg-primary';
              return (
                <div key={day.date} className="space-y-2">
                  <div className={`aspect-square rounded-2xl border border-border/60 shadow-inner ${intensity}`} title={`${day.date}: ${day.value} pts`} />
                  <p className="truncate text-center text-[10px] font-bold text-slate-500">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                </div>
              );
            })}
            {(metrics?.weeklyHeatmap || []).length === 0 && <p className="col-span-7 py-10 text-center text-sm text-slate-500">Momentum appears after your first logged activity.</p>}
          </div>
        </Surface>

        <Surface className="p-6 xl:col-span-4 xl:row-span-2">
            <SectionLabel
              eyebrow="Quick actions"
              title="One tap away"
              action={<Zap size={18} className="text-primary" />}
            />
            <div className="mt-6 space-y-3">
              {[
                { label: 'Start focus session', detail: '25 minute block', icon: Timer, action: () => setModal('pomodoro') },
                { label: 'Add task', detail: 'Capture next work item', icon: Plus, action: () => setModal('task') },
                { label: 'Log LeetCode', detail: 'Record DSA progress', icon: Code2, action: () => setModal('leetcode') },
                { label: 'Log habit', detail: 'Close consistency loop', icon: Flame, action: () => setModal('habit') }
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.label} onClick={action.action} className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/35 p-3.5 text-left hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface/55">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary-dark dark:text-primary-light">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-white">{action.label}</span>
                      <span className="block text-xs text-slate-500">{action.detail}</span>
                    </span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>
                );
              })}
            </div>
          </Surface>

          <Surface className="p-6 xl:col-span-4">
            <SectionLabel eyebrow="Daily rhythm" title="Habits today" />
            <div className="mt-6 space-y-3">
              {habits.slice(0, 5).map((habit) => (
                <div key={habit._id} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm ${
                  habit.completedToday
                    ? 'border-primary/25 bg-primary/10 text-white'
                    : 'border-border/60 bg-background/35 text-slate-500'
                }`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${habit.completedToday ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className="truncate font-bold">{habit.name}</span>
                  {habit.currentStreak > 0 && <span className="ml-auto text-[10px] font-black uppercase tracking-[0.12em] text-primary-dark dark:text-primary-light">{habit.currentStreak}d</span>}
                </div>
              ))}
              {habits.length === 0 && <p className="rounded-2xl border border-dashed border-border/75 bg-background/35 px-4 py-8 text-center text-sm text-slate-500">No habits tracked yet.</p>}
            </div>
          </Surface>

          <Surface className="p-6 xl:col-span-4">
            <SectionLabel eyebrow="Recent activity" title="Latest signals" />
            <div className="mt-6 space-y-4">
              {metrics?.recentActivity?.length > 0 ? metrics.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={`${activity.timestamp}-${index}`} className="flex gap-3 text-sm">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="leading-6 text-white">{activity.description}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center">
                  <CalendarDays size={30} className="mx-auto mb-3 text-primary" />
                  <p className="text-sm text-slate-500">No recent activity yet.</p>
                </div>
              )}
            </div>
          </Surface>

          <div className="rounded-[30px] border border-primary/20 bg-primary/10 p-6 xl:col-span-4">
            <div className="flex items-start gap-3">
              <BookOpen size={18} className="mt-0.5 text-primary-dark dark:text-primary-light" />
              <div>
                <p className="text-sm font-black text-white">Study insight</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">If progress stalls, reduce the next action until it can be completed in one focused block.</p>
                <Link to="/analytics" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-primary-dark hover:text-white dark:text-primary-light">
                  Open analytics <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
      </motion.section>
    </div>
  );
};

export default Dashboard;
