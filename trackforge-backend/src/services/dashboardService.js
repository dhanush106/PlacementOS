import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import LeetcodeProblem from '../models/LeetcodeProblem.js';
import PomodoroSession from '../models/PomodoroSession.js';
import Quote from '../models/Quote.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Simple in-memory cache for dashboard metrics (30 seconds TTL)
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL
  });
};

export const getDashboardOverviewData = async (userId) => {
  const cacheKey = `dashboard_${userId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    logger.debug(`Dashboard cache hit for user: ${userId}`);
    return cached;
  }

  // Get start and end of today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Fetch Today's Tasks
  const tasksToday = await Task.find({
    userId,
    createdAt: { $gte: startOfToday, $lte: endOfToday },
    deletedAt: null
  });

  const totalTasks = tasksToday.length;
  const completedTasksObj = tasksToday.filter(t => t.status === 'Completed');
  const completedTasks = completedTasksObj.length;

  // 2. Fetch User's Habits
  const habits = await Habit.find({ userId });
  const totalHabits = habits.length;
  
  // Check completions today (comparing YYYY-MM-DD strings)
  const todayStr = new Date().toISOString().split('T')[0];
  const completedHabitsObj = habits.filter(h => 
    h.completions.some(c => c.date === todayStr)
  );
  const completedHabits = completedHabitsObj.length;

  // 3. Fetch Leetcode Problems Completed Today
  const leetcodeProblemsCount = await LeetcodeProblem.countDocuments({
    userId,
    source: 'leetcode-sync',
    status: { $in: ['Solved', 'Revised'] },
    submissionDate: { $gte: startOfToday, $lte: endOfToday }
  });

  // 4. Fetch Pomodoro Sessions Today
  const pomodoroSessionsToday = await PomodoroSession.find({
    userId,
    type: 'work',
    completed: true,
    completedAt: { $gte: startOfToday, $lte: endOfToday }
  });
  const pomodoroCount = pomodoroSessionsToday.length;
  const studyHoursToday = Number(((pomodoroCount * 25) / 60).toFixed(1)); // 25 mins per session

  // 5. Daily Progress %
  // Goal denominators
  const user = await User.findById(userId).select('leetcodeDailyGoal');
  const leetcodeGoal = user?.leetcodeDailyGoal || 5;
  const denominator = totalTasks + totalHabits + leetcodeGoal;
  const numerator = completedTasks + completedHabits + Math.min(leetcodeProblemsCount, leetcodeGoal);
  const dailyProgress = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

  // 6. Habit Completion %
  const habitCompletionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // 7. Today's Priority Task
  // Fetch from unfinished tasks created today or pending tasks
  const priorityTask = await Task.findOne({
    userId,
    status: { $ne: 'Completed' },
    deletedAt: null
  }).sort({ priority: 1, deadline: 1 }); // sorting priority 'High' (weight sorted)

  // 8. Daily Motivation Quote
  // Rotate based on day of year
  const quotesCount = await Quote.countDocuments();
  let quote = 'Your consistency today is your competitive advantage tomorrow.';
  let author = 'TrackForge';
  
  if (quotesCount > 0) {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / 86400000);
    const quoteIndex = dayOfYear % quotesCount;
    const randomQuote = await Quote.findOne().skip(quoteIndex);
    if (randomQuote) {
      quote = randomQuote.text;
      author = randomQuote.author;
    }
  }

  // 9. Weekly Heatmap (Last 7 Days)
  const weeklyHeatmap = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    // Sum up items completed on this day
    const tasksCount = await Task.countDocuments({
      userId,
      status: 'Completed',
      updatedAt: { $gte: dayStart, $lte: dayEnd },
      deletedAt: null
    });

    const leetcodeCount = await LeetcodeProblem.countDocuments({
      userId,
      source: 'leetcode-sync',
      status: { $in: ['Solved', 'Revised'] },
      submissionDate: { $gte: dayStart, $lte: dayEnd }
    });

    const habitsCount = await Habit.countDocuments({
      userId,
      completions: { $elemMatch: { date: dateStr } }
    });

    // Score is simply sum of completed items (contribution points)
    const score = (tasksCount * 10) + (leetcodeCount * 15) + (habitsCount * 5);

    weeklyHeatmap.push({
      date: dateStr,
      value: score
    });
  }

  // 10. Recent Activity (Last 5 completed actions)
  const activities = await AuditLog.find({ userId })
    .sort({ timestamp: -1 })
    .limit(5);

  const recentActivity = activities.map(act => ({
    type: act.eventType,
    description: act.description,
    timestamp: act.timestamp
  }));

  const data = {
    dailyProgress,
    studyHoursToday,
    leetcodeProblemsToday: leetcodeProblemsCount,
    habitCompletionPercentage,
    todaysPriorityTask: priorityTask ? {
      id: priorityTask._id,
      title: priorityTask.title,
      priority: priorityTask.priority,
      deadline: priorityTask.deadline,
      status: priorityTask.status
    } : null,
    pomodoroSessionsToday: pomodoroCount,
    dailyMotivationQuote: `"${quote}" - ${author}`,
    weeklyHeatmap,
    recentActivity
  };

  setCachedData(cacheKey, data);
  return data;
};
