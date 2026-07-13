import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Linked List', 'Stack', 'Queue', 'Binary Search',
  'Sliding Window', 'Prefix Sum', 'Two Pointers', 'Recursion', 'Backtracking', 'Trees',
  'BST', 'Heap', 'Graph', 'BFS / DFS', 'Union Find', 'Topological Sort', 'Shortest Path',
  'Trie', 'Greedy', 'Dynamic Programming', 'Bit Manipulation', 'Segment Tree',
  'Fenwick Tree', 'Monotonic Stack', 'Monotonic Queue', 'Math', 'Geometry'
];

const PATTERNS = [
  'Sliding Window', 'Two Pointers', 'Binary Search', 'Prefix Sum', 'Greedy',
  'Dynamic Programming', 'Graph', 'DFS', 'BFS', 'Heap', 'Trie', 'Backtracking',
  'Bit Manipulation', 'Union Find'
];

const ProblemModal = ({ problem, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '', problemNumber: '', difficulty: 'Medium', topic: 'Arrays',
    subtopic: '', pattern: '', companyTags: '', status: 'Solved',
    estimatedTime: '', actualTime: '', notes: '', link: '', favorite: false,
    approach: '', mistakes: '', timeComplexity: '', spaceComplexity: '',
    codeSnippet: '', revisionTips: '', importantPatterns: ''
  });

  useEffect(() => {
    if (problem) {
      setForm({
        title: problem.title || '',
        problemNumber: problem.problemNumber || '',
        difficulty: problem.difficulty || 'Medium',
        topic: problem.topic || 'Arrays',
        subtopic: problem.subtopic || '',
        pattern: problem.pattern || '',
        companyTags: Array.isArray(problem.companyTags) ? problem.companyTags.join(', ') : (problem.companyTags || ''),
        status: problem.status || 'Solved',
        estimatedTime: problem.estimatedTime || '',
        actualTime: problem.actualTime || '',
        notes: problem.notes || '',
        link: problem.link || '',
        favorite: problem.favorite || false,
        approach: problem.approach || '',
        mistakes: problem.mistakes || '',
        timeComplexity: problem.timeComplexity || '',
        spaceComplexity: problem.spaceComplexity || '',
        codeSnippet: problem.codeSnippet || '',
        revisionTips: problem.revisionTips || '',
        importantPatterns: problem.importantPatterns || ''
      });
    }
  }, [problem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    // Parse tags to array
    const tagsArr = form.companyTags
      ? form.companyTags.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    onSave({
      ...form,
      problemNumber: form.problemNumber ? parseInt(form.problemNumber) : undefined,
      estimatedTime: form.estimatedTime ? parseInt(form.estimatedTime) : 0,
      actualTime: form.actualTime ? parseInt(form.actualTime) : 0,
      companyTags: tagsArr
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <h3 className="text-base font-extrabold text-white">
            {problem ? '✏️ Log Details / Edit Problem' : '➕ Log Custom Problem'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-850 rounded-xl transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-400">Problem Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Problem #</label>
              <input
                type="number"
                value={form.problemNumber}
                onChange={e => setForm(p => ({ ...p, problemNumber: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-855 border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="Easy">🟢 Easy</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Hard">🔴 Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="Not Started">Not Started</option>
                <option value="Attempted">Attempted</option>
                <option value="Solved">Solved</option>
                <option value="Revised">Revised</option>
                <option value="Bookmarked">Bookmarked</option>
                <option value="Skipped">Skipped</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Topic</label>
              <select
                value={form.topic}
                onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Pattern</label>
              <select
                value={form.pattern}
                onChange={e => setForm(p => ({ ...p, pattern: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="">None</option>
                {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Subtopic</label>
              <input
                type="text"
                placeholder="e.g. Dutch National Flag"
                value={form.subtopic}
                onChange={e => setForm(p => ({ ...p, subtopic: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Company Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Google, Amazon, Uber"
                value={form.companyTags}
                onChange={e => setForm(p => ({ ...p, companyTags: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Est. Time (mins)</label>
              <input
                type="number"
                value={form.estimatedTime}
                onChange={e => setForm(p => ({ ...p, estimatedTime: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Actual Time (mins)</label>
              <input
                type="number"
                value={form.actualTime}
                onChange={e => setForm(p => ({ ...p, actualTime: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">LeetCode Link</label>
            <input
              type="url"
              placeholder="https://leetcode.com/problems/..."
              value={form.link}
              onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
            />
          </div>

          {/* Detailed Notes Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Optimal Approach Notes</label>
              <textarea
                value={form.approach}
                onChange={e => setForm(p => ({ ...p, approach: e.target.value }))}
                rows={3}
                placeholder="Describe optimized approaches (e.g. Binary Search, DP states)..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Mistakes & Revision Tips</label>
              <textarea
                value={form.mistakes}
                onChange={e => setForm(p => ({ ...p, mistakes: e.target.value }))}
                rows={3}
                placeholder="Mistakes made, edge cases, or pointers for revision..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Time Complexity</label>
              <input
                type="text"
                placeholder="e.g. O(N log N)"
                value={form.timeComplexity}
                onChange={e => setForm(p => ({ ...p, timeComplexity: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Space Complexity</label>
              <input
                type="text"
                placeholder="e.g. O(N)"
                value={form.spaceComplexity}
                onChange={e => setForm(p => ({ ...p, spaceComplexity: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Code Snippet (Reference)</label>
            <textarea
              value={form.codeSnippet}
              onChange={e => setForm(p => ({ ...p, codeSnippet: e.target.value }))}
              rows={4}
              placeholder="Paste clean C++/Java/Python solution code snippet..."
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-850 hover:bg-slate-850 text-slate-400 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition"
            >
              {problem ? 'Save Details' : 'Log Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProblemModal;
