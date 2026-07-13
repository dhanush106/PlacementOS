import express from 'express';
import {
  getProblems,
  logProblem,
  updateProblem,
  deleteProblem,
  getStriverSheet,
  getRevisionQueue,
  markProblemRevised,
  syncProfile,
  saveChosenTopics,
  getDailyRecommendations,
  getAnalytics
} from '../controllers/leetcodeController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Core Problems Log Routing
router.get('/problems', getProblems);
router.post('/problems', logProblem);
router.patch('/problems/:id', updateProblem);
router.delete('/problems/:id', deleteProblem);

// Roadmap & Sheets Routing
router.get('/striver-sheet', getStriverSheet);

// Spaced Repetition Revision
router.get('/revision-queue', getRevisionQueue);
router.post('/problems/:id/revise', markProblemRevised);

// Live Sync & Chosen Topics Config
router.post('/sync', syncProfile);
router.post('/chosen-topics', saveChosenTopics);

// Recommendations & Queue Dashboard
router.get('/daily-recommendations', getDailyRecommendations);

// Advanced Performance Analytics
router.get('/analytics', getAnalytics);

export default router;
