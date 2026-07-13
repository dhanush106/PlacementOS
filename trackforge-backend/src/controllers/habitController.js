import Habit from '../models/Habit.js';
import AuditLog from '../models/AuditLog.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';

// ---- Streak Helpers ----
const calculateStreak = (completions) => {
  if (!completions || completions.length === 0) return { current: 0, longest: 0 };

  // Sort dates ascending
  const dates = completions
    .map(c => c.date)
    .sort((a, b) => new Date(a) - new Date(b));

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else if (diffDays > 1) {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  // Check if today or yesterday is the last entry (active streak)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastDate = dates[dates.length - 1];

  if (lastDate === today || lastDate === yesterday) {
    currentStreak = streak;
  } else {
    currentStreak = 0;
  }

  return { current: currentStreak, longest: longestStreak };
};

const generateHeatmap = (completions, days = 90) => {
  const heatmap = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = completions.filter(c => c.date === dateStr).length;
    heatmap.push({ date: dateStr, count });
  }
  return heatmap;
};

// ---- Controllers ----
export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user.userId });
    const today = new Date().toISOString().split('T')[0];

    const enriched = habits.map(h => {
      const streaks = calculateStreak(h.completions);
      const completedToday = h.completions.some(c => c.date === today);
      // Consistency: days completed in last 30 days
      const last30 = h.completions.filter(c => {
        const d = new Date(c.date);
        return d >= new Date(Date.now() - 30 * 86400000);
      }).length;
      const consistency = Math.round((last30 / 30) * 100);

      return {
        ...h.toObject(),
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        completedToday,
        consistency,
        heatmap: generateHeatmap(h.completions, 30)
      };
    });

    return sendSuccess(res, enriched, 'Habits fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const createHabit = async (req, res, next) => {
  try {
    const { name, category, color, icon, goal, goalType } = req.body;

    if (!name) throw new ValidationError('Habit name is required');

    const habit = new Habit({
      userId: req.user.userId,
      name,
      category: category || 'custom',
      color: color || '#6366f1',
      icon: icon || 'activity',
      goal: goal || 1,
      goalType: goalType || 'times_per_day'
    });

    await habit.save();

    return sendSuccess(res, habit, 'Habit created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['name', 'category', 'color', 'icon', 'goal', 'goalType'];
    const updates = {};
    Object.keys(req.body).forEach(k => { if (allowed.includes(k)) updates[k] = req.body[k]; });

    const habit = await Habit.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!habit) throw new NotFoundError('Habit not found');

    return sendSuccess(res, habit, 'Habit updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!habit) throw new NotFoundError('Habit not found');
    return sendSuccess(res, null, 'Habit deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const completeHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, notes } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    const habit = await Habit.findOne({ _id: id, userId: req.user.userId });
    if (!habit) throw new NotFoundError('Habit not found');

    // Check if already completed today
    const alreadyDone = habit.completions.some(c => c.date === dateStr);
    if (alreadyDone) {
      throw new ConflictError('Habit already completed for this date', 'ALREADY_COMPLETED');
    }

    habit.completions.push({ date: dateStr, count: 1, notes: notes || '' });

    // Recalculate streaks
    const streaks = calculateStreak(habit.completions);
    habit.currentStreak = streaks.current;
    habit.longestStreak = streaks.longest;

    await habit.save();

    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'habit_completed',
      description: `Completed habit: "${habit.name}" on ${dateStr}`,
      ipAddress: req.ip
    });

    return sendSuccess(res, {
      habit,
      completion: { date: dateStr, count: 1, streak: streaks.current }
    }, 'Habit logged successfully');
  } catch (error) {
    next(error);
  }
};

export const getHabitHeatmap = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year } = req.query;

    const habit = await Habit.findOne({ _id: id, userId: req.user.userId });
    if (!habit) throw new NotFoundError('Habit not found');

    // Filter to year if provided, otherwise full year
    const targetYear = parseInt(year) || new Date().getFullYear();
    const startOfYear = new Date(`${targetYear}-01-01`);
    const endOfYear = new Date(`${targetYear}-12-31`);

    const yearCompletions = habit.completions.filter(c => {
      const d = new Date(c.date);
      return d >= startOfYear && d <= endOfYear;
    });

    const heatmap = generateHeatmap(yearCompletions, 365);

    return sendSuccess(res, {
      habitId: habit._id,
      habitName: habit.name,
      year: targetYear,
      heatmap
    }, 'Heatmap data fetched successfully');
  } catch (error) {
    next(error);
  }
};
