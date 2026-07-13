import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { ExternalLink, RefreshCw, Target, X } from 'lucide-react';
import { EmptyState, LoadingBlock, Panel, SectionHeader } from './components/LeetcodeUI.jsx';

const getDifficultyBadge = (difficulty) => {
  const styles = {
    Easy: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    Medium: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    Hard: 'bg-red-500/10 border-red-500/20 text-red-400'
  };
  return styles[difficulty] || 'bg-slate-500/10 border-slate-500/20 text-slate-400';
};

const DailyQueueTab = ({ fetchAll }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solvingId, setSolvingId] = useState(null);
  const [solveDraft, setSolveDraft] = useState(null);
  const [actualTime, setActualTime] = useState(25);

  const fetchDailyQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leetcode/daily-recommendations');
      setQueue(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyQueue();
  }, [fetchDailyQueue]);

  const openSolveDialog = (item) => {
    setSolveDraft(item);
    setActualTime(item.problem?.estimatedTime || 25);
  };

  const handleSolveProblem = async () => {
    if (!solveDraft) return;

    const p = solveDraft.problem;
    setSolvingId(p.problemNumber || p.title);

    try {
      await api.post('/leetcode/problems', {
        title: p.title,
        problemNumber: p.problemNumber,
        difficulty: p.difficulty,
        topic: p.topic,
        subtopic: p.subtopic,
        pattern: p.pattern,
        companyTags: p.companyTags,
        striverSheetId: p.striverSheetId,
        striverStep: p.striverStep,
        striverSection: p.striverSection,
        status: 'Solved',
        actualTime: parseInt(actualTime) || 25,
        link: p.link
      });

      setSolveDraft(null);
      await fetchDailyQueue();
      await fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSolvingId(null);
    }
  };

  return (
    <Panel className="space-y-5 p-5">
      <SectionHeader
        eyebrow="Solve next"
        title="Smart Daily Queue"
        description="Generated from weak topics, due revisions, target companies, and roadmap progress."
        action={
          <button
            onClick={fetchDailyQueue}
            disabled={loading}
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-2 text-slate-400 transition hover:text-white disabled:opacity-50"
            title="Refresh queue"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {loading ? (
        <LoadingBlock label="Building today's queue..." />
      ) : queue.length > 0 ? (
        <div className="space-y-3">
          {queue.map((item, index) => {
            const p = item.problem;
            const currentId = p.problemNumber || p.title;

            return (
              <article key={`${currentId}-${index}`} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 transition hover:border-slate-700 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {item.reason}
                    </span>
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getDifficultyBadge(p.difficulty)}`}>
                      {p.difficulty}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold leading-snug text-white">
                    {p.problemNumber ? `#${p.problemNumber} ` : ''}{p.title}
                  </h3>
                  <p className="text-[10px] font-semibold uppercase text-slate-500">
                    {p.topic} / {p.subtopic || 'General'} / Pattern: {p.pattern || 'None'}
                  </p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-700 hover:text-white"
                    >
                      Solve <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    onClick={() => openSolveDialog(item)}
                    disabled={solvingId !== null}
                    className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-50"
                  >
                    {solvingId === currentId ? 'Saving...' : 'Mark solved'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="Queue is empty"
          description="Configure chosen topics or sync your LeetCode profile to generate targets."
        />
      )}

      {solveDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Mark solved</p>
                <h3 className="mt-1 text-base font-extrabold text-white">{solveDraft.problem.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{solveDraft.problem.topic} / {solveDraft.problem.difficulty}</p>
              </div>
              <button onClick={() => setSolveDraft(null)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <label className="mt-5 block text-xs font-bold text-slate-400">Actual time spent</label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="300"
                value={actualTime}
                onChange={(event) => setActualTime(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-bold text-white focus:border-primary focus:outline-none"
              />
              <span className="text-xs font-semibold text-slate-500">minutes</span>
            </div>

            <div className="mt-5 flex gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setSolveDraft(null)}
                className="flex-1 rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSolveProblem}
                disabled={solvingId !== null}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {solvingId ? 'Saving...' : 'Save solved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};

export default DailyQueueTab;
