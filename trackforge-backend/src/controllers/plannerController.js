import Task from '../models/Task.js';
import AuditLog from '../models/AuditLog.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const getTasks = async (req, res, next) => {
  try {
    const { date, timeSlot, status, priority, page = 1, limit = 50 } = req.query;

    const filter = {
      userId: req.user.userId,
      deletedAt: null,
      isRecurringTemplate: { $ne: true }
    };

    // Date filter
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.$or = [
        {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          recurrenceParentId: null
        },
        {
          recurrenceDate: startOfDay
        }
      ];
    }

    if (timeSlot && timeSlot !== 'all') filter.timeSlot = timeSlot;
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;

    const tasks = await Task.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    // Group by time slots
    const grouped = {
      morning: tasks.filter(t => t.timeSlot === 'morning'),
      afternoon: tasks.filter(t => t.timeSlot === 'afternoon'),
      evening: tasks.filter(t => t.timeSlot === 'evening'),
      night: tasks.filter(t => t.timeSlot === 'night')
    };

    return sendPaginated(
      res,
      grouped,
      { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      'Tasks fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, timeSlot, priority, estimatedTime, deadline, recurring, tags, pomodoroSessions, subtasks } = req.body;

    if (!title || !timeSlot) {
      throw new ValidationError('Title and time slot are required');
    }

    const isRecurring = recurring && recurring.pattern && recurring.pattern !== 'none';

    const task = new Task({
      userId: req.user.userId,
      title,
      description,
      timeSlot,
      priority: priority || 'Medium',
      estimatedTime: estimatedTime || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      recurring: recurring || { pattern: 'none' },
      isRecurringTemplate: isRecurring,
      tags: tags || [],
      pomodoroSessions: pomodoroSessions || 0,
      subtasks: subtasks || []
    });

    await task.save();

    let responseTask = task;

    // If it is a template, generate today's instance immediately
    if (isRecurring) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const subtasksCopy = (subtasks || []).map(st => ({
        title: st.title,
        completed: false
      }));

      const instance = new Task({
        userId: req.user.userId,
        title,
        description,
        timeSlot,
        priority: priority || 'Medium',
        estimatedTime: estimatedTime || 0,
        deadline: deadline ? new Date(deadline) : undefined,
        tags: tags || [],
        subtasks: subtasksCopy,
        status: 'Not Started',
        isRecurringTemplate: false,
        recurrenceParentId: task._id,
        recurrenceDate: today
      });

      await instance.save();
      responseTask = instance;
    }

    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'task_created',
      description: `Created task: "${title}"`,
      ipAddress: req.ip
    });

    return sendSuccess(res, responseTask, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowedUpdates = ['title', 'description', 'timeSlot', 'priority', 'status', 'estimatedTime', 'actualTime', 'deadline', 'tags', 'pomodoroSessions', 'subtasks', 'recurring'];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) updates[key] = req.body[key];
    });

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.userId, deletedAt: null },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

export const completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualTime, notes } = req.body;

    const task = await Task.findOne({ _id: id, userId: req.user.userId, deletedAt: null });
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    task.status = 'Completed';
    if (actualTime !== undefined) task.actualTime = actualTime;

    // Mark all subtasks as completed
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(st => { st.completed = true; });
    }

    await task.save();

    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'task_completed',
      description: `Completed task: "${task.title}"`,
      ipAddress: req.ip,
      metadata: { taskId: task._id, actualTime, notes }
    });

    return sendSuccess(res, task, 'Task marked as completed');
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addSubtask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) throw new ValidationError('Subtask title is required');

    const task = await Task.findOne({ _id: id, userId: req.user.userId, deletedAt: null });
    if (!task) throw new NotFoundError('Task not found');

    task.subtasks.push({ title, completed: false });
    await task.save();

    return sendSuccess(res, task, 'Subtask added successfully');
  } catch (error) {
    next(error);
  }
};

export const reorderTasks = async (req, res, next) => {
  try {
    const { taskId, newTimeSlot, newStatus, orderedIds } = req.body;

    const task = await Task.findOne({ _id: taskId, userId: req.user.userId, deletedAt: null });
    if (!task) throw new NotFoundError('Task not found');

    if (newTimeSlot) task.timeSlot = newTimeSlot;
    if (newStatus) task.status = newStatus;
    await task.save();

    if (Array.isArray(orderedIds) && orderedIds.length > 0) {
      const bulkOps = orderedIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id, userId: req.user.userId },
          update: { $set: { order: index } }
        }
      }));
      await Task.bulkWrite(bulkOps);
    }

    return sendSuccess(res, task, 'Task reordered successfully');
  } catch (error) {
    next(error);
  }
};
