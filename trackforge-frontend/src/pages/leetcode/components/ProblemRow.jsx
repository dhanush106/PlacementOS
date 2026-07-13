import React from 'react';
import { Star, ExternalLink, Edit2, Trash2, Clock } from 'lucide-react';

const DIFF_CONFIG = {
  Easy:   { color: '#22c55e', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Medium: { color: '#f59e0b', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  Hard:   { color: '#ef4444', bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20'     },
};

const STATUS_CONFIG = {
  'Not Started': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  Attempted:     { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  Solved:        { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Revised:       { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20'  },
  Bookmarked:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20'    },
  Skipped:       { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20'    }
};

const ProblemRow = ({ problem, onEdit, onDelete, onToggleFav }) => {
  const dc = DIFF_CONFIG[problem.difficulty] || DIFF_CONFIG.Medium;
  const sc = STATUS_CONFIG[problem.status] || STATUS_CONFIG.Solved;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50 transition group">
      <span className="text-[10px] text-slate-600 font-mono w-8 flex-shrink-0 text-right">
        {problem.problemNumber || '—'}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-200 truncate">{problem.title}</span>
          {problem.favorite && <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
          {problem.link && (
            <a href={problem.link} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition flex-shrink-0">
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
          <span>{problem.topic}</span>
          {problem.subtopic && (
            <>
              <span>·</span>
              <span>{problem.subtopic}</span>
            </>
          )}
          {problem.pattern && (
            <>
              <span>·</span>
              <span className="text-indigo-400">{problem.pattern}</span>
            </>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${dc.bg} ${dc.text} ${dc.border}`}>
          {problem.difficulty}
        </span>
        <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${sc.bg} ${sc.text} ${sc.border}`}>
          {problem.status}
        </span>
        {problem.actualTime > 0 && (
          <span className="text-[9px] text-slate-500 flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-850">
            <Clock size={10} />{problem.actualTime}m
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => onToggleFav(problem)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-xl transition">
          <Star size={12} className={problem.favorite ? 'fill-amber-400 text-amber-400' : ''} />
        </button>
        <button onClick={() => onEdit(problem)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition">
          <Edit2 size={12} />
        </button>
        <button onClick={() => onDelete(problem._id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default ProblemRow;
