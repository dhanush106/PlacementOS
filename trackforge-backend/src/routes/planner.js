import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  addSubtask,
  reorderTasks
} from '../controllers/plannerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.post('/tasks/reorder', reorderTasks);
router.patch('/tasks/:id', updateTask);
router.post('/tasks/:id/complete', completeTask);
router.delete('/tasks/:id', deleteTask);
router.post('/tasks/:id/subtasks', addSubtask);

export default router;
