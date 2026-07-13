import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api.js';
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const RevisionTab = ({ data, fetchAll }) => {
  const [revisionList, setRevisionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revisingId, setRevisingId] = useState(null);

  const fetchRevisionQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leetcode/revision-queue');
      setRevisionList(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevisionQueue();
  }, [fetchRevisionQueue, data]);

  const handleMarkRevised = async (id) => {
    const confidence = prompt('Enter revision confidence (1 to 5 stars, where 5 is maximum confidence):', '4');
    if (confidence === null) return;
    
    const parsed = parseInt(confidence);
    if (isNaN(parsed) || parsed < 1 || parsed > 5) {
      alert('Please enter a valid rating between 1 and 5.');
      return;
    }

    setRevisingId(id);
    try {
      await api.post(`/leetcode/problems/${id}/revise`, { confidence: parsed });
      alert('Revision logged! Scheduling next spaced repetition cycle.');
      await fetchRevisionQueue();
      await fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setRevisingId(null);
    }
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <RefreshCw size={16} className="text-violet-400" /> Spaced Repetition Revision Planner
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Questions due for revision today based on progressive Day 1, 3, 7, 15, 30, 60, 90 targets.
          </p>
        </div>
        <button
          onClick={fetchRevisionQueue}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/40 border border-slate-850 transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : revisionList.length > 0 ? (
        <div className="space-y-3">
          {revisionList.map(p => (
            <div key={p._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded uppercase">
                    Revision step: {p.revisedCount || 0}/7
                  </span>
                  {p.nextRevisionDate && (
                    <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                      <Clock size={9} /> Due: {new Date(p.nextRevisionDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-black text-slate-200">
                  {p.problemNumber ? `#${p.problemNumber} ` : ''}{p.title}
                </h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase">{p.topic} · {p.subtopic}</p>
              </div>

              <div className="flex items-center gap-2">
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-400 hover:text-white transition"
                  >
                    Solve
                  </a>
                )}
                <button
                  onClick={() => handleMarkRevised(p._id)}
                  disabled={revisingId !== null}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-[10px] font-bold text-white shadow shadow-primary/25 transition disabled:opacity-50"
                >
                  {revisingId === p._id ? 'Saving...' : 'Mark Revised'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl">
          <CheckCircle2 size={36} className="text-emerald-500/40 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">All caught up!</p>
          <p className="text-slate-500 text-xs mt-1">No questions are due for revision today.</p>
        </div>
      )}
    </div>
  );
};

export default RevisionTab;
