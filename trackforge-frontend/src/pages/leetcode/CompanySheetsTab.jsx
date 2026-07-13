import React, { useState } from 'react';
import { Award, Star, TrendingUp, CheckCircle, ChevronRight, X } from 'lucide-react';
import ProgressRing from './components/ProgressRing.jsx';

const CompanySheetsTab = ({ data }) => {
  const { companySheets = [] } = data || {};
  const [selectedCompany, setSelectedCompany] = useState(null);

  const getReadinessBadge = (score) => {
    if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6">
        <div className="border-b border-slate-850 pb-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Award size={18} className="text-primary" /> Target Companies Readiness sheets
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Track solved problems tagged to top placement recruiters and evaluate your custom company readiness index.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {companySheets.map((c, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedCompany(c)}
              className="bg-slate-950/30 border border-slate-850 hover:border-slate-750 transition rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <h4 className="text-xs font-black text-slate-200 group-hover:text-primary transition">{c.company}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{c.solved} / {c.totalTaggedProblems} Solved</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] border font-bold px-2 py-0.5 rounded uppercase ${getReadinessBadge(c.readinessScore)}`}>
                    Readiness: {c.readinessScore}%
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <ProgressRing radius={22} stroke={3.5} progress={c.progressPercentage} color="#8b5cf6" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drilldown modal details */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedCompany.company} Readiness details</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Company prep status</p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-1 hover:bg-slate-850 rounded-xl transition text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Solved Ratio</p>
                <p className="text-lg font-black text-white mt-1">{selectedCompany.solved} / {selectedCompany.totalTaggedProblems}</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Readiness Score</p>
                <p className="text-lg font-black text-violet-400 mt-1">{selectedCompany.readinessScore}%</p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950/30 border border-slate-850 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-300">Target Problem difficulty breakdown</p>
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Easy Tagged</span>
                <span className="font-extrabold text-white">{selectedCompany.difficultyDistribution?.Easy || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium Tagged</span>
                <span className="font-extrabold text-white">{selectedCompany.difficultyDistribution?.Medium || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Hard Tagged</span>
                <span className="font-extrabold text-white">{selectedCompany.difficultyDistribution?.Hard || 0}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCompany(null)}
                className="flex-1 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Close Sheets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySheetsTab;
