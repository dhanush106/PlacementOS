import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import {
  Plus, Check, Trash2, ChevronDown, ChevronRight, Clock, X,
  Edit2, CheckCircle2, GripVertical, AlertTriangle, Calendar,
  Tag, RefreshCw, Eye
} from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

const TIME_SLOTS = [
  { key: 'morning', label: '🌅 Morning', hours: '5:00 – 12:00' },
  { key: 'afternoon', label: '☀️ Afternoon', hours: '12:00 – 17:00' },
  { key: 'evening', label: '🌆 Evening', hours: '17:00 – 21:00' },
  { key: 'night', label: '🌙 Night', hours: '21:00 – 5:00' }
];

const PRIORITY_COLORS = {
  High:   { dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  Medium: { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  Low:    { dot: 'bg-slate-600', badge: 'bg-slate-800 text-slate-400 border-slate-700' }
};

// ─── Droppable Slot Container ──────────────────────────────────────────────────
const DroppableSlot = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2.5 min-h-[40px] rounded-xl transition-all duration-200 ${isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
      {children}
    </div>
  );
};

// ─── Sortable Task Card Component ──────────────────────────────────────────────
const SortableTaskCard = ({ task, onCompleteClick, onDelete, onEditClick, onSubtaskToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  };

  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;
  const isDone = task.status === 'Completed';

  // Calculate deadline warnings
  const isOverdue = !isDone && task.deadline && new Date(task.deadline) < new Date();
  
  // Calculate variance percentage overrun
  const showOverrun = isDone && task.estimatedTime > 0 && task.actualTime > task.estimatedTime;
  const overrunPct = showOverrun ? Math.round(((task.actualTime - task.estimatedTime) / task.estimatedTime) * 100) : 0;
  const isBadlyOverrun = overrunPct > 30;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2.5 p-4 rounded-xl border transition-all duration-200 group ${
        isDone 
          ? 'bg-slate-950/25 border-slate-850 opacity-60' 
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-750 hover:bg-slate-900/60 shadow-sm'
      }`}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="mt-0.5 cursor-grab text-slate-600 hover:text-slate-400 p-0.5 active:cursor-grabbing transition">
        <GripVertical size={15} />
      </div>

      {/* Completion Checkbox */}
      <button
        onClick={() => !isDone && onCompleteClick(task)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          isDone ? 'bg-emerald-500/20 border-emerald-500' : 'border-slate-700 hover:border-primary hover:bg-primary/5'
        }`}
      >
        {isDone && <Check size={11} className="text-emerald-400 font-bold" />}
      </button>

      {/* Main Content Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
          {task.title}
        </p>
        
        {task.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
        )}

        {/* Subtasks Progress / Inline Checklist */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-slate-850 pt-2.5">
            {task.subtasks.map((st, i) => (
              <label key={st._id || i} className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={st.completed}
                  disabled={isDone}
                  onChange={() => onSubtaskToggle(task, i)}
                  className="rounded border-slate-800 bg-slate-950 text-primary focus:ring-primary w-3 h-3 transition"
                />
                <span className={st.completed ? 'line-through text-slate-500' : ''}>{st.title}</span>
              </label>
            ))}
          </div>
        )}

        {/* Badges / Metrics Footer */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px]">
          <span className={`px-1.5 py-0.5 border rounded-md font-bold uppercase tracking-wider ${pc.badge}`}>
            {task.priority}
          </span>

          {task.estimatedTime > 0 && (
            <span className="flex items-center gap-1 text-slate-500 bg-slate-950/40 border border-slate-850/50 px-1.5 py-0.5 rounded-md">
              <Clock size={9} />
              <span>Est: {task.estimatedTime}m</span>
              {isDone && <span> / Act: {task.actualTime}m</span>}
            </span>
          )}

          {/* Time Tracking Overrun Warning */}
          {showOverrun && (
            <span className={`flex items-center gap-1 font-bold px-1.5 py-0.5 border rounded-md ${
              isBadlyOverrun ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <AlertTriangle size={9} />
              <span>+{overrunPct}% Over</span>
            </span>
          )}

          {/* Deadline Badge */}
          {task.deadline && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 border rounded-md ${
              isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20 font-bold' : 'text-slate-500 bg-slate-950/40 border-slate-850/50'
            }`}>
              <Calendar size={9} />
              <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </span>
          )}

          {/* Recurring Indicator */}
          {task.recurring?.pattern && task.recurring.pattern !== 'none' && (
            <span className="flex items-center gap-1 text-primary-light bg-primary/5 border border-primary/20 px-1.5 py-0.5 rounded-md font-medium capitalize">
              <RefreshCw size={9} className="animate-spin-slow" />
              <span>{task.recurring.pattern}</span>
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.map(t => (
            <span key={t} className="flex items-center gap-0.5 text-slate-500 bg-slate-950/30 px-1.5 py-0.5 rounded-md">
              <Tag size={8} />
              <span>{t}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Edit & Delete Action Panel */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => onEditClick(task)}
          className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Edit Task Details"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={() => onDelete(task._id)}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
          title="Delete Task"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Task Modal Form Component ──────────────────────────────────────────────────
const TaskModal = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '', description: '', timeSlot: 'morning', priority: 'Medium',
    estimatedTime: '', deadline: '', recurringPattern: 'none', recurringEndDate: '',
    tags: '', pomodoroSessions: ''
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        timeSlot: task.timeSlot || 'morning',
        priority: task.priority || 'Medium',
        estimatedTime: task.estimatedTime || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
        recurringPattern: task.recurring?.pattern || 'none',
        recurringEndDate: task.recurring?.endDate ? new Date(task.recurring.endDate).toISOString().split('T')[0] : '',
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
        pomodoroSessions: task.pomodoroSessions || ''
      });
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      title: form.title,
      description: form.description,
      timeSlot: form.timeSlot,
      priority: form.priority,
      estimatedTime: form.estimatedTime ? parseInt(form.estimatedTime) : 0,
      deadline: form.deadline ? new Date(form.deadline) : undefined,
      recurring: {
        pattern: form.recurringPattern,
        endDate: form.recurringEndDate ? new Date(form.recurringEndDate) : undefined
      },
      tags: tagsArr,
      pomodoroSessions: form.pomodoroSessions ? parseInt(form.pomodoroSessions) : 0,
      subtasks
    };

    onSave(payload);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { title: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-extrabold text-white">
            {task ? 'Edit Task Details 📝' : 'Create New Planner Task 🎯'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Study OS CPU Scheduling"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Description</label>
            <textarea
              placeholder="Add more details about the study task..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Planner Time Slot</label>
              <select
                value={form.timeSlot}
                onChange={e => setForm(p => ({ ...p, timeSlot: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="morning">🌅 Morning</option>
                <option value="afternoon">☀️ Afternoon</option>
                <option value="evening">🌆 Evening</option>
                <option value="night">🌙 Night</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Priority Level</label>
              <select
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">⚪ Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Estimated Duration (mins)</label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={form.estimatedTime}
                onChange={e => setForm(p => ({ ...p, estimatedTime: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Deadline Date</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Recurrence Setup */}
          <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-300">Recurrence Configuration</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Repeat pattern</label>
                <select
                  value={form.recurringPattern}
                  onChange={e => setForm(p => ({ ...p, recurringPattern: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekends">Weekends (Sat-Sun)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {form.recurringPattern !== 'none' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">End Date</label>
                  <input
                    type="date"
                    value={form.recurringEndDate}
                    onChange={e => setForm(p => ({ ...p, recurringEndDate: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subtasks checklist creator */}
          <div className="space-y-2 bg-slate-950/20 p-4 border border-slate-850/60 rounded-xl">
            <label className="text-xs font-bold text-slate-400">Subtask Checklist</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add subtask details..."
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs transition"
              >
                Add
              </button>
            </div>
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mt-2.5 max-h-24 overflow-y-auto">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-850">
                    <span className="text-xs text-slate-300">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-500 hover:text-red-400 p-0.5 rounded transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. revision, arrays, study"
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-extrabold shadow shadow-primary/20 transition"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Time Log Completion Dialog Component ─────────────────────────────────────────
const CompleteTaskModal = ({ task, onClose, onSave }) => {
  const [actualTime, setActualTime] = useState(task?.estimatedTime || 30);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(task._id, { actualTime: parseInt(actualTime), notes });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Log Time & Complete ✓</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Estimated Time</label>
            <p className="text-sm font-semibold text-white">{task?.estimatedTime || 0} minutes</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Actual Time Spent (minutes)</label>
            <input
              type="number"
              value={actualTime}
              onChange={e => setActualTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Notes / Reflections</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What went well? Any issues?"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-800 text-slate-400 rounded-lg text-sm hover:bg-slate-800 transition">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">Complete Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Time Slot Container Component ──────────────────────────────────────────────
const TimeSlotSection = ({ slot, tasks, onCompleteClick, onDelete, onEditClick, onSubtaskToggle }) => {
  const [collapsed, setCollapsed] = useState(false);
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden shadow-sm hover:border-slate-800/80 transition-all duration-200">
      <div className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-800/50 bg-slate-900/10">
        <button className="flex items-center gap-3" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <ChevronRight size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
          <span className="font-bold text-slate-200 text-sm">{slot.label}</span>
          <span className="text-[10px] text-slate-500 font-semibold">{slot.hours}</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-medium">{completed}/{tasks.length} Completed</span>
          {tasks.length > 0 && (
            <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="px-5 py-4">
          <DroppableSlot id={slot.key}>
            <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
                {tasks.map(t => (
                  <SortableTaskCard
                    key={t._id}
                    task={t}
                    onCompleteClick={onCompleteClick}
                    onDelete={onDelete}
                    onEditClick={onEditClick}
                    onSubtaskToggle={onSubtaskToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DroppableSlot>
          {tasks.length === 0 && (
            <p className="text-[11px] text-slate-500 italic py-4 text-center">No tasks assigned to this slot.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Planner Page ─────────────────────────────────────────────────────────
const Planner = () => {
  const [tasks, setTasks] = useState({ morning: [], afternoon: [], evening: [], night: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState(null);
  
  // Modals & Overlays
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'complete'
  const [selectedTask, setSelectedTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/planner/tasks?date=${date}&status=${filter}`);
      const grouped = res.data.data || { morning: [], afternoon: [], evening: [], night: [] };
      setTasks(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter, date]);

  // Create Task Submission
  const handleSaveCreate = async (payload) => {
    try {
      const res = await api.post('/planner/tasks', payload);
      const newTask = res.data.data;
      const slot = newTask.timeSlot;

      setTasks(prev => ({
        ...prev,
        [slot]: [...(prev[slot] || []), newTask]
      }));

      setModal(null);
      showToast('Task created successfully! 🎯');
    } catch (err) {
      showToast('Failed to create task', true);
    }
  };

  // Edit Task Submission
  const handleSaveEdit = async (payload) => {
    try {
      const res = await api.patch(`/planner/tasks/${selectedTask._id}`, payload);
      const updated = res.data.data;

      setTasks(prev => {
        const next = { ...prev };
        // Remove from old slot and add/update in new slot
        for (const slot in next) {
          next[slot] = next[slot].filter(t => t._id !== updated._id);
        }
        next[updated.timeSlot] = [...(next[updated.timeSlot] || []), updated].sort((a,b) => (a.order || 0) - (b.order || 0));
        return next;
      });

      setModal(null);
      setSelectedTask(null);
      showToast('Task updated successfully! ✨');
    } catch (err) {
      showToast('Failed to update task', true);
    }
  };

  // Complete Task Submission (including logging of actual time)
  const handleSaveComplete = async (taskId, { actualTime, notes }) => {
    try {
      const res = await api.post(`/planner/tasks/${taskId}/complete`, { actualTime, notes });
      const completedTask = res.data.data;

      setTasks(prev => {
        const next = {};
        for (const slot in prev) {
          next[slot] = prev[slot].map(t => t._id === taskId ? completedTask : t);
        }
        return next;
      });

      setModal(null);
      setSelectedTask(null);
      showToast('Task marked as completed! ✅');
    } catch (err) {
      showToast('Failed to complete task', true);
    }
  };

  const handleCompleteClick = (task) => {
    setSelectedTask(task);
    setModal('complete');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/planner/tasks/${id}`);
      setTasks(prev => {
        const next = {};
        for (const slot in prev) next[slot] = prev[slot].filter(t => t._id !== id);
        return next;
      });
      showToast('Task deleted successfully');
    } catch {
      showToast('Failed to delete task', true);
    }
  };

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setModal('edit');
  };

  // Toggle single subtask check state directly
  const handleSubtaskToggle = async (task, subtaskIdx) => {
    try {
      const updatedSubtasks = [...task.subtasks];
      updatedSubtasks[subtaskIdx].completed = !updatedSubtasks[subtaskIdx].completed;

      const res = await api.patch(`/planner/tasks/${task._id}`, { subtasks: updatedSubtasks });
      const updatedTask = res.data.data;

      setTasks(prev => {
        const next = {};
        for (const slot in prev) {
          next[slot] = prev[slot].map(t => t._id === task._id ? updatedTask : t);
        }
        return next;
      });
    } catch (err) {
      showToast('Failed to update subtask', true);
    }
  };

  // Handle Drag End Reordering
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find active slot
    let activeSlot = null;
    let overSlot = null;

    // Search active slot
    for (const slot in tasks) {
      if (tasks[slot].some(t => t._id === activeId)) {
        activeSlot = slot;
        break;
      }
    }

    // Search over slot (either a slot container ID or another task card ID inside that slot)
    if (TIME_SLOTS.some(s => s.key === overId)) {
      overSlot = overId;
    } else {
      for (const slot in tasks) {
        if (tasks[slot].some(t => t._id === overId)) {
          overSlot = slot;
          break;
        }
      }
    }

    if (!activeSlot || !overSlot) return;

    if (activeSlot === overSlot && activeId === overId) return;

    // Reorder task items
    setTasks(prev => {
      const next = { ...prev };
      const activeList = [...next[activeSlot]];
      const activeIdx = activeList.findIndex(t => t._id === activeId);
      const [draggedItem] = activeList.splice(activeIdx, 1);
      
      // Update its slot in local memory state
      draggedItem.timeSlot = overSlot;

      if (activeSlot === overSlot) {
        const overIdx = activeList.findIndex(t => t._id === overId);
        activeList.splice(overIdx, 0, draggedItem);
        next[activeSlot] = activeList;
      } else {
        const overList = [...next[overSlot]];
        if (TIME_SLOTS.some(s => s.key === overId)) {
          overList.push(draggedItem);
        } else {
          const overIdx = overList.findIndex(t => t._id === overId);
          overList.splice(overIdx, 0, draggedItem);
        }
        next[activeSlot] = activeList;
        next[overSlot] = overList;
      }

      // Re-trigger API update in the background
      const newOrderList = next[overSlot].map(t => t._id);
      api.post('/planner/tasks/reorder', {
        taskId: activeId,
        newTimeSlot: overSlot,
        orderedIds: newOrderList
      }).catch(console.error);

      return next;
    });
  };

  const allTasks = Object.values(tasks).flat();
  const completed = allTasks.filter(t => t.status === 'Completed').length;
  const total = allTasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-900/40 border border-slate-800 rounded-xl w-48" />
      {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-900/40 border border-slate-800 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold border ${toast.err ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {toast.msg}
        </div>
      )}

      {/* Form Modals */}
      {modal === 'create' && (
        <TaskModal onClose={() => setModal(null)} onSave={handleSaveCreate} />
      )}
      {(modal === 'edit' && selectedTask) && (
        <TaskModal task={selectedTask} onClose={() => { setModal(null); setSelectedTask(null); }} onSave={handleSaveEdit} />
      )}
      {(modal === 'complete' && selectedTask) && (
        <CompleteTaskModal task={selectedTask} onClose={() => { setModal(null); setSelectedTask(null); }} onSave={handleSaveComplete} />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Daily Planner</h1>
          <p className="text-sm text-slate-400 mt-1">Organize your daily study schedule and spacing.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent font-medium shadow-sm transition"
          />
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow shadow-primary/25 transition"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 flex items-center gap-5 shadow-sm">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span className="font-bold">Daily Completion Progress</span>
              <span className="font-bold text-white">{completed} / {total} Tasks Finished</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-750" style={{ width: `${pct}%` }}/>
            </div>
          </div>
          <div className="text-3xl font-black text-white tabular-nums">{pct}%</div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all','Pending','In Progress','Completed'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
              filter === s 
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                : 'border-slate-800 bg-slate-900/10 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            {s === 'all' ? 'All Tasks' : s}
          </button>
        ))}
      </div>

      {/* Time Slots Area (Wraps in Drag context) */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="space-y-5">
          {TIME_SLOTS.map(slot => (
            <TimeSlotSection
              key={slot.key}
              slot={slot}
              tasks={tasks[slot.key] || []}
              onCompleteClick={handleCompleteClick}
              onDelete={handleDelete}
              onEditClick={handleEditClick}
              onSubtaskToggle={handleSubtaskToggle}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default Planner;
