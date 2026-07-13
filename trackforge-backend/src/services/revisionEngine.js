import LeetcodeProblem from '../models/LeetcodeProblem.js';

// Revision schedule intervals in days
const REVISION_INTERVALS = [1, 3, 7, 15, 30, 60, 90];

/**
 * Schedule future revisions when a problem is solved
 */
export const scheduleRevision = async (problem) => {
  const now = new Date();
  
  // Calculate next revision date (Day 1)
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + REVISION_INTERVALS[0]);
  nextDate.setHours(0, 0, 0, 0);

  problem.revisionRequired = true;
  problem.nextRevisionDate = nextDate;
  problem.revisedCount = 0;
  
  // Generate all scheduled target dates for reference
  const targetDates = REVISION_INTERVALS.map(days => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  
  problem.revisionDates = targetDates;
  // Initialize revision history
  problem.revisionHistory = [];
};

/**
 * Record a revision attempt and update to the next interval
 */
export const markRevised = async (problemId, userId, confidence) => {
  const problem = await LeetcodeProblem.findOne({ _id: problemId, userId });
  if (!problem) throw new Error('Problem not found');

  const now = new Date();
  
  // Add to revision history
  problem.revisionHistory.push({
    date: now,
    confidence: confidence || 3
  });

  const nextIndex = problem.revisedCount;
  problem.revisedCount += 1;

  if (nextIndex < REVISION_INTERVALS.length - 1) {
    // Determine next interval based on confidence:
    // If high confidence (4 or 5), skip to next interval
    // If low confidence (1 or 2), keep same interval or reset to day 1
    let intervalDays = REVISION_INTERVALS[nextIndex + 1];
    if (confidence <= 2) {
      intervalDays = REVISION_INTERVALS[0]; // Reset to Day 1
      problem.revisedCount = 0;
    }

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    nextDate.setHours(0, 0, 0, 0);

    problem.nextRevisionDate = nextDate;
    problem.status = 'Revised';
  } else {
    // Finished all 90 days of revision cycles
    problem.nextRevisionDate = null;
    problem.revisionRequired = false;
    problem.status = 'Solved'; // fully mastered
  }

  await problem.save();
  return problem;
};

/**
 * Get all due revisions for a user
 */
export const getDueRevisions = async (userId) => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  return await LeetcodeProblem.find({
    userId,
    revisionRequired: true,
    nextRevisionDate: { $lte: now }
  }).sort({ nextRevisionDate: 1 });
};

/**
 * Get all upcoming revisions (next 7 days)
 */
export const getUpcomingRevisions = async (userId) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  next7Days.setHours(23, 59, 59, 999);

  return await LeetcodeProblem.find({
    userId,
    revisionRequired: true,
    nextRevisionDate: { $gt: today, $lte: next7Days }
  }).sort({ nextRevisionDate: 1 });
};

/**
 * Get overdue revisions (nextRevisionDate is in the past)
 */
export const getOverdueRevisions = async (userId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return await LeetcodeProblem.find({
    userId,
    revisionRequired: true,
    nextRevisionDate: { $lt: startOfToday }
  }).sort({ nextRevisionDate: 1 });
};
