import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import LeetcodeProblem from '../models/LeetcodeProblem.js';
import PomodoroSession from '../models/PomodoroSession.js';
import Subject from '../models/Subject.js';
import SystemDesignTopic from '../models/SystemDesignTopic.js';
import User from '../models/User.js';

const router = express.Router();
router.use(authenticate);

// GET /api/analytics/dashboard — comprehensive overview across all modules
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOf7Days = new Date(now);
    startOf7Days.setDate(now.getDate() - 6);
    startOf7Days.setHours(0, 0, 0, 0);

    const startOf30Days = new Date(now);
    startOf30Days.setDate(now.getDate() - 29);
    startOf30Days.setHours(0, 0, 0, 0);

    const [
      tasks,
      habits,
      leetcodeProblems,
      pomodoroSessions,
      subjects,
      systemDesignTopics,
      user
    ] = await Promise.all([
      Task.find({ userId, isRecurringTemplate: { $ne: true }, deletedAt: null }),
      Habit.find({ userId }),
      LeetcodeProblem.find({ userId }),
      PomodoroSession.find({ userId, type: 'work', completed: true }),
      Subject.find({ userId }),
      SystemDesignTopic.find({ userId }),
      User.findById(userId)
    ]);

    // ── Task Stats ───────────────────────────────────────────────────────
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const tasksToday = tasks.filter(t => new Date(t.createdAt) >= startOfToday);
    const completedToday = tasksToday.filter(t => t.status === 'Completed').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Task completion over last 7 days
    const taskTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const completed = tasks.filter(t =>
        t.status === 'Completed' &&
        new Date(t.updatedAt).toISOString().split('T')[0] === dStr
      ).length;
      taskTrend.push({ date: dStr, label: d.toLocaleDateString('en', { weekday: 'short' }), completed });
    }

    // ── Habit Stats ──────────────────────────────────────────────────────
    const totalHabits = habits.length;
    const activeHabits = habits.filter(h => h.isActive !== false);
    const avgStreak = activeHabits.length > 0
      ? Math.round(activeHabits.reduce((s, h) => s + (h.currentStreak || 0), 0) / activeHabits.length)
      : 0;
    const maxStreak = activeHabits.reduce((m, h) => Math.max(m, h.bestStreak || 0), 0);

    // Habit completion rates by name (top 6)
    const habitBreakdown = habits.slice(0, 6).map(h => ({
      name: h.name.length > 18 ? h.name.substring(0, 18) + '…' : h.name,
      streak: h.currentStreak || 0,
      best: h.bestStreak || 0,
      completionRate: h.completionRate || 0
    }));

    // ── LeetCode Stats ───────────────────────────────────────────────────
    const solvedLC = leetcodeProblems.filter(p => p.status === 'Solved');
    const easyLC = solvedLC.filter(p => p.difficulty === 'Easy').length;
    const mediumLC = solvedLC.filter(p => p.difficulty === 'Medium').length;
    const hardLC = solvedLC.filter(p => p.difficulty === 'Hard').length;

    // LC trend (last 7 days)
    const lcTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const solved = leetcodeProblems.filter(p =>
        p.status === 'Solved' &&
        new Date(p.submissionDate || p.createdAt).toISOString().split('T')[0] === dStr
      ).length;
      lcTrend.push({ date: dStr, label: d.toLocaleDateString('en', { weekday: 'short' }), solved });
    }

    // Topic distribution
    const topicMap = {};
    leetcodeProblems.forEach(p => {
      if (p.topic) topicMap[p.topic] = (topicMap[p.topic] || 0) + 1;
    });
    const topicDistribution = Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic, count]) => ({ topic, count }));

    // Synced LeetCode profile stats
    const leetcodeProfile = user?.leetcodeStats || null;

    // ── Pomodoro Stats ───────────────────────────────────────────────────
    const totalFocusMinutes = pomodoroSessions.reduce((s, p) => s + p.duration, 0);
    const sessionsToday = pomodoroSessions.filter(p => new Date(p.completedAt) >= startOfToday);
    const focusToday = sessionsToday.reduce((s, p) => s + p.duration, 0);

    // Pomodoro trend (last 7 days)
    const pomodoroTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const mins = pomodoroSessions
        .filter(p => new Date(p.completedAt).toISOString().split('T')[0] === dStr)
        .reduce((s, p) => s + p.duration, 0);
      pomodoroTrend.push({ date: dStr, label: d.toLocaleDateString('en', { weekday: 'short' }), minutes: mins });
    }

    // ── Subject/Study Stats ──────────────────────────────────────────────
    let totalTopics = 0;
    let confidentTopics = 0;
    const subjectProgress = subjects.map(s => {
      let total = 0, confident = 0;
      (s.chapters || []).forEach(c => {
        (c.topics || []).forEach(t => {
          total++;
          totalTopics++;
          if (t.status === 'confident') { confident++; confidentTopics++; }
        });
      });
      return {
        name: s.name,
        total,
        confident,
        pct: total > 0 ? Math.round((confident / total) * 100) : 0
      };
    });

    // ── System Design Stats ──────────────────────────────────────────────
    const sdTotal = systemDesignTopics.length;
    const sdMastered = systemDesignTopics.filter(t => t.status === 'mastered').length;
    const sdLearning = systemDesignTopics.filter(t => t.status === 'learning').length;

    // ── Combined Overview ────────────────────────────────────────────────
    return sendSuccess(res, {
      overview: {
        totalTasks, completedTasks, taskCompletionRate,
        completedToday, tasksToday: tasksToday.length,
        totalHabits, avgStreak, maxStreak,
        solvedLC: solvedLC.length, easyLC, mediumLC, hardLC,
        totalFocusMinutes, focusToday, totalFocusSessions: pomodoroSessions.length,
        studyMastery: totalTopics > 0 ? Math.round((confidentTopics / totalTopics) * 100) : 0,
        sdMastered, sdLearning
      },
      taskTrend,
      lcTrend,
      pomodoroTrend,
      habitBreakdown,
      topicDistribution,
      subjectProgress,
      leetcodeProfile
    }, 'Analytics dashboard fetched successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
