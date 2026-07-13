import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import {
  Plus, X, Edit2, Trash2, ExternalLink, Clock,
  Layers, Target, Zap, BarChart2, Calendar,
  ChevronDown, Grip, BookOpen, Tag
} from 'lucide-react';
import {
  DndContext, closestCorners, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import SageLineChart from '../components/Charts/SageLineChart.jsx';

// ─── Kanban Columns ────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'Backlog',  label: '📋 Backlog',  color: 'border-slate-700',    badge: 'bg-slate-800 text-slate-400'  },
  { key: 'Learning', label: '📘 Learning', color: 'border-blue-700/40',  badge: 'bg-blue-500/10 text-blue-400' },
  { key: 'Revising', label: '🔄 Revising', color: 'border-amber-700/40', badge: 'bg-amber-500/10 text-amber-400' },
  { key: 'Mastered', label: '✅ Mastered', color: 'border-emerald-700/40', badge: 'bg-emerald-500/10 text-emerald-400' },
];

const COL_COLORS = {
  Backlog:  '#475569',
  Learning: '#3b82f6',
  Revising: '#f59e0b',
  Mastered: '#22c55e',
};

// ─── Topic Form Modal ──────────────────────────────────────────────────────────
const TopicModal = ({ topic, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '', description: '', tags: '', notes: '',
    column: 'Backlog', completionPercentage: 0,
    targetDate: '', resourceTitle: '', resourceUrl: '', resourceType: 'article'
  });
  const [resources, setResources] = useState([]);

  useEffect(() => {
    if (topic) {
      setForm({
        title: topic.title || '',
        description: topic.description || '',
        tags: (topic.tags || []).join(', '),
        notes: topic.notes || '',
        column: topic.column || 'Backlog',
        completionPercentage: topic.completionPercentage || 0,
        targetDate: topic.targetDate ? new Date(topic.targetDate).toISOString().split('T')[0] : '',
        resourceTitle: '', resourceUrl: '', resourceType: 'article'
      });
      setResources(topic.resources || []);
    }
  }, [topic]);

  const addResource = () => {
    if (!form.resourceTitle.trim()) return;
    setResources(prev => [...prev, { title: form.resourceTitle, url: form.resourceUrl, type: form.resourceType }]);
    setForm(p => ({ ...p, resourceTitle: '', resourceUrl: '', resourceType: 'article' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      title: form.title,
      description: form.description,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes,
      column: form.column,
      completionPercentage: parseInt(form.completionPercentage) || 0,
      targetDate: form.targetDate ? new Date(form.targetDate) : undefined,
      resources
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-7 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-white">
            {topic ? '✏️ Edit Topic' : '➕ New System Design Topic'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"><X size={17} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Topic Title *</label>
            <input
              type="text" required
              placeholder="e.g. Consistent Hashing, Load Balancers…"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Description</label>
            <textarea
              placeholder="Brief overview of this topic…"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Kanban Column</label>
              <select
                value={form.column}
                onChange={e => setForm(p => ({ ...p, column: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Self-Assessment % Complete</label>
              <input
                type="number" min={0} max={100}
                value={form.completionPercentage}
                onChange={e => setForm(p => ({ ...p, completionPercentage: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Target Review Date</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={e => setForm(p => ({ ...p, targetDate: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="distributed, caching…"
                value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Resources */}
          <div className="bg-slate-950/30 border border-slate-850/60 rounded-xl p-4 space-y-3">
            <label className="text-xs font-bold text-slate-400">Study Resources</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Resource title…"
                value={form.resourceTitle}
                onChange={e => setForm(p => ({ ...p, resourceTitle: e.target.value }))}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <input
                type="url"
                placeholder="URL"
                value={form.resourceUrl}
                onChange={e => setForm(p => ({ ...p, resourceUrl: e.target.value }))}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <select
                value={form.resourceType}
                onChange={e => setForm(p => ({ ...p, resourceType: e.target.value }))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="book">Book</option>
                <option value="course">Course</option>
                <option value="other">Other</option>
              </select>
              <button type="button" onClick={addResource} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition">Add</button>
            </div>
            {resources.length > 0 && (
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {resources.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-300 flex-1 truncate">{r.title}</span>
                    {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400"><ExternalLink size={10} /></a>}
                    <span className="text-[9px] text-slate-500 capitalize">{r.type}</span>
                    <button type="button" onClick={() => setResources(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400"><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Notes / Key Concepts</label>
            <textarea
              placeholder="Key takeaways, architecture diagrams description, interview points…"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-extrabold shadow shadow-primary/20 transition">
              {topic ? 'Save Changes' : 'Add Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Droppable Column ─────────────────────────────────────────────────────────
const DroppableColumn = ({ colKey, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: colKey });
  return (
    <div ref={setNodeRef} className={`space-y-3 min-h-[48px] rounded-xl p-1 transition-all duration-200 ${isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
      {children}
    </div>
  );
};

// ─── Sortable Topic Card ──────────────────────────────────────────────────────
const SortableTopicCard = ({ topic, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const col = COL_COLORS[topic.column] || '#6366f1';
  const isOverdue = topic.targetDate && new Date(topic.targetDate) < new Date() && topic.column !== 'Mastered';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-default transition-all duration-200"
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0">
          <Grip size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-200 leading-snug">{topic.title}</p>
          {topic.description && (
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{topic.description}</p>
          )}

          {/* Completion bar */}
          {topic.completionPercentage > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${topic.completionPercentage}%`, backgroundColor: col }} />
              </div>
              <span className="text-[10px] font-bold text-slate-500">{topic.completionPercentage}%</span>
            </div>
          )}

          {/* Metadata footer */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {topic.tags?.map(t => (
              <span key={t} className="flex items-center gap-0.5 text-[9px] text-slate-500 bg-slate-900/50 border border-slate-800 px-1.5 py-0.5 rounded-md">
                <Tag size={8} />{t}
              </span>
            ))}
            {topic.resources?.length > 0 && (
              <span className="text-[9px] text-slate-500 flex items-center gap-0.5 bg-slate-900/50 border border-slate-800 px-1.5 py-0.5 rounded-md">
                <BookOpen size={8} />{topic.resources.length} resource{topic.resources.length > 1 ? 's' : ''}
              </span>
            )}
            {topic.targetDate && (
              <span className={`text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border ${isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'text-slate-500 bg-slate-900/50 border-slate-800'}`}>
                <Calendar size={8} />{new Date(topic.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          <button onClick={() => onEdit(topic)} className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"><Edit2 size={12} /></button>
          <button onClick={() => onDelete(topic._id)} className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
};

// ─── Kanban Column Component ──────────────────────────────────────────────────
const KanbanColumn = ({ col, topics, onEdit, onDelete, onAddInCol }) => {
  const cfg = COLUMNS.find(c => c.key === col.key);

  return (
    <div className={`flex flex-col rounded-2xl border bg-slate-950/30 ${cfg.color} min-w-[240px] w-full`}>
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-200 text-sm">{cfg.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${cfg.badge}`}>{topics.length}</span>
        </div>
        <button
          onClick={() => onAddInCol(col.key)}
          className="p-1 text-slate-600 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Add topic to this column"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Cards */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
        <DroppableColumn colKey={col.key}>
          <SortableContext items={topics.map(t => t._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {topics.map(t => (
                <SortableTopicCard key={t._id} topic={t} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          </SortableContext>
        </DroppableColumn>
        {topics.length === 0 && (
          <p className="text-[11px] text-slate-600 italic text-center mt-4">Drag topics here</p>
        )}
      </div>
    </div>
  );
};

// ─── Timeline Row View ────────────────────────────────────────────────────────
const TimelineView = ({ topics, onEdit, onDelete }) => {
  const sorted = [...topics].sort((a, b) => {
    if (!a.targetDate && !b.targetDate) return 0;
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return new Date(a.targetDate) - new Date(b.targetDate);
  });

  return (
    <div className="space-y-3">
      {sorted.map(topic => {
        const col = COL_COLORS[topic.column] || '#6366f1';
        const cfg = COLUMNS.find(c => c.key === topic.column);
        const isOverdue = topic.targetDate && new Date(topic.targetDate) < new Date() && topic.column !== 'Mastered';
        return (
          <div key={topic._id} className="flex items-center gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-2xl hover:border-slate-700 group transition">
            <div className="w-2 h-full rounded-full flex-shrink-0" style={{ backgroundColor: col, minHeight: 40 }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-slate-200 text-sm">{topic.title}</p>
                {cfg && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-bold ${cfg.badge}`}>{topic.column}</span>
                )}
              </div>
              {topic.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{topic.description}</p>}
              {topic.completionPercentage > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-24 h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${topic.completionPercentage}%`, backgroundColor: col }} />
                  </div>
                  <span className="text-[10px] text-slate-500">{topic.completionPercentage}%</span>
                </div>
              )}
            </div>
            {topic.targetDate && (
              <span className={`text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-xl border flex-shrink-0 ${isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20 font-bold' : 'text-slate-500 bg-slate-900 border-slate-800'}`}>
                <Calendar size={11} />
                {new Date(topic.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => onEdit(topic)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"><Edit2 size={12} /></button>
              <button onClick={() => onDelete(topic._id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={12} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main System Design Page ──────────────────────────────────────────────────
const SystemDesign = () => {
  const [columnTopics, setColumnTopics] = useState({ Backlog: [], Learning: [], Revising: [], Mastered: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // kanban | timeline
  const [modal, setModal] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [defaultColumn, setDefaultColumn] = useState('Backlog');
  const [toast, setToast] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchTopics = useCallback(async () => {
    try {
      const res = await api.get('/system-design');
      setColumnTopics(res.data.data?.grouped || { Backlog: [], Learning: [], Revising: [], Mastered: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const handleSave = async (payload) => {
    try {
      if (selectedTopic) {
        const res = await api.patch(`/system-design/${selectedTopic._id}`, { ...payload, column: payload.column || selectedTopic.column });
        const updated = res.data.data;
        setColumnTopics(prev => {
          const next = {};
          for (const c in prev) next[c] = prev[c].filter(t => t._id !== updated._id);
          next[updated.column] = [...(next[updated.column] || []), updated].sort((a,b) => (a.order||0)-(b.order||0));
          return next;
        });
      } else {
        const colForCreate = payload.column || defaultColumn;
        const res = await api.post('/system-design', { ...payload, column: colForCreate });
        const created = res.data.data;
        setColumnTopics(prev => ({
          ...prev,
          [created.column]: [...(prev[created.column] || []), created]
        }));
      }
      setModal(null);
      setSelectedTopic(null);
      showToast(selectedTopic ? 'Topic updated! ✨' : 'Topic added! 🎯');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save topic', true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this system design topic?')) return;
    try {
      await api.delete(`/system-design/${id}`);
      setColumnTopics(prev => {
        const next = {};
        for (const c in prev) next[c] = prev[c].filter(t => t._id !== id);
        return next;
      });
      showToast('Topic deleted');
    } catch {
      showToast('Failed to delete topic', true);
    }
  };

  const handleAddInCol = (colKey) => {
    setDefaultColumn(colKey);
    setSelectedTopic(null);
    setModal('form');
  };

  const handleEdit = (topic) => {
    setSelectedTopic(topic);
    setModal('form');
  };

  // Drag end handler
  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;

    let activeCol = null;
    for (const col in columnTopics) {
      if (columnTopics[col].some(t => t._id === activeId)) { activeCol = col; break; }
    }
    let overCol = COLUMNS.some(c => c.key === overId) ? overId : null;
    if (!overCol) {
      for (const col in columnTopics) {
        if (columnTopics[col].some(t => t._id === overId)) { overCol = col; break; }
      }
    }
    if (!activeCol || !overCol) return;

    setColumnTopics(prev => {
      const next = { ...prev };
      const srcList = [...next[activeCol]];
      const srcIdx = srcList.findIndex(t => t._id === activeId);
      const [draggedItem] = srcList.splice(srcIdx, 1);
      draggedItem.column = overCol;

      if (activeCol === overCol) {
        const dstIdx = srcList.findIndex(t => t._id === overId);
        srcList.splice(dstIdx >= 0 ? dstIdx : srcList.length, 0, draggedItem);
        next[activeCol] = srcList;
      } else {
        next[activeCol] = srcList;
        const dstList = [...next[overCol]];
        const dstIdx = dstList.findIndex(t => t._id === overId);
        dstList.splice(dstIdx >= 0 ? dstIdx : dstList.length, 0, draggedItem);
        next[overCol] = dstList;
      }

      // Persist column change and reorder
      api.patch(`/system-design/${activeId}`, { column: overCol }).catch(console.error);
      api.post('/system-design/reorder', {
        column: overCol,
        orderedIds: next[overCol].map(t => t._id)
      }).catch(console.error);

      return next;
    });
  };

  const allTopics = Object.values(columnTopics).flat();
  const totalTopics = allTopics.length;
  const masteredCount = (columnTopics.Mastered || []).length;
  const masteryPct = totalTopics > 0 ? Math.round((masteredCount / totalTopics) * 100) : 0;
  const systemTrend = useMemo(() => {
    const byDate = {};
    allTopics.forEach((topic) => {
      const rawDate = topic.updatedAt || topic.createdAt || topic.targetDate;
      if (!rawDate) return;
      const date = new Date(rawDate).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + (topic.completionPercentage || (topic.column === 'Mastered' ? 100 : 0));
    });
    return Array.from({ length: 30 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - index));
      const date = d.toISOString().split('T')[0];
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: byDate[date] || 0
      };
    });
  }, [allTopics]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-900/40 border border-slate-800 rounded-xl w-52" />
      <div className="flex gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="flex-1 h-64 bg-slate-900/40 border border-slate-800 rounded-2xl" />)}
      </div>
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

      {/* Modal */}
      {modal === 'form' && (
        <TopicModal
          topic={selectedTopic}
          onClose={() => { setModal(null); setSelectedTopic(null); }}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">System Design</h1>
          <p className="text-sm text-slate-400 mt-1">Master distributed systems concepts with a visual kanban board.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${view === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>
              🗂️ Kanban
            </button>
            <button onClick={() => setView('timeline')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${view === 'timeline' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>
              📅 Timeline
            </button>
          </div>
          <button
            onClick={() => { setDefaultColumn('Backlog'); setSelectedTopic(null); setModal('form'); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow shadow-primary/25 transition"
          >
            <Plus size={15} /> Add Topic
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COLUMNS.map(col => {
          const count = (columnTopics[col.key] || []).length;
          return (
            <div key={col.key} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 font-semibold uppercase">{col.key}</p>
              <p className="text-2xl font-extrabold text-white mt-1">{count}</p>
              <div className="w-full h-1 bg-slate-950 rounded-full mt-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${totalTopics > 0 ? (count/totalTopics)*100 : 0}%`, backgroundColor: COL_COLORS[col.key] }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mastery bar */}
      {totalTopics > 0 && (
        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-5">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold">Overall Mastery Progress</span>
              <span className="font-bold text-white">{masteredCount} / {totalTopics} mastered</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${masteryPct}%` }} />
            </div>
          </div>
          <span className="text-3xl font-black text-white">{masteryPct}%</span>
        </div>
      )}

      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-dark dark:text-primary-light">System design trend</p>
            <h2 className="text-lg font-black text-white">Progress activity over the last 30 days</h2>
          </div>
          <p className="text-xs font-semibold text-slate-500">{masteredCount}/{totalTopics} mastered</p>
        </div>
        <SageLineChart data={systemTrend} height={210} valueLabel="Progress points" showYAxis compact />
      </div>

      {/* Views */}
      {view === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.key}
                col={col}
                topics={columnTopics[col.key] || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddInCol={handleAddInCol}
              />
            ))}
          </div>
        </DndContext>
      )}

      {view === 'timeline' && (
        <TimelineView topics={allTopics} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {totalTopics === 0 && (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
          <Layers size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No system design topics yet.</p>
          <p className="text-slate-500 text-sm mt-1">Add topics like Load Balancers, Consistent Hashing, CAP Theorem…</p>
        </div>
      )}
    </div>
  );
};

export default SystemDesign;
