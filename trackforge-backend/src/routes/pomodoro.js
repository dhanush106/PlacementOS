import express from 'express';
import PomodoroSession from '../models/PomodoroSession.js';
import Task from '../models/Task.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

const router = express.Router();
router.use(authenticate);

// POST /api/pomodoro/sessions - Log a completed pomodoro session
router.post('/sessions', async (req, res, next) => {
  try {
    const { duration, type, taskId, taskLabel } = req.body;

    const session = new PomodoroSession({
      userId: req.user.userId,
      duration: duration || 25,
      type: type || 'work',
      taskId: taskId || null,
      taskLabel: taskLabel || '',
      completed: true,
      completedAt: new Date()
    });

    await session.save();

    // If linked to a task, increment pomodoroSessions counter on the Task
    if (taskId && type === 'work') {
      await Task.findOneAndUpdate(
        { _id: taskId, userId: req.user.userId },
        { $inc: { pomodoroSessions: 1, actualTime: duration || 25 } }
      );
    }

    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'pomodoro_logged',
      description: `Logged ${duration || 25}min ${type || 'work'} session${taskLabel ? ` on "${taskLabel}"` : ''}`,
      ipAddress: req.ip
    });

    return sendSuccess(res, session, 'Pomodoro session logged successfully', 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/pomodoro/stats - Statistics (today + weekly + all-time)
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const [sessionsToday, weeklyAgg, totalSessions, recentSessions] = await Promise.all([
      PomodoroSession.find({
        userId: req.user.userId,
        type: 'work',
        completed: true,
        completedAt: { $gte: startOfToday, $lte: endOfToday }
      }),
      PomodoroSession.aggregate([
        {
          $match: {
            userId: req.user.userId,
            type: 'work',
            completed: true,
            completedAt: { $gte: startOfWeek }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
            },
            sessions: { $sum: 1 },
            minutes: { $sum: '$duration' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      PomodoroSession.countDocuments({
        userId: req.user.userId,
        type: 'work',
        completed: true
      }),
      PomodoroSession.find({
        userId: req.user.userId,
        type: 'work',
        completed: true
      })
        .sort({ completedAt: -1 })
        .limit(10)
        .populate('taskId', 'title')
    ]);

    const focusMinutesToday = sessionsToday.reduce((s, x) => s + x.duration, 0);

    return sendSuccess(res, {
      sessionsToday: sessionsToday.length,
      focusMinutesToday,
      focusHoursToday: +(focusMinutesToday / 60).toFixed(1),
      totalSessionsAllTime: totalSessions,
      weeklyBreakdown: weeklyAgg,
      recentSessions
    }, 'Pomodoro stats fetched successfully');
  } catch (error) {
    next(error);
  }
});

// GET /api/pomodoro/task-sessions/:taskId - Get sessions for a specific task
router.get('/task-sessions/:taskId', async (req, res, next) => {
  try {
    const sessions = await PomodoroSession.find({
      userId: req.user.userId,
      taskId: req.params.taskId,
      type: 'work'
    }).sort({ completedAt: -1 });

    const totalMinutes = sessions.reduce((s, x) => s + x.duration, 0);

    return sendSuccess(res, {
      sessions,
      totalSessions: sessions.length,
      totalMinutes
    }, 'Task sessions fetched successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
