import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import {
  Plus, X, Edit2, Trash2, Calendar, GripVertical, Check,
  Clock, AlertTriangle, Tag, BookOpen, Layers, Target, CheckSquare,
  BarChart2, Play, Flame, HelpCircle
} from 'lucide-react';
import {
  DndContext, closestCorners, PointerSensor, KeyboardSensor,
  useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = [
  { key: 'Backlog',    label: '📋 Backlog',     color: 'border-slate-800',           badge: 'bg-slate-800 text-slate-400' },
  { key: 'Today',      label: '📅 Today',       color: 'border-primary/40',         badge: 'bg-primary/10 text-primary' },
  { key: 'In Progress',label: '⚡ In Progress', color: 'border-amber-700/40',        badge: 'bg-amber-500/10 text-amber-400' },
  { key: 'Review',     label: '👀 Review',      color: 'border-violet-700/40',       badge: 'bg-violet-500/10 text-violet-400' },
  { key: 'Completed',  label: '✅ Completed',   color: 'border-emerald-700/40',      badge: 'bg-emerald-500/10 text-emerald-400' }
];

const COL_COLORS = {
  Backlog:      '#75604b',
  Today:        '#6f472d',
  'In Progress': '#c9852d',
  Review:       '#aa8261',
  Completed:    '#4d7d54'
};

const PRIORITY_CONFIG = {
  High:   { dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  Medium: { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  Low:    { dot: 'bg-slate-600', badge: 'bg-slate-800 text-slate-400 border-slate-700' }
};

// ─── Task Form Details Modal ──────────────────────────────────────────────────
const TaskDetailModal = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'Medium', timeSlot: 'morning',
    estimatedTime: '', actualTime: '', deadline: '', tags: ''
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        timeSlot: task.timeSlot || 'morning',
        estimatedTime: task.estimatedTime || '',
        actualTime: task.actualTime || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : ''
      });
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [...prev, { title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (index) => {
    setSubtasks(prev => prev.map((st, i) => i === index ? { ...st, completed: !st.completed } : st));
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave({
      ...form,
      estimatedTime: form.estimatedTime ? parseInt(form.estimatedTime) : 0,
      actualTime: form.actualTime ? parseInt(form.actualTime) : 0,
      deadline: form.deadline ? new Date(form.deadline) : undefined,
      tags: tagsArray,
      subtasks
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-7 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-white">✏️ Edit Task Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"><X size={17} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Task Title *</label>
            <input
              type="text" required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">⚪ Low</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Preferred Time Slot</label>
              <select
                value={form.timeSlot}
                onChange={e => setForm(p => ({ ...p, timeSlot: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="morning">🌅 Morning</option>
                <option value="afternoon">☀️ Afternoon</option>
                <option value="evening">🌆 Evening</option>
                <option value="night">🌙 Night</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Est. Mins</label>
              <input
                type="number"
                value={form.estimatedTime}
                onChange={e => setForm(p => ({ ...p, estimatedTime: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Act. Mins</label>
              <input
                type="number"
                value={form.actualTime}
                onChange={e => setForm(p => ({ ...p, actualTime: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="revision, graphs, mock..."
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="bg-slate-950/30 border border-slate-850/60 rounded-xl p-4 space-y-3">
            <label className="text-xs font-bold text-slate-400">Subtask Checklist</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New subtask..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button type="button" onClick={addSubtask} className="px-3 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-lg text-xs transition">Add</button>
            </div>
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(i)}
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${st.completed ? 'bg-emerald-500/20 border-emerald-500' : 'border-slate-800 hover:border-slate-700'}`}
                    >
                      {st.completed && <Check size={8} className="text-emerald-400" />}
                    </button>
                    <span className={`text-xs flex-1 ${st.completed ? 'line-through text-slate-500' : 'text-slate-350'}`}>{st.title}</span>
                    <button type="button" onClick={() => handleRemoveSubtask(i)} className="text-slate-500 hover:text-red-400"><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-extrabold shadow shadow-primary/20 transition">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Droppable Column Container ───────────────────────────────────────────────
const DroppableColumn = ({ colKey, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: colKey });
  return (
    <div ref={setNodeRef} className={`space-y-3 min-h-[50px] rounded-xl p-1 transition-all duration-200 ${isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
      {children}
    </div>
  );
};

// ─── Sortable Task Card ───────────────────────────────────────────────────────
const SortableTaskCard = ({ task, onEdit, onDelete, onQuickComplete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };
  
  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
  const isCompleted = task.kanbanColumn === 'Completed' || task.status === 'Completed';

  // Completion calculation
  const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
  const subtasksTotal = (task.subtasks || []).length;

  const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border rounded-xl p-4 shadow-sm transition-all duration-200 ${
        isCompleted 
          ? 'bg-slate-950/20 border-slate-850 opacity-60' 
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-750 hover:bg-slate-900/60'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Grab Handle */}
        <div {...attributes} {...listeners} className="mt-0.5 text-slate-650 hover:text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical size={13} />
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <p className={`text-xs font-bold leading-snug ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {task.title}
            </p>
            {!isCompleted && (
              <button
                onClick={() => onQuickComplete(task._id)}
                className="w-3.5 h-3.5 rounded border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 transition"
                title="Quick Complete"
              >
                <Check size={8} className="opacity-0 hover:opacity-100 text-emerald-400" />
              </button>
            )}
          </div>

          {task.description && (
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
          )}

          {/* Subtask counts */}
          {subtasksTotal > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(completedSubtasks / subtasksTotal) * 100}%` }} />
              </div>
              <span className="text-[9px] font-bold text-slate-500">{completedSubtasks}/{subtasksTotal} subtasks</span>
            </div>
          )}

          {/* Footer Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${prio.badge}`}>
              {task.priority}
            </span>

            {task.deadline && (
              <span className={`text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 border rounded-md ${isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20 font-bold' : 'text-slate-500 bg-slate-950/40 border-slate-850/50'}`}>
                <Calendar size={9} />
                {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}

            {task.estimatedTime > 0 && (
              <span className="text-[9px] text-slate-500 flex items-center gap-0.5 bg-slate-950/40 border border-slate-850/50 px-1.5 py-0.5 rounded-md">
                <Clock size={8} />{task.estimatedTime}m
              </span>
            )}

            {task.tags && task.tags.map(t => (
              <span key={t} className="text-[9px] text-slate-500 bg-slate-950/30 px-1.5 py-0.5 rounded border border-slate-850/30">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Option Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          <button onClick={() => onEdit(task)} className="p-1 text-slate-500 hover:text-white hover:bg-slate-850 rounded-lg transition" title="Edit"><Edit2 size={12} /></button>
          <button onClick={() => onDelete(task._id)} className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Delete"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
};

// ─── Kanban Board Column Component ───────────────────────────────────────────
const KanbanColumn = ({ col, tasks, onEdit, onDelete, onQuickComplete }) => {
  const cfg = COLUMNS.find(c => c.key === col.key);

  return (
    <div className={`flex flex-col rounded-2xl border bg-slate-950/30 ${cfg.color} min-w-[245px] w-full shadow-sm`}>
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-850/60 bg-slate-900/10">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-200 text-xs uppercase tracking-wider">{cfg.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${cfg.badge}`}>{tasks.length}</span>
        </div>
      </div>

      {/* Cards list */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[300px]">
        <DroppableColumn colKey={col.key}>
          <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tasks.map(t => (
                <SortableTaskCard key={t._id} task={t} onEdit={onEdit} onDelete={onDelete} onQuickComplete={onQuickComplete} />
              ))}
            </div>
          </SortableContext>
        </DroppableColumn>
        {tasks.length === 0 && (
          <p className="text-[10px] text-slate-650 italic text-center mt-6">Drag tasks here</p>
        )}
      </div>
    </div>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────
const KanbanBoard = () => {
  const [boardTasks, setBoardTasks] = useState({ Backlog: [], Today: [], 'In Progress': [], Review: [], Completed: [] });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modal, setModal] = useState(null); // 'edit'
  const [toast, setToast] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchBoard = useCallback(async () => {
    try {
      const res = await api.get('/kanban/board');
      setBoardTasks(res.data.data || { Backlog: [], Today: [], 'In Progress': [], Review: [], Completed: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleSave = async (payload) => {
    try {
      const res = await api.patch(`/planner/tasks/${selectedTask._id}`, payload);
      const updated = res.data.data;
      
      setBoardTasks(prev => {
        const next = {};
        for (const col in prev) {
          next[col] = prev[col].map(t => t._id === updated._id ? { ...t, ...updated } : t);
        }
        return next;
      });

      setModal(null);
      setSelectedTask(null);
      showToast('Task updated successfully! ✨');
      fetchBoard();
    } catch {
      showToast('Failed to update task details', true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/planner/tasks/${id}`);
      setBoardTasks(prev => {
        const next = {};
        for (const col in prev) next[col] = prev[col].filter(t => t._id !== id);
        return next;
      });
      showToast('Task deleted successfully');
    } catch {
      showToast('Failed to delete task', true);
    }
  };

  const handleQuickComplete = async (id) => {
    try {
      const res = await api.post(`/planner/tasks/${id}/complete`, { actualTime: 30 });
      const completedTask = res.data.data;
      
      setBoardTasks(prev => {
        const next = {};
        for (const col in prev) {
          next[col] = prev[col].filter(t => t._id !== id);
        }
        const updatedCol = completedTask.kanbanColumn || 'Completed';
        next[updatedCol] = [...(next[updatedCol] || []), completedTask];
        return next;
      });
      
      showToast('Task marked as completed! ✅');
      fetchBoard();
    } catch {
      showToast('Failed to complete task', true);
    }
  };

  // Drag and drop event handlers
  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;

    let activeCol = null;
    for (const col in boardTasks) {
      if (boardTasks[col].some(t => t._id === activeId)) { activeCol = col; break; }
    }
    let overCol = COLUMNS.some(c => c.key === overId) ? overId : null;
    if (!overCol) {
      for (const col in boardTasks) {
        if (boardTasks[col].some(t => t._id === overId)) { overCol = col; break; }
      }
    }
    if (!activeCol || !overCol) return;

    setBoardTasks(prev => {
      const next = { ...prev };
      const srcList = [...next[activeCol]];
      const srcIdx = srcList.findIndex(t => t._id === activeId);
      const [draggedItem] = srcList.splice(srcIdx, 1);
      
      // Update local cache parameters
      draggedItem.kanbanColumn = overCol;
      if (overCol === 'Completed') draggedItem.status = 'Completed';
      else if (overCol === 'In Progress') draggedItem.status = 'In Progress';
      else draggedItem.status = 'Not Started';

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

      // Persist movement to backend DB
      api.post(`/kanban/tasks/${activeId}/move`, {
        targetColumn: overCol,
        orderedIds: next[overCol].map(t => t._id)
      }).catch(console.error);

      return next;
    });
  };

  const allTasks = Object.values(boardTasks).flat();
  const total = allTasks.length;
  const completed = (boardTasks.Completed || []).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-900/40 border border-slate-800 rounded-xl w-52" />
      <div className="flex gap-4">
        {[1,2,3,4,5].map(i => <div key={i} className="flex-1 h-64 bg-slate-900/40 border border-slate-800 rounded-2xl" />)}
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

      {/* Task Details Dialog Modal */}
      {modal === 'edit' && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => { setModal(null); setSelectedTask(null); }}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Kanban Board</h1>
        <p className="text-sm text-slate-400 mt-1">Manage placement preparation tasks visually across 5 columns.</p>
      </div>

      {/* Progress metrics */}
      {total > 0 && (
        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-5">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-bold">Placement Tasks Progress</span>
              <span className="font-bold text-white">{completed} / {total} tasks completed</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="text-2xl font-black text-white">{pct}%</span>
        </div>
      )}

      {/* Help info */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900/10 border border-slate-850 p-2.5 rounded-xl">
        <HelpCircle size={11} /> Drag cards by the vertical handle grid icon to move across columns. Tasks status syncs automatically.
      </div>

      {/* Kanban Board Grid Context */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              col={col}
              tasks={boardTasks[col.key] || []}
              onEdit={(t) => { setSelectedTask(t); setModal('edit'); }}
              onDelete={handleDelete}
              onQuickComplete={handleQuickComplete}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;

