import { Router } from 'express';
import {
  getUserGoal,
  createGoal,
  updateGoal
} from '../controllers/goals';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/user/:userId', getUserGoal);
router.post('/', createGoal);
router.patch('/:id', updateGoal);

export default router;
