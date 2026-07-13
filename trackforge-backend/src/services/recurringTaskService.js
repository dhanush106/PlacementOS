import Task from '../models/Task.js';
import logger from '../utils/logger.js';

/**
 * Checks if a date matches a recurrence pattern relative to the template's start date.
 */
const matchesPattern = (pattern, today, templateDate) => {
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  switch (pattern) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'weekly':
      return dayOfWeek === templateDate.getDay();
    case 'monthly':
      return today.getDate() === templateDate.getDate();
    default:
      return false;
  }
};

/**
 * Generates daily task instances from templates for a specific date (defaults to today).
 */
export const generateDailyRecurringTasks = async (targetDate = new Date()) => {
  try {
    const startOfTargetDay = new Date(targetDate);
    startOfTargetDay.setHours(0, 0, 0, 0);

    const endOfTargetDay = new Date(targetDate);
    endOfTargetDay.setHours(23, 59, 59, 999);

    // Fetch all active recurring templates
    const templates = await Task.find({
      isRecurringTemplate: true,
      deletedAt: null
    });

    logger.info(`Found ${templates.length} recurring task templates. Checking matches for date: ${startOfTargetDay.toDateString()}`);

    let generatedCount = 0;

    for (const template of templates) {
      // If template has endDate and it is in the past, skip it
      if (template.recurring.endDate && new Date(template.recurring.endDate) < startOfTargetDay) {
        continue;
      }

      const templateCreatedAt = new Date(template.createdAt);

      if (matchesPattern(template.recurring.pattern, startOfTargetDay, templateCreatedAt)) {
        // Check if instance already exists for this template on this day
        const existingInstance = await Task.findOne({
          recurrenceParentId: template._id,
          recurrenceDate: startOfTargetDay,
          deletedAt: null
        });

        if (!existingInstance) {
          // Copy template but configure as instance
          const subtasksCopy = template.subtasks.map(st => ({
            title: st.title,
            completed: false
          }));

          const taskInstance = new Task({
            userId: template.userId,
            title: template.title,
            description: template.description,
            timeSlot: template.timeSlot,
            priority: template.priority,
            estimatedTime: template.estimatedTime,
            deadline: template.deadline, // Copy template deadline
            tags: template.tags,
            subtasks: subtasksCopy,
            status: 'Not Started',
            isRecurringTemplate: false,
            recurrenceParentId: template._id,
            recurrenceDate: startOfTargetDay
          });

          await taskInstance.save();
          generatedCount++;
          logger.debug(`Generated recurring task instance: "${taskInstance.title}" for user: ${taskInstance.userId}`);
        }
      }
    }

    if (generatedCount > 0) {
      logger.info(`Successfully generated ${generatedCount} recurring task instances.`);
    } else {
      logger.info('No new recurring task instances generated today.');
    }
  } catch (error) {
    logger.error('Failed to generate daily recurring tasks:', error);
  }
};

let schedulerInterval = null;
let lastCheckedDateStr = null;

/**
 * Starts the background runner checking every hour if the day changed.
 */
export const startRecurringTaskScheduler = () => {
  const checkAndRun = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (lastCheckedDateStr !== todayStr) {
      logger.info(`Day transition detected (${lastCheckedDateStr} -> ${todayStr}). Running scheduler.`);
      await generateDailyRecurringTasks();
      lastCheckedDateStr = todayStr;
    }
  };

  // Run on start
  checkAndRun().catch(err => logger.error('Recurring task scheduler error on startup:', err));

  // Check every hour
  schedulerInterval = setInterval(() => {
    checkAndRun().catch(err => logger.error('Recurring task scheduler error in loop:', err));
  }, 60 * 60 * 1000);

  logger.info('Recurring task background scheduler started.');
};

/**
 * Stops the scheduler (useful for testing/hot reloads).
 */
export const stopRecurringTaskScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Recurring task background scheduler stopped.');
  }
};
