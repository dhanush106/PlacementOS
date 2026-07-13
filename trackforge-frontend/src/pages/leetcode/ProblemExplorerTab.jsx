import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api.js';
import { Search, Plus, RefreshCw } from 'lucide-react';
import ProblemRow from './components/ProblemRow.jsx';
import ProblemModal from './components/ProblemModal.jsx';
import { EmptyState, LoadingBlock, Panel, SectionHeader } from './components/LeetcodeUI.jsx';

const TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Linked List', 'Stack', 'Queue', 'Binary Search',
  'Sliding Window', 'Prefix Sum', 'Two Pointers', 'Recursion', 'Backtracking', 'Trees',
  'BST', 'Heap', 'Graph', 'BFS / DFS', 'Union Find', 'Topological Sort', 'Shortest Path',
  'Trie', 'Greedy', 'Dynamic Programming', 'Bit Manipulation', 'Segment Tree',
  'Fenwick Tree', 'Monotonic Stack', 'Monotonic Queue', 'Math', 'Geometry'
];

const ProblemExplorerTab = ({ data, fetchAll }) => {
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const handleCreateOrUpdate = async (payload) => {
    try {
      if (selectedProblem) {
        await api.patch(`/leetcode/problems/${selectedProblem._id}`, payload);
      } else {
        await api.post('/leetcode/problems', payload);
      }
      setShowModal(false);
      setSelectedProblem(null);
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to save problem details.');
    }
  };

  const handleEdit = (prob) => {
    setSelectedProblem(prob);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this problem log?')) return;
    try {
      await api.delete(`/leetcode/problems/${id}`);
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFav = async (prob) => {
    try {
      await api.patch(`/leetcode/problems/${prob._id}`, { favorite: !prob.favorite });
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leetcode/problems?limit=500');
      setProblems(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProblems();
  }, [loadProblems, data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return problems.filter((p) => {
      const matchesSearch = !query ||
        (p.title || '').toLowerCase().includes(query) ||
        (p.topic || '').toLowerCase().includes(query) ||
        (p.pattern || '').toLowerCase().includes(query);

      const matchesDiff = filterDiff === 'all' || p.difficulty === filterDiff;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesTopic = filterTopic === 'all' || (p.topic || '').toLowerCase() === filterTopic.toLowerCase();

      return matchesSearch && matchesDiff && matchesStatus && matchesTopic;
    });
  }, [filterDiff, filterStatus, filterTopic, problems, search]);

  return (
    <Panel className="space-y-5 p-5">
      <SectionHeader
        title="Problem Explorer"
        description="Search, update, and manage your logged DSA questions."
        action={
          <button
            onClick={() => { setSelectedProblem(null); setShowModal(true); }}
            className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-dark"
          >
            <Plus size={14} /> Log problem
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-950/20 p-3 rounded-2xl border border-slate-850">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search problems, topics, patterns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={filterDiff}
          onChange={e => setFilterDiff(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-350 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-350 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Attempted">Attempted</option>
          <option value="Solved">Solved</option>
          <option value="Revised">Revised</option>
          <option value="Bookmarked">Bookmarked</option>
          <option value="Skipped">Skipped</option>
        </select>

        <select
          value={filterTopic}
          onChange={e => setFilterTopic(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-350 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="all">All Topics</option>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <button
          onClick={loadProblems}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <LoadingBlock label="Loading logged problems..." />
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(p => (
            <ProblemRow
              key={p._id}
              problem={p}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFav={handleToggleFav}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No problems matched filters"
          description="Refine your search parameters or log a new question."
          action={
            <button
              onClick={() => { setSelectedProblem(null); setShowModal(true); }}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-dark"
            >
              Log problem
            </button>
          }
        />
      )}

      {showModal && (
        <ProblemModal
          problem={selectedProblem}
          onClose={() => { setShowModal(false); setSelectedProblem(null); }}
          onSave={handleCreateOrUpdate}
        />
      )}
    </Panel>
  );
};

export default ProblemExplorerTab;
