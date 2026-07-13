import React, { useMemo } from 'react';
import {
  AlertCircle, Award, BarChart2, BookOpen, CheckCircle2,
  Clock, Flame, RefreshCw, Target, Zap
} from 'lucide-react';
import { MetricTile, Panel, ProgressBar, SectionHeader } from './components/LeetcodeUI.jsx';

const OverviewTab = ({ data, triggerTabChange, triggerSync, syncing }) => {
  const { overview = {}, topicTracker = [], companySheets = [], placementReadinessScore = 0, productivity = {} } = data || {};

  const focusModel = useMemo(() => {
    const weakestTopics = [...topicTracker]
      .filter((topic) => topic.solvedProblems < topic.targetProblems)
      .sort((a, b) => a.completionPercentage - b.completionPercentage)
      .slice(0, 4);

    const companies = [...companySheets]
      .sort((a, b) => b.readinessScore - a.readinessScore)
      .slice(0, 3);

    const solvedTotal = overview.totalSolved || 0;
    const trackedSolved = overview.trackedSolved || 0;
    const targetDaily = productivity.avgDailyProblems || 0;

    return {
      weakestTopics,
      companies,
      solvedTotal,
      trackedSolved,
      dailyPace: targetDaily ? `${targetDaily}/day` : 'Not set',
      readiness: Math.max(0, Math.min(100, Number(placementReadinessScore) || 0)),
      studyHours: Math.round(((overview.avgTimePerProblem || 0) * trackedSolved) / 60)
    };
  }, [companySheets, overview, placementReadinessScore, productivity, topicTracker]);

  const primaryTopic = focusModel.weakestTopics[0];

  return (
    <div className="space-y-5">
      <Panel>
        <SectionHeader
          eyebrow="Today"
          title="Recommended operating plan"
          description="A compact path through solve, revise, and roadmap progress."
          action={
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-primary/40 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Sync profile
            </button>
          }
        />

        <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Best next problem</p>
                <h3 className="mt-2 text-xl font-black text-white">
                  {primaryTopic ? `Practice ${primaryTopic.topic}` : 'Open your daily queue'}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  {primaryTopic
                    ? `${primaryTopic.topic} is at ${primaryTopic.completionPercentage}% against target. One focused solve here moves placement readiness more than another random easy problem.`
                    : 'No weak topic is currently flagged. Use the daily queue to keep momentum and preserve your streak.'}
                </p>
              </div>
              <div className="hidden rounded-2xl border border-primary/20 bg-slate-950/40 p-3 text-center sm:block">
                <p className="text-2xl font-black text-white">{focusModel.readiness}%</p>
                <p className="text-[10px] font-bold uppercase text-slate-500">Ready</p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button
                onClick={() => triggerTabChange('queue')}
                className="rounded-xl bg-primary px-4 py-3 text-left text-xs font-extrabold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark"
              >
                Solve daily queue
              </button>
              <button
                onClick={() => triggerTabChange('striver')}
                className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-left text-xs font-extrabold text-slate-200 transition hover:border-primary/40 hover:text-white"
              >
                Continue Striver
              </button>
              <button
                onClick={() => triggerTabChange('insights')}
                className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-left text-xs font-extrabold text-slate-200 transition hover:border-primary/40 hover:text-white"
              >
                Review weak topics
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricTile icon={CheckCircle2} label="Solved" value={focusModel.solvedTotal} detail={`${focusModel.trackedSolved} tracked`} color="text-emerald-400" />
            <MetricTile icon={Flame} label="Streak" value={`${overview.streak?.current || 0}d`} detail={`Best ${overview.streak?.longest || 0}d`} color="text-orange-400" />
            <MetricTile icon={Clock} label="Study Time" value={`${focusModel.studyHours}h`} detail={`${overview.avgTimePerProblem || 0}m/problem`} color="text-blue-400" />
            <MetricTile icon={Zap} label="XP" value={overview.leetcodeXP || 0} detail={`Level ${Math.floor((overview.leetcodeXP || 0) / 100) + 1}`} color="text-amber-400" />
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionHeader
            title="Weak topics"
            description="Sorted by lowest completion against placement targets."
            action={
              <button onClick={() => triggerTabChange('insights')} className="text-xs font-bold text-primary hover:text-white">
                View insights
              </button>
            }
          />
          <div className="space-y-3 p-5">
            {focusModel.weakestTopics.length > 0 ? focusModel.weakestTopics.map((topic) => (
              <button
                key={topic.topic}
                onClick={() => triggerTabChange('queue')}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-left transition hover:border-primary/30 hover:bg-slate-950/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-200">{topic.topic}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {topic.solvedProblems}/{topic.targetProblems} solved · confidence {topic.confidenceScore}/5
                    </p>
                  </div>
                  <p className="text-sm font-black text-amber-400">{topic.completionPercentage}%</p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={topic.completionPercentage} className="bg-amber-400" />
                </div>
              </button>
            )) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6 text-center">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-bold text-slate-300">No weak topics detected</p>
                <p className="mt-1 text-xs text-slate-500">Keep solving from the daily queue to maintain coverage.</p>
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            title="Placement targets"
            description="Company readiness and roadmap signals."
            action={
              <button onClick={() => triggerTabChange('companies')} className="text-xs font-bold text-primary hover:text-white">
                View companies
              </button>
            }
          />
          <div className="space-y-4 p-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-300">Placement readiness</p>
                  <p className="mt-1 text-[10px] text-slate-500">Topics, difficulty balance, streak, and revision health</p>
                </div>
                <p className="text-lg font-black text-white">{focusModel.readiness}%</p>
              </div>
              <div className="mt-3">
                <ProgressBar value={focusModel.readiness} />
              </div>
            </div>

            {focusModel.companies.length > 0 ? focusModel.companies.map((company) => (
              <div key={company.company} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-200">{company.company}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {company.solved}/{company.totalTaggedProblems} tagged solved
                    </p>
                  </div>
                  <p className="text-sm font-black text-violet-400">{company.readinessScore}%</p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={company.progressPercentage} className="bg-violet-400" />
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6 text-center">
                <Award size={28} className="mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-bold text-slate-300">No company signals yet</p>
                <p className="mt-1 text-xs text-slate-500">Log company tags on problems to build readiness.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default OverviewTab;
