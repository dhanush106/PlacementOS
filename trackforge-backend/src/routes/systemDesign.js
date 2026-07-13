import express from 'express';
import SystemDesignTopic from '../models/SystemDesignTopic.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const router = express.Router();
router.use(authenticate);

// Column → status mapping
const COLUMN_STATUS = {
  'Backlog':   'not_started',
  'Learning':  'learning',
  'Revising':  'revising',
  'Mastered':  'mastered'
};

// GET /api/system-design — list topics grouped by kanban column
router.get('/', async (req, res, next) => {
  try {
    const { column, status } = req.query;
    const filter = { userId: req.user.userId };
    if (column) filter.column = column;
    if (status) filter.status = status;

    const topics = await SystemDesignTopic.find(filter).sort({ column: 1, order: 1 });

    // Group by column
    const grouped = {
      Backlog: [],
      Learning: [],
      Revising: [],
      Mastered: []
    };

    topics.forEach(t => {
      const col = t.column || 'Backlog';
      if (grouped[col]) grouped[col].push(t);
    });

    return sendSuccess(res, { topics, grouped }, 'System design topics fetched');
  } catch (error) {
    next(error);
  }
});

// POST /api/system-design — create new topic
router.post('/', async (req, res, next) => {
  try {
    const {
      title, description, tags, notes, resources,
      targetDate, column, completionPercentage
    } = req.body;

    if (!title) throw new ValidationError('Topic title is required');

    const col = column || 'Backlog';
    const topic = new SystemDesignTopic({
      userId: req.user.userId,
      title,
      description: description || '',
      tags: tags || [],
      notes: notes || '',
      resources: resources || [],
      targetDate: targetDate ? new Date(targetDate) : undefined,
      column: col,
      status: COLUMN_STATUS[col] || 'not_started',
      completionPercentage: completionPercentage || 0,
      order: await SystemDesignTopic.countDocuments({ userId: req.user.userId, column: col })
    });

    await topic.save();

    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'system_design_created',
      description: `Created system design topic: "${title}"`,
      ipAddress: req.ip
    });

    return sendSuccess(res, topic, 'System design topic created', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/system-design/:id — update topic (including column move)
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = [
      'title', 'description', 'tags', 'notes', 'resources',
      'targetDate', 'column', 'completionPercentage', 'timeSpent', 'pomodoroCount', 'order'
    ];
    const updates = {};
    Object.keys(req.body).forEach(k => {
      if (allowed.includes(k)) updates[k] = req.body[k];
    });

    // Keep status in sync with column when column is updated
    if (updates.column && COLUMN_STATUS[updates.column]) {
      updates.status = COLUMN_STATUS[updates.column];
    }

    const topic = await SystemDesignTopic.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!topic) throw new NotFoundError('System design topic not found');

    return sendSuccess(res, topic, 'Topic updated successfully');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/system-design/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const topic = await SystemDesignTopic.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!topic) throw new NotFoundError('System design topic not found');
    return sendSuccess(res, null, 'Topic deleted successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/system-design/reorder — bulk reorder within a column
router.post('/reorder', async (req, res, next) => {
  try {
    const { column, orderedIds } = req.body;
    if (!column || !Array.isArray(orderedIds)) {
      throw new ValidationError('column and orderedIds array required');
    }

    const bulkOps = orderedIds.map((id, idx) => ({
      updateOne: {
        filter: { _id: id, userId: req.user.userId },
        update: { $set: { order: idx, column } }
      }
    }));

    await SystemDesignTopic.bulkWrite(bulkOps);
    return sendSuccess(res, null, 'Reorder complete');
  } catch (error) {
    next(error);
  }
});

export default router;
