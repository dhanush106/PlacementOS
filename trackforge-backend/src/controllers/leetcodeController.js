import LeetcodeProblem from '../models/LeetcodeProblem.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { syncProfile as doSyncProfile } from '../services/leetcodeSyncService.js';
import { scheduleRevision, markRevised, getDueRevisions } from '../services/revisionEngine.js';
import { generateDailyQueue } from '../services/dailyQueueService.js';
import { getFullAnalytics } from '../services/analyticsEngine.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STRIVER_SHEET_PATH = path.join(__dirname, '..', 'config', 'striverA2ZSheet.json');

// Fetch user's logged problems & roadmap explorer
export const getProblems = async (req, res, next) => {
  try {
    const { difficulty, topic, status, page = 1, limit = 50, search, striverStep } = req.query;
    const filter = { userId: req.user.userId };

    if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;
    if (topic && topic !== 'all') filter.topic = topic;
    if (status && status !== 'all') filter.status = status;
    if (striverStep) filter.striverStep = parseInt(striverStep);

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { subtopic: { $regex: search, $options: 'i' } },
        { pattern: { $regex: search, $options: 'i' } }
      ];
    }

    const problems = await LeetcodeProblem.find(filter)
      .sort({ submissionDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await LeetcodeProblem.countDocuments(filter);

    return sendPaginated(
      res,
      problems,
      { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      'Problems fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Log a problem (manually or selected from seed)
export const logProblem = async (req, res, next) => {
  try {
    const {
      title, problemNumber, difficulty, topic, subtopic, pattern,
      companyTags, status, estimatedTime, actualTime, notes, link,
      favorite, striverSheetId, striverStep, striverSection
    } = req.body;

    if (!title || !difficulty || !topic) {
      throw new ValidationError('Title, difficulty, and topic are required');
    }

    const problem = new LeetcodeProblem({
      userId: req.user.userId,
      title,
      problemNumber: problemNumber || undefined,
      difficulty,
      topic,
      subtopic: subtopic || '',
      pattern: pattern || '',
      companyTags: companyTags || [],
      striverSheetId: striverSheetId || '',
      striverStep: striverStep || 0,
      striverSection: striverSection || '',
      status: status || 'Solved',
      estimatedTime: estimatedTime || 0,
      actualTime: actualTime || 0,
      notes: notes || '',
      link: link || '',
      favorite: favorite || false,
      submissionDate: new Date(),
      firstSolvedDate: new Date(),
      attempts: 1
    });

    if (status === 'Solved' || status === 'Revised') {
      await scheduleRevision(problem);
    }

    await problem.save();

    await AuditLog.create({
      userId: req.user.userId,
      eventType: 'leetcode_logged',
      description: `Logged problem: "${title}" (${difficulty})`,
      ipAddress: req.ip
    });

    return sendSuccess(res, problem, 'Problem logged successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Update problem details
export const updateProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = [
      'title', 'difficulty', 'topic', 'subtopic', 'pattern', 'companyTags',
      'status', 'notes', 'link', 'favorite', 'estimatedTime', 'actualTime',
      'personalRating', 'approach', 'mistakes', 'timeComplexity', 'spaceComplexity',
      'codeSnippet', 'revisionTips', 'importantPatterns'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(k => {
      if (allowed.includes(k)) updates[k] = req.body[k];
    });

    const problem = await LeetcodeProblem.findOne({ _id: id, userId: req.user.userId });
    if (!problem) throw new NotFoundError('Problem not found');

    // If marking as Solved from Not Started/Attempted, trigger revision schedule
    const oldStatus = problem.status;
    const newStatus = updates.status;
    
    Object.assign(problem, updates);

    if ((newStatus === 'Solved' || newStatus === 'Revised') && oldStatus !== 'Solved' && oldStatus !== 'Revised') {
      problem.submissionDate = new Date();
      if (!problem.firstSolvedDate) problem.firstSolvedDate = new Date();
      await scheduleRevision(problem);
    }

    await problem.save();

    return sendSuccess(res, problem, 'Problem updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete problem
export const deleteProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const problem = await LeetcodeProblem.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!problem) throw new NotFoundError('Problem not found');
    return sendSuccess(res, null, 'Problem deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get A2Z Striver roadmap overlayed with progress
export const getStriverSheet = async (req, res, next) => {
  try {
    const seedProblems = JSON.parse(fs.readFileSync(STRIVER_SHEET_PATH, 'utf8'));

    const userProblems = await LeetcodeProblem.find({ userId: req.user.userId });
    const userMap = {};
    userProblems.forEach(p => {
      if (p.striverSheetId) {
        userMap[p.striverSheetId] = p;
      } else if (p.problemNumber) {
        // Fallback match on problem number
        const match = seedProblems.find(sp => sp.problemNumber === p.problemNumber);
        if (match) userMap[match.id] = p;
      }
    });

    const overlaid = seedProblems.map(p => {
      const match = userMap[p.id];
      return {
        ...p,
        status: match ? match.status : 'Not Started',
        dbId: match ? match._id : null,
        favorite: match ? match.favorite : false,
        actualTime: match ? match.actualTime : 0,
        notes: match ? match.notes : '',
        personalRating: match ? match.personalRating : 0
      };
    });

    return sendSuccess(res, overlaid, 'Striver A2Z roadmap fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Get revision queue
export const getRevisionQueue = async (req, res, next) => {
  try {
    const due = await getDueRevisions(req.user.userId);
    return sendSuccess(res, due, 'Revision queue fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Mark problem as revised today
export const markProblemRevised = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { confidence } = req.body;
    const problem = await markRevised(id, req.user.userId, confidence);
    return sendSuccess(res, problem, 'Problem marked as revised successfully');
  } catch (error) {
    next(error);
  }
};

// Sync profile metrics
export const syncProfile = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) throw new ValidationError('LeetCode username is required');

    const user = await doSyncProfile(req.user.userId, username, req.ip);
    return sendSuccess(res, user, 'LeetCode profile synced successfully');
  } catch (error) {
    next(error);
  }
};

// Save user chosen topics list
export const saveChosenTopics = async (req, res, next) => {
  try {
    const { chosenTopics } = req.body;
    if (!Array.isArray(chosenTopics)) {
      throw new ValidationError('chosenTopics must be an array of strings');
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { chosenLeetcodeTopics: chosenTopics },
      { new: true }
    );

    return sendSuccess(res, user, 'Chosen topics saved successfully');
  } catch (error) {
    next(error);
  }
};

// Daily recommended question queue
export const getDailyRecommendations = async (req, res, next) => {
  try {
    const queue = await generateDailyQueue(req.user.userId);
    return sendSuccess(res, queue, 'Daily queue fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Advanced full analytics dashboard payload
export const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getFullAnalytics(req.user.userId);
    return sendSuccess(res, analytics, 'Advanced analytics fetched successfully');
  } catch (error) {
    next(error);
  }
};
