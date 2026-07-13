import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api.js';
import {
  BarChart2, BookOpen, BriefcaseBusiness, CheckCircle2, ChevronRight,
  Compass, Flame, LayoutGrid, ListChecks, RefreshCw, Search, Settings,
  Target, TrendingUp, Zap
} from 'lucide-react';

import OverviewTab from './OverviewTab.jsx';
import DailyQueueTab from './DailyQueueTab.jsx';
import ProblemExplorerTab from './ProblemExplorerTab.jsx';
import StriverSheetTab from './StriverSheetTab.jsx';
import TopicTrackerTab from './TopicTrackerTab.jsx';
import CompanySheetsTab from './CompanySheetsTab.jsx';
import RevisionTab from './RevisionTab.jsx';
import AnalyticsTab from './AnalyticsTab.jsx';
import HeatmapTab from './HeatmapTab.jsx';
import AchievementsTab from './AchievementsTab.jsx';
import SyncSettingsTab from './SyncSettingsTab.jsx';
import { ErrorBlock, LoadingBlock, Panel, ProgressBar } from './components/LeetcodeUI.jsx';
import SageLineChart from '../../components/Charts/SageLineChart.jsx';

const NAV_ITEMS = [
  { id: 'focus', label: 'Focus', description: 'Today and next actions', icon: Compass },
  { id: 'queue', label: 'Queue', description: 'Recommended problems', icon: Target },
  { id: 'striver', label: 'Sheet', description: 'Striver A2Z roadmap', icon: BookOpen },
  { id: 'problems', label: 'Problems', description: 'Log and review', icon: Search },
  { id: 'insights', label: 'Insights', description: 'Topics, trends, heatmap', icon: BarChart2 },
  { id: 'companies', label: 'Companies', description: 'Placement readiness', icon: BriefcaseBusiness },
  { id: 'settings', label: 'Settings', description: 'Sync and targets', icon: Settings }
];

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const LeetcodeModule = () => {
  const [activeTab, setActiveTab] = useState('focus');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchFullData = useCallback(async () => {
    setLoading((current) => current || !data);
    try {
      const res = await api.get('/leetcode/analytics');
      setData(res.data.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch LeetCode data. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFullData();
  }, [fetchFullData]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const profile = await api.get('/users/profile');
      const username = profile.data.data?.leetcodeUsername;
      if (!username) {
        setActiveTab('settings');
        return;
      }
      await api.post('/leetcode/sync', { username });
      await fetchFullData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'LeetCode sync failed. Check username configuration or try again later.');
    } finally {
      setSyncing(false);
    }
  };

  const summary = useMemo(() => {
    const overview = data?.overview || {};
    const topicTracker = data?.topicTracker || [];
    const weakestTopic = [...topicTracker]
      .filter((topic) => topic.solvedProblems < topic.targetProblems)
      .sort((a, b) => a.completionPercentage - b.completionPercentage)[0];

    return {
      solved: overview.totalSolved || 0,
      trackedSolved: overview.trackedSolved || 0,
      streak: overview.streak?.current || 0,
      xp: overview.leetcodeXP || 0,
      readiness: clamp(data?.placementReadinessScore),
      weakestTopic
    };
  }, [data]);

  const solvedTrend = useMemo(() => {
    const heatmap = data?.heatmap || [];
    return heatmap.slice(-30).map((day) => ({
      label: day.date ? new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      value: day.count || day.solved || day.value || 0
    }));
  }, [data]);

  if (loading && !data) {
    return <LoadingBlock label="Assembling your LeetCode workspace..." />;
  }

  if (error && !data) {
    return <ErrorBlock message={error} onRetry={fetchFullData} />;
  }

  const renderActiveTab = () => {
    if (activeTab === 'focus') {
      return <OverviewTab data={data} triggerTabChange={setActiveTab} triggerSync={triggerSync} syncing={syncing} />;
    }
    if (activeTab === 'queue') {
      return <DailyQueueTab data={data} fetchAll={fetchFullData} />;
    }
    if (activeTab === 'striver') {
      return <StriverSheetTab data={data} fetchAll={fetchFullData} />;
    }
    if (activeTab === 'problems') {
      return <ProblemExplorerTab data={data} fetchAll={fetchFullData} />;
    }
    if (activeTab === 'insights') {
      return (
        <div className="space-y-6">
          <TopicTrackerTab data={data} />
          <AnalyticsTab data={data} />
          <HeatmapTab data={data} />
          <AchievementsTab data={data} />
        </div>
      );
    }
    if (activeTab === 'companies') {
      return <CompanySheetsTab data={data} />;
    }
    return <SyncSettingsTab data={data} fetchAll={fetchFullData} />;
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-100">
          {error}
        </div>
      )}

      <Panel className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
          <div className="p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                LeetCode Workspace
              </span>
              <span className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-300">
                <Flame size={11} /> {summary.streak} day streak
              </span>
            </div>
            <div className="mt-4 max-w-3xl">
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">What should I solve next?</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Start with the daily queue, close weak topics, then keep Striver and company preparation moving without leaving this workspace.
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { icon: CheckCircle2, label: 'Solved', value: summary.solved, detail: `${summary.trackedSolved} tracked` },
                { icon: TrendingUp, label: 'Readiness', value: `${summary.readiness}%`, detail: 'Placement index' },
                { icon: ListChecks, label: 'Weakest Topic', value: summary.weakestTopic?.topic || 'Clear', detail: summary.weakestTopic ? `${summary.weakestTopic.completionPercentage}% complete` : 'No urgent gap' },
                { icon: Zap, label: 'XP', value: summary.xp, detail: `Level ${Math.floor(summary.xp / 100) + 1}` }
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      <Icon size={13} className="text-primary" />
                      {metric.label}
                    </div>
                    <p className="mt-2 truncate text-lg font-black text-white">{metric.value}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{metric.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-800 bg-slate-950/30 p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Placement Readiness</p>
                <p className="mt-1 text-3xl font-black text-white">{summary.readiness}%</p>
              </div>
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-primary/40 hover:text-white disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing' : 'Sync'}
              </button>
            </div>
            <div className="mt-4">
              <ProgressBar value={summary.readiness} />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
              <p className="text-xs font-bold text-slate-300">Best next move</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {summary.weakestTopic
                  ? `Solve one ${summary.weakestTopic.topic} problem, then revise anything due today.`
                  : 'Open the daily queue and keep the streak warm.'}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="p-5 md:p-6">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark dark:text-primary-light">Solved trend</p>
            <h2 className="mt-1 text-lg font-black text-white">Problems solved over the last 30 days</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500">{summary.solved} total solved</p>
        </div>
        <SageLineChart data={solvedTrend} height={210} valueLabel="Problems solved" showYAxis compact />
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <Panel className="p-2">
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex min-w-[132px] items-center gap-3 rounded-xl border px-3 py-3 text-left transition lg:min-w-0 ${
                    active
                      ? 'border-primary/30 bg-primary/15 text-white'
                      : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-950/30 hover:text-white'
                  }`}
                >
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary text-white' : 'bg-slate-950 text-slate-500'}`}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold">{item.label}</span>
                    <span className="hidden truncate text-[10px] text-slate-500 lg:block">{item.description}</span>
                  </span>
                  {active && <ChevronRight size={14} className="hidden text-white/70 lg:block" />}
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="min-w-0">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default LeetcodeModule;
