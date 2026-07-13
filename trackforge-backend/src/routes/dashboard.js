import express from 'express';
import { getOverview } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', authenticate, getOverview);

export default router;
