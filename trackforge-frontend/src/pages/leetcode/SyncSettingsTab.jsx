import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { Settings, Check } from 'lucide-react';

const TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Linked List', 'Stack', 'Queue', 'Binary Search',
  'Sliding Window', 'Prefix Sum', 'Two Pointers', 'Recursion', 'Backtracking', 'Trees',
  'BST', 'Heap', 'Graph', 'BFS / DFS', 'Union Find', 'Topological Sort', 'Shortest Path',
  'Trie', 'Greedy', 'Dynamic Programming', 'Bit Manipulation', 'Segment Tree',
  'Fenwick Tree', 'Monotonic Stack', 'Monotonic Queue', 'Math', 'Geometry'
];

const SyncSettingsTab = ({ data, fetchAll }) => {
  const [username, setUsername] = useState('');
  const [chosenTopics, setChosenTopics] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(7);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        const user = res.data.data;
        if (user) {
          setUsername(user.leetcodeUsername || '');
          setChosenTopics(user.chosenLeetcodeTopics || []);
          setDailyGoal(user.leetcodeDailyGoal || 7);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, [data]);

  const handleToggleTopic = (topic) => {
    if (chosenTopics.includes(topic)) {
      setChosenTopics(prev => prev.filter(t => t !== topic));
    } else {
      setChosenTopics(prev => [...prev, topic]);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save chosen topics list
      await api.post('/leetcode/chosen-topics', { chosenTopics });

      await api.patch('/users/profile', {
        leetcodeUsername: username.trim(),
        leetcodeDailyGoal: parseInt(dailyGoal) || 7
      });

      if (username.trim()) {
        await api.post('/leetcode/sync', { username: username.trim() });
      }
      alert('Settings saved. LeetCode sync will import accepted submissions from today onward.');
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to save configuration settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="border-b border-slate-850 pb-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Settings size={18} className="text-primary" /> LeetCode Configuration & Profile Sync Settings
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Configure LeetCode syncing, daily recommendation target topics, and custom goals.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">LeetCode Username</label>
            <input
              type="text"
              placeholder="e.g. lc_user123"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Daily Solved Goal</label>
            <input
              type="number"
              min="1"
              max="50"
              value={dailyGoal}
              onChange={e => setDailyGoal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Multi-Select Recommendation Topics */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400">Target Recommendation Topics</label>
          <p className="text-[10px] text-slate-500">Pick topics that you want daily random recommendations for.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 bg-slate-950/20 border border-slate-850 p-4 rounded-2xl max-h-48 overflow-y-auto">
            {TOPICS.map(t => {
              const active = chosenTopics.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleToggleTopic(t)}
                  className={`flex items-center justify-between text-left text-[11px] px-3 py-2 rounded-xl transition border ${
                    active
                      ? 'bg-primary/10 border-primary/20 text-primary font-bold'
                      : 'border-slate-900 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <span>{t}</span>
                  {active && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-850 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-xs font-bold text-white rounded-xl shadow shadow-primary/25 transition disabled:opacity-50"
          >
            {saving ? 'Saving Config...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SyncSettingsTab;
