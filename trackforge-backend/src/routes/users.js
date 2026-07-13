import express from 'express';
import { getProfile, updateProfile, deleteAccount, uploadAvatar, changeEmail } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.post('/change-email', changeEmail);
router.delete('/account', deleteAccount);

export default router;
