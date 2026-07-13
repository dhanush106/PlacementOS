import React, { useState } from 'react';
import { TrendingUp, Star, Clock, AlertTriangle, BookOpen, ChevronRight, X } from 'lucide-react';
import ProgressRing from './components/ProgressRing.jsx';

const TopicTrackerTab = ({ data }) => {
  const { topicTracker = [] } = data || {};
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Sort: highest target first or lowest completion rate first
  const sortedTopics = [...topicTracker].sort((a, b) => b.targetProblems - a.targetProblems);

  const getConfidenceColor = (score) => {
    if (score >= 4) return 'text-emerald-400';
    if (score >= 2.5) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6">
        <div className="border-b border-slate-850 pb-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> DSA Topic Mastery Tracker
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Analyze target completion, confidence indexes, and average solving time across all algorithmic categories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {sortedTopics.map((t, idx) => {
            const isWeak = t.weaknessIndicator;
            return (
              <div
                key={idx}
                onClick={() => setSelectedTopic(t)}
                className="bg-slate-950/30 border border-slate-850 hover:border-slate-750 transition rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden group"
              >
                {isWeak && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-bl" title="Weak Area - Needs practice!" />
                )}
                
                <div className="space-y-2 flex-1 min-w-0">
                  <div>
                    <h4 className="text-xs font-black text-slate-200 group-hover:text-primary transition truncate">{t.topic}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Target: {t.targetProblems} Problems</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${getConfidenceColor(t.confidenceScore)}`}>
                      <Star size={10} className="fill-current" /> {t.confidenceScore} Conf
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5 font-bold">
                      <Clock size={10} /> {t.avgSolvingTime || 0}m
                    </span>
                  </div>

                  {/* E/M/H breakdown mini bar */}
                  <div className="flex gap-0.5 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="bg-emerald-500" style={{ width: `${(t.easySolved / (t.solvedProblems || 1)) * 100}%` }} />
                    <div className="bg-amber-500" style={{ width: `${(t.mediumSolved / (t.solvedProblems || 1)) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(t.hardSolved / (t.solvedProblems || 1)) * 100}%` }} />
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <ProgressRing radius={22} stroke={3.5} progress={t.completionPercentage} color="#6366f1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic Detail Drilldown Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedTopic.topic} Detail Analytics</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Topic Metrics</p>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="p-1 hover:bg-slate-850 rounded-xl transition text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Solved / Target</p>
                <p className="text-lg font-black text-white mt-1">{selectedTopic.solvedProblems} / {selectedTopic.targetProblems}</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Confidence Score</p>
                <p className={`text-lg font-black mt-1 ${getConfidenceColor(selectedTopic.confidenceScore)}`}>{selectedTopic.confidenceScore} / 5</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg Solve Time</p>
                <p className="text-lg font-black text-white mt-1">{selectedTopic.avgSolvingTime} mins</p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950/30 border border-slate-850 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-300">Difficulty Breakdown</p>
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Easy Solved</span>
                <span className="font-extrabold text-white">{selectedTopic.easySolved}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium Solved</span>
                <span className="font-extrabold text-white">{selectedTopic.mediumSolved}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Hard Solved</span>
                <span className="font-extrabold text-white">{selectedTopic.hardSolved}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTopic(null)}
                className="flex-1 py-2 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicTrackerTab;
