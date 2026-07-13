import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import {
  Plus, X, Edit2, Trash2, ChevronDown, ChevronRight,
  BookOpen, CheckCircle2, Clock, RefreshCw, Layers,
  Target, BarChart2, Zap, Star, Search, Calendar, Check,
  BookOpenCheck, AlertCircle, HelpCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'bg-slate-800 text-slate-400 border-slate-700', dot: 'bg-slate-500', fill: '#475569' },
  learning:    { label: 'Learning',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   dot: 'bg-blue-500',    fill: '#3b82f6' },
  revising:    { label: 'Revising',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500',  fill: '#f59e0b' },
  confident:   { label: 'Confident',   color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', fill: '#22c55e' },
};

const STATUS_ORDER = ['not_started', 'learning', 'revising', 'confident'];

const DEFAULT_SUBJECTS = [
  { name: 'Operating Systems', chapters: ['Process Management', 'Memory Management', 'File Systems', 'CPU Scheduling', 'Deadlocks'] },
  { name: 'Data Structures & Algorithms', chapters: ['Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Trees & Graphs', 'Dynamic Programming'] },
  { name: 'Database Management', chapters: ['ER Model', 'Relational Algebra', 'SQL Queries', 'Normalization', 'Transactions'] },
  { name: 'Computer Networks', chapters: ['OSI Model Layering', 'TCP/IP Protocol Suite', 'DNS & HTTP', 'Routing Protocols', 'Network Security'] },
];

// ─── Add Subject Modal ────────────────────────────────────────────────────────
const AddSubjectModal = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [chaptersRaw, setChaptersRaw] = useState('');
  const [useDefault, setUseDefault] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const chapters = chaptersRaw.split('\n').map(c => c.trim()).filter(Boolean).map(cname => ({
      name: cname,
      topics: []
    }));
    onSave({ name: name.trim(), chapters });
  };

  const handleDefaultSelect = (subj) => {
    setUseDefault(subj);
    setName(subj.name);
    setChaptersRaw(subj.chapters.join('\n'));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-white">📖 Add Subject</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"><X size={17} /></button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Templates</p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_SUBJECTS.map(s => (
              <button
                key={s.name}
                type="button"
                onClick={() => handleDefaultSelect(s)}
                className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition ${useDefault?.name === s.name ? 'bg-primary/10 border-primary/40 text-primary' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Subject Name *</label>
            <input
              type="text"
              placeholder="e.g. Operating Systems"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Chapters (one per line)</label>
            <textarea
              placeholder="Process Management&#10;Memory Management&#10;CPU Scheduling…"
              value={chaptersRaw}
              onChange={e => setChaptersRaw(e.target.value)}
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary resize-none font-mono"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-extrabold shadow shadow-primary/20 transition">Add Subject</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Status Cycle Button ──────────────────────────────────────────────────────
const StatusCycleBtn = ({ status, onChange }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % STATUS_ORDER.length];

  return (
    <button
      onClick={() => onChange(nextStatus)}
      className={`text-[10px] px-2 py-1 rounded-lg border font-bold uppercase tracking-wide transition hover:scale-105 ${cfg.color}`}
      title={`Cycle status to ${STATUS_CONFIG[nextStatus]?.label}`}
    >
      {cfg.label}
    </button>
  );
};

// ─── Subject Accordion Card (Chapters -> Topics -> Subtopics) ─────────────────
const SubjectCard = ({
  subject,
  onAddChapter,
  onDeleteChapter,
  onAddTopic,
  onDeleteTopic,
  onTopicStatusChange,
  onAddSubtopic,
  onToggleSubtopic,
  onDeleteSubtopic,
  onDeleteSubject
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeChapterInput, setActiveChapterInput] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  
  // Chapter-level topic insertion input trackers
  const [activeTopicInput, setActiveTopicInput] = useState(null); // chapterId
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Topic-level subtopic insertion input trackers
  const [activeSubtopicInput, setActiveSubtopicInput] = useState(null); // topicId
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');

  // Track expanded topics to show subtopics checklist & notes
  const [expandedTopics, setExpandedTopics] = useState([]);

  // Compute status distributions for Pie Chart
  let totalTopics = 0;
  const distribution = {
    not_started: 0,
    learning: 0,
    revising: 0,
    confident: 0
  };

  (subject.chapters || []).forEach(c => {
    (c.topics || []).forEach(t => {
      totalTopics++;
      if (distribution[t.status] !== undefined) {
        distribution[t.status]++;
      } else {
        distribution.not_started++;
      }
    });
  });

  const pieData = [
    { name: 'Confident', value: distribution.confident, color: STATUS_CONFIG.confident.fill },
    { name: 'Revising', value: distribution.revising, color: STATUS_CONFIG.revising.fill },
    { name: 'Learning', value: distribution.learning, color: STATUS_CONFIG.learning.fill },
    { name: 'Not Started', value: distribution.not_started, color: STATUS_CONFIG.not_started.fill }
  ].filter(d => d.value > 0);

  // If no topics exist, seed a full 100% Not Started slice so the chart looks nice
  if (pieData.length === 0) {
    pieData.push({ name: 'Empty', value: 1, color: '#1e293b' });
  }

  const handleAddChapterSubmit = (e) => {
    e.preventDefault();
    if (!newChapterName.trim()) return;
    onAddChapter(subject._id, newChapterName.trim());
    setNewChapterName('');
    setActiveChapterInput(false);
  };

  const handleAddTopicSubmit = (e, chapterId) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    onAddTopic(subject._id, chapterId, newTopicTitle.trim());
    setNewTopicTitle('');
    setActiveTopicInput(null);
  };

  const handleAddSubtopicSubmit = (e, chapterId, topicId) => {
    e.preventDefault();
    if (!newSubtopicTitle.trim()) return;
    onAddSubtopic(subject._id, chapterId, topicId, newSubtopicTitle.trim());
    setNewSubtopicTitle('');
    setActiveSubtopicInput(null);
  };

  const toggleTopicExpand = (topicId) => {
    setExpandedTopics(prev => prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]);
  };

  const overallProgress = totalTopics > 0 ? Math.round((distribution.confident / totalTopics) * 100) : 0;

  return (
    <div className="bg-slate-900/30 border border-slate-800 hover:border-slate-750/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm">
      {/* Subject summary row */}
      <div className="p-5 flex items-center justify-between gap-4">
        {/* Recharts Pie Chart in place of progress bar */}
        <div className="w-16 h-16 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={18} outerRadius={28}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-white">{overallProgress}%</span>
          </div>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-white text-base truncate">{subject.name}</p>
          <p className="text-xs text-slate-500 mt-1">
            {subject.chapters?.length || 0} chapters • {totalTopics} topics ({distribution.confident} confident)
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveChapterInput(!activeChapterInput)}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Add Chapter"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onDeleteSubject(subject._id)}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Delete Subject"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Inline Chapter Insertion Input */}
      {activeChapterInput && (
        <form onSubmit={handleAddChapterSubmit} className="px-5 pb-3 flex gap-2">
          <input
            type="text" autoFocus
            placeholder="New chapter name..."
            value={newChapterName}
            onChange={e => setNewChapterName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          />
          <button type="submit" className="px-3 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition">Add</button>
        </form>
      )}

      {/* Chapters Accordion */}
      {expanded && (
        <div className="border-t border-slate-850/60 bg-slate-950/20 px-5 py-4 space-y-4">
          {(subject.chapters || []).length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No chapters created yet. Click "+" above to add one.</p>
          ) : (
            subject.chapters.map(chapter => (
              <div key={chapter._id} className="border border-slate-850/80 bg-slate-900/10 rounded-xl p-3.5 space-y-3">
                
                {/* Chapter header */}
                <div className="flex justify-between items-center border-b border-slate-850/50 pb-2">
                  <p className="font-bold text-xs text-slate-200 uppercase tracking-wide">
                    📂 {chapter.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveTopicInput(activeTopicInput === chapter._id ? null : chapter._id)}
                      className="text-[10px] text-primary hover:text-white font-bold transition flex items-center gap-0.5"
                    >
                      + Add Topic
                    </button>
                    <button
                      onClick={() => onDeleteChapter(subject._id, chapter._id)}
                      className="p-1 text-slate-650 hover:text-red-400 rounded transition"
                      title="Delete Chapter"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Inline Topic input under Chapter */}
                {activeTopicInput === chapter._id && (
                  <form onSubmit={(e) => handleAddTopicSubmit(e, chapter._id)} className="flex gap-2 pb-2">
                    <input
                      type="text" autoFocus
                      placeholder="New topic title..."
                      value={newTopicTitle}
                      onChange={e => setNewTopicTitle(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                    <button type="submit" className="px-2.5 bg-primary text-white rounded-lg text-xs font-bold">Add</button>
                  </form>
                )}

                {/* Topics list */}
                <div className="space-y-2">
                  {(chapter.topics || []).length === 0 ? (
                    <p className="text-[11px] text-slate-650 italic py-1">No topics under this chapter.</p>
                  ) : (
                    chapter.topics.map(topic => {
                      const isTopicExpanded = expandedTopics.includes(topic._id);
                      const tcfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG.not_started;
                      const subtopicsCompleted = (topic.subtopics || []).filter(s => s.completed).length;
                      
                      return (
                        <div key={topic._id} className="bg-slate-950/20 border border-slate-850/40 rounded-lg p-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleTopicExpand(topic._id)}
                              className="text-slate-500 hover:text-white transition"
                            >
                              {isTopicExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                            
                            <span className={`text-xs flex-1 font-medium ${topic.status === 'confident' ? 'text-slate-500 line-through' : 'text-slate-350'}`}>
                              {topic.title}
                            </span>

                            {/* Subtopics completed ratio */}
                            {topic.subtopics?.length > 0 && (
                              <span className="text-[9px] text-slate-500 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded-md font-mono">
                                {subtopicsCompleted}/{topic.subtopics.length}
                              </span>
                            )}

                            {topic.nextReviewDate && topic.status === 'revising' && (
                              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                                Due: {new Date(topic.nextReviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}

                            <StatusCycleBtn
                              status={topic.status}
                              onChange={(ns) => onTopicStatusChange(subject._id, chapter._id, topic._id, ns)}
                            />

                            <button
                              onClick={() => onDeleteTopic(subject._id, chapter._id, topic._id)}
                              className="p-1 text-slate-650 hover:text-red-400 transition"
                            >
                              <X size={11} />
                            </button>
                          </div>

                          {/* Expanded details (Subtopics + notes) */}
                          {isTopicExpanded && (
                            <div className="pl-4 pt-2 border-t border-slate-900 space-y-2.5">
                              {/* Subtopics section */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subtopics checklist</p>
                                  <button
                                    onClick={() => setActiveSubtopicInput(activeSubtopicInput === topic._id ? null : topic._id)}
                                    className="text-[9px] text-primary hover:text-white font-bold transition"
                                  >
                                    + Add Subtopic
                                  </button>
                                </div>

                                {/* Add subtopic form */}
                                {activeSubtopicInput === topic._id && (
                                  <form onSubmit={(e) => handleAddSubtopicSubmit(e, chapter._id, topic._id)} className="flex gap-2 pt-1">
                                    <input
                                      type="text" autoFocus
                                      placeholder="Subtopic title..."
                                      value={newSubtopicTitle}
                                      onChange={e => setNewSubtopicTitle(e.target.value)}
                                      className="flex-1 bg-slate-950 border border-slate-850 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none"
                                    />
                                    <button type="submit" className="px-2 bg-primary text-white rounded text-[10px] font-bold">Add</button>
                                  </form>
                                )}

                                {/* Subtopics list */}
                                {(topic.subtopics || []).length === 0 ? (
                                  <p className="text-[10px] text-slate-650 italic">No subtopics added yet.</p>
                                ) : (
                                  <div className="space-y-1">
                                    {topic.subtopics.map(st => (
                                      <div key={st._id} className="flex items-center gap-2 group/sub">
                                        <button
                                          onClick={() => onToggleSubtopic(subject._id, chapter._id, topic._id, st._id, !st.completed)}
                                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${st.completed ? 'bg-emerald-500/20 border-emerald-500' : 'border-slate-800 hover:border-slate-700'}`}
                                        >
                                          {st.completed && <Check size={8} className="text-emerald-400" />}
                                        </button>
                                        <span className={`text-[11px] flex-1 ${st.completed ? 'line-through text-slate-500' : 'text-slate-400'}`}>
                                          {st.title}
                                        </span>
                                        <button
                                          onClick={() => onDeleteSubtopic(subject._id, chapter._id, topic._id, st._id)}
                                          className="opacity-0 group-hover/sub:opacity-100 text-[10px] text-slate-600 hover:text-red-400 transition"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Tracker Component ───────────────────────────────────────────────────
const CoreSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'addSubject'
  const [toast, setToast] = useState(null);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleCreateSubject = async (payload) => {
    try {
      const res = await api.post('/subjects', payload);
      setSubjects(prev => [...prev, res.data.data]);
      setModal(null);
      showToast('Subject created! 📚');
      fetchSubjects();
    } catch (err) {
      showToast('Failed to create subject', true);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject entirely?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects(prev => prev.filter(s => s._id !== id));
      showToast('Subject deleted');
    } catch {
      showToast('Failed to delete subject', true);
    }
  };

  const handleAddChapter = async (subjectId, name) => {
    try {
      const res = await api.post(`/subjects/${subjectId}/chapters`, { name });
      setSubjects(prev => prev.map(s => s._id === subjectId ? res.data.data : s));
      fetchSubjects();
      showToast('Chapter added!');
    } catch {
      showToast('Failed to add chapter', true);
    }
  };

  const handleDeleteChapter = async (subjectId, chapterId) => {
    if (!window.confirm('Delete this chapter and all its topics?')) return;
    try {
      const res = await api.delete(`/subjects/${subjectId}/chapters/${chapterId}`);
      setSubjects(prev => prev.map(s => s._id === subjectId ? res.data.data : s));
      fetchSubjects();
      showToast('Chapter deleted');
    } catch {
      showToast('Failed to delete chapter', true);
    }
  };

  const handleAddTopic = async (subjectId, chapterId, title) => {
    try {
      const res = await api.post(`/subjects/${subjectId}/chapters/${chapterId}/topics`, { title });
      setSubjects(prev => prev.map(s => s._id === subjectId ? res.data.data : s));
      fetchSubjects();
      showToast('Topic added!');
    } catch {
      showToast('Failed to add topic', true);
    }
  };

  const handleDeleteTopic = async (subjectId, chapterId, topicId) => {
    try {
      const res = await api.delete(`/subjects/${subjectId}/chapters/${chapterId}/topics/${topicId}`);
      setSubjects(prev => prev.map(s => s._id === subjectId ? res.data.data : s));
      fetchSubjects();
      showToast('Topic deleted');
    } catch {
      showToast('Failed to delete topic', true);
    }
  };

  const handleTopicStatusChange = async (subjectId, chapterId, topicId, newStatus) => {
    try {
      const res = await api.patch(`/subjects/${subjectId}/chapters/${chapterId}/topics/${topicId}`, { status: newStatus });
      setSubjects(prev => prev.map(s => s._id === subjectId ? res.data.data : s));
      fetchSubjects();
    } catch {
      showToast('Failed to update status', true);
    }
  };

  const handleAddSubtopic = async (subjectId, chapterId, topicId, title) => {
    try {
      const res = await api.post(`/subjects/${subjectId}/chapters/${chapterId}/topics/${topicId}/subtopics`, { title });
      setSubjects(prev => prev.map(s => s._id === subjectId ? res.data.data : s));
      fetchSubjects();
      showToast('Subtopic added!');
    } catch {
      showToast('Failed to add subtopic', true);
    }
  };

  const handleToggleSubtopic = async (subjectId, chapterId, topicId, subtopicId, completed) => {
    try {
      const res = await api.patch(`/subjects/${subjectId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`, { completed });
      setSubjects(prev => prev.map(s => s._id === subjectId ? res.data.data : s));
      fetchSubjects();
    } catch {
      showToast('Failed to update subtopic', true);
    }
  };

  const handleDeleteSubtopic = async (subjectId, chapterId, topicId, subtopicId) => {
    try {
      const res = await api.delete(`/subjects/${subjectId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`);
      setSubjects(prev => prev.map(s => s._id === subjectId ? res.data.data : s));
      fetchSubjects();
    } catch {
      showToast('Failed to delete subtopic', true);
    }
  };

  const filtered = subjects.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.chapters.some(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.topics.some(t => t.title.toLowerCase().includes(search.toLowerCase())))
  );

  // Overall Stats
  let totalTopics = 0;
  let confidentTopics = 0;
  let revisingTopics = 0;
  let learningTopics = 0;

  subjects.forEach(s => {
    (s.chapters || []).forEach(c => {
      (c.topics || []).forEach(t => {
        totalTopics++;
        if (t.status === 'confident') confidentTopics++;
        else if (t.status === 'revising') revisingTopics++;
        else if (t.status === 'learning') learningTopics++;
      });
    });
  });

  const overallPct = totalTopics > 0 ? Math.round((confidentTopics / totalTopics) * 100) : 0;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-900/40 border border-slate-800 rounded-xl w-52" />
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-900/40 border border-slate-800 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-lg ${toast.err ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {toast.msg}
        </div>
      )}

      {/* Add Subject Modal */}
      {modal === 'addSubject' && (
        <AddSubjectModal onClose={() => setModal(null)} onSave={handleCreateSubject} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Core Subjects</h1>
          <p className="text-sm text-slate-400 mt-1">Track subjects, chapters, topics, and subtopics with custom Pie Chart breakdowns.</p>
        </div>
        <button
          onClick={() => setModal('addSubject')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow shadow-primary/25 transition"
        >
          <Plus size={15} /> Add Subject
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Layers, label: 'Subjects', value: subjects.length, color: 'text-primary' },
          { icon: CheckCircle2, label: 'Confident Topics', value: confidentTopics, color: 'text-emerald-400' },
          { icon: RefreshCw, label: 'Revising Topics', value: revisingTopics, color: 'text-amber-400' },
          { icon: BookOpenCheck, label: 'Mastery', value: `${overallPct}%`, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <s.icon size={18} className={s.color} />
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">{s.label}</p>
              <p className="text-xl font-extrabold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      {totalTopics > 0 && (
        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-5">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold">Overall Mastery progress</span>
              <span className="font-bold text-white">{confidentTopics} / {totalTopics} topics confident</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          <span className="text-3xl font-black text-white">{overallPct}%</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search subjects, chapters, topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-primary"
        />
      </div>

      {/* Status Legends */}
      <div className="flex flex-wrap items-center gap-2.5 text-[10px] bg-slate-900/10 border border-slate-850 p-2.5 rounded-xl">
        <span className="text-slate-500 font-bold uppercase mr-1">Status Legend:</span>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-slate-400 font-semibold">{cfg.label}</span>
          </div>
        ))}
        <span className="text-slate-500 ml-auto flex items-center gap-1">
          <HelpCircle size={10} /> Click status to cycle stages. Expand topic to view/add subtopics.
        </span>
      </div>

      {/* Nested Cards layout */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <BookOpen size={36} className="text-slate-650 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">No subjects matched.</p>
            <p className="text-slate-500 text-xs mt-1">Try tweaking your search or add a subject to get started.</p>
          </div>
        ) : (
          filtered.map(s => (
            <SubjectCard
              key={s._id}
              subject={s}
              onAddChapter={handleAddChapter}
              onDeleteChapter={handleDeleteChapter}
              onAddTopic={handleAddTopic}
              onDeleteTopic={handleDeleteTopic}
              onTopicStatusChange={handleTopicStatusChange}
              onAddSubtopic={handleAddSubtopic}
              onToggleSubtopic={handleToggleSubtopic}
              onDeleteSubtopic={handleDeleteSubtopic}
              onDeleteSubject={handleDeleteSubject}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CoreSubjects;

