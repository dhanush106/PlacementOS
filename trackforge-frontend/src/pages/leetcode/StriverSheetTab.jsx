import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api.js';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Star, Edit, Check } from 'lucide-react';
import ProblemModal from './components/ProblemModal.jsx';

const STRIVER_STEPS = [
  { step: 1, name: 'Step 1: Learn the Basics (Sorting, Recursion)' },
  { step: 2, name: 'Step 2: Arrays (Basics to Hard, Matrix)' },
  { step: 3, name: 'Step 3: Binary Search (1D, 2D, Answers)' },
  { step: 4, name: 'Step 4: Strings (Basics, Substrings, Window)' },
  { step: 5, name: 'Step 5: Linked List (Single, Double, Hard)' },
  { step: 6, name: 'Step 6: Stack & Queue (Monotonic, Expressions)' },
  { step: 7, name: 'Step 7: Greedy Algorithms (Intervals, Scheduling)' },
  { step: 8, name: 'Step 8: Recursion & Backtracking (Combinations, Boards)' },
  { step: 9, name: 'Step 9: Binary Trees & BST (Traversals, LCA)' },
  { step: 10, name: 'Step 10: Heaps (K-way, Median)' },
  { step: 11, name: 'Step 11: Graphs (BFS/DFS, Topological, Paths, DSU)' },
  { step: 12, name: 'Step 12: Dynamic Programming (1D, 2D, Strings, MCM)' },
  { step: 13, name: 'Step 13: Tries (Prefix, XOR)' },
  { step: 14, name: 'Step 14: Bit Manipulation' },
  { step: 15, name: 'Step 15: Math & Geometry' },
  { step: 16, name: 'Step 16: Sliding Window & Two Pointers' },
  { step: 17, name: 'Step 17: Hashing & Sets' }
];

const StriverSheetTab = ({ data, fetchAll }) => {
  const [striverProblems, setStriverProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState({ 1: true });
  
  // Edit problem details
  const [showModal, setShowModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const fetchStriverSheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leetcode/striver-sheet');
      setStriverProblems(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStriverSheet();
  }, [fetchStriverSheet, data]);

  const toggleStep = (step) => {
    setExpandedSteps(prev => ({ ...prev, [step]: !prev[step] }));
  };

  const handleMarkSolved = async (prob) => {
    try {
      if (prob.dbId) {
        // Toggle solved
        const isSolved = prob.status === 'Solved' || prob.status === 'Revised';
        await api.patch(`/leetcode/problems/${prob.dbId}`, { status: isSolved ? 'Attempted' : 'Solved' });
      } else {
        // Log a new solution
        const payload = {
          title: prob.title,
          problemNumber: prob.problemNumber,
          difficulty: prob.difficulty,
          topic: prob.topic,
          subtopic: prob.subtopic,
          pattern: prob.pattern,
          companyTags: prob.companyTags,
          striverSheetId: prob.id,
          striverStep: prob.step,
          striverSection: prob.section,
          status: 'Solved',
          link: prob.link
        };
        await api.post('/leetcode/problems', payload);
      }
      await fetchStriverSheet();
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (prob) => {
    if (prob.dbId) {
      // Find the database record info
      setSelectedProblem({ _id: prob.dbId, ...prob });
    } else {
      setSelectedProblem(prob);
    }
    setShowModal(true);
  };

  const handleSaveModal = async (payload) => {
    try {
      if (selectedProblem?._id) {
        await api.patch(`/leetcode/problems/${selectedProblem._id}`, payload);
      } else {
        await api.post('/leetcode/problems', { ...payload, striverSheetId: selectedProblem.id, striverStep: selectedProblem.step, striverSection: selectedProblem.section });
      }
      setShowModal(false);
      setSelectedProblem(null);
      await fetchStriverSheet();
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const getDifficultyColor = (diff) => {
    const map = {
      Easy: 'text-emerald-400',
      Medium: 'text-amber-405 text-amber-400',
      Hard: 'text-red-400'
    };
    return map[diff] || 'text-slate-400';
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="border-b border-slate-850 pb-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <BookOpen size={18} className="text-primary" /> Striver A2Z DSA Roadmap
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Complete step-by-step curated lists targeting all structural concepts for technical rounds.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {STRIVER_STEPS.map(stepObj => {
            const stepProblems = striverProblems.filter(p => p.step === stepObj.step);
            const solvedCount = stepProblems.filter(p => p.status === 'Solved' || p.status === 'Revised').length;
            const expanded = expandedSteps[stepObj.step];
            const pct = stepProblems.length > 0 ? Math.round((solvedCount / stepProblems.length) * 100) : 0;

            return (
              <div key={stepObj.step} className="bg-slate-950/20 border border-slate-850 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleStep(stepObj.step)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/20 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">{stepObj.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{solvedCount}/{stepProblems.length} Solved ({pct}%)</span>
                    </div>
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                {expanded && (
                  <div className="p-3 border-t border-slate-850 bg-slate-950/40 space-y-1">
                    {stepProblems.map(p => {
                      const isSolved = p.status === 'Solved' || p.status === 'Revised';
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-900/40 border border-transparent hover:border-slate-850 transition group">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              onClick={() => handleMarkSolved(p)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition flex-shrink-0 ${
                                isSolved ? 'bg-primary border-primary text-white' : 'border-slate-700 bg-slate-950 hover:border-primary'
                              }`}
                            >
                              {isSolved && <Check size={10} />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${isSolved ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {p.problemNumber ? `${p.problemNumber}. ` : ''}{p.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-slate-500 uppercase">
                                <span className={getDifficultyColor(p.difficulty)}>{p.difficulty}</span>
                                <span>·</span>
                                <span>{p.subtopic}</span>
                                {p.pattern && (
                                  <>
                                    <span>·</span>
                                    <span className="text-indigo-400">{p.pattern}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {p.link && (
                              <a
                                href={p.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                                title="Solve on LeetCode"
                              >
                                <ExternalLink size={11} />
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                              title="Write notes/edit metadata"
                            >
                              <Edit size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ProblemModal
          problem={selectedProblem}
          onClose={() => { setShowModal(false); setSelectedProblem(null); }}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};

export default StriverSheetTab;
