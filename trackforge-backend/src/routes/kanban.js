import express from 'express';
import Task from '../models/Task.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const router = express.Router();
router.use(authenticate);

// GET /api/kanban/board — fetch all tasks grouped by kanban column
router.get('/board', async (req, res, next) => {
  try {
    const tasks = await Task.find({
      userId: req.user.userId,
      isRecurringTemplate: { $ne: true },
      deletedAt: null
    }).sort({ order: 1 });

    const board = {
      Backlog: [],
      Today: [],
      'In Progress': [],
      Review: [],
      Completed: []
    };

    // Group tasks into columns, initializing kanbanColumn if missing based on status
    tasks.forEach(t => {
      let col = t.kanbanColumn;
      if (!col) {
        if (t.status === 'Completed') col = 'Completed';
        else if (t.status === 'In Progress') col = 'In Progress';
        else col = 'Backlog';
      }
      if (board[col]) {
        board[col].push(t);
      } else {
        board.Backlog.push(t);
      }
    });

    return sendSuccess(res, board, 'Kanban board state fetched successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/kanban/tasks/:id/move — move a task between columns and reorder
router.post('/tasks/:id/move', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetColumn, orderedIds } = req.body;

    if (!targetColumn) throw new ValidationError('targetColumn is required');

    const task = await Task.findOne({ _id: id, userId: req.user.userId });
    if (!task) throw new NotFoundError('Task not found');

    const previousColumn = task.kanbanColumn || 'Backlog';
    task.kanbanColumn = targetColumn;

    // Keep status in sync with column transitions
    if (targetColumn === 'Completed') {
      task.status = 'Completed';
    } else if (targetColumn === 'In Progress') {
      task.status = 'In Progress';
    } else {
      task.status = 'Not Started';
    }

    await task.save();

    // If orderedIds are provided, do a bulk write to reorder the target column
    if (orderedIds && Array.isArray(orderedIds)) {
      const bulkOps = orderedIds.map((tid, idx) => ({
        updateOne: {
          filter: { _id: tid, userId: req.user.userId },
          update: { $set: { order: idx, kanbanColumn: targetColumn } }
        }
      }));
      await Task.bulkWrite(bulkOps);
    }

    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'task_moved_kanban',
      description: `Moved task "${task.title}" from "${previousColumn}" to "${targetColumn}"`,
      ipAddress: req.ip
    });

    return sendSuccess(res, task, 'Task moved successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/kanban/tasks/:id/subtasks — add a subtask to a task
router.post('/tasks/:id/subtasks', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) throw new ValidationError('Subtask title is required');

    const task = await Task.findOne({ _id: id, userId: req.user.userId });
    if (!task) throw new NotFoundError('Task not found');

    task.subtasks.push({ title, completed: false });
    await task.save();

    return sendSuccess(res, task, 'Subtask added successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
