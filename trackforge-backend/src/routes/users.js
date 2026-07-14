import express from 'express';
import { getProfile, updateProfile, deleteAccount, changeEmail } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/change-email', changeEmail);
router.delete('/account', deleteAccount);

export default router;
