import { Router } from 'express';
import { 
  getUserGoal, 
  createGoal, 
  updateGoal 
} from '../controllers/goals';

const router = Router();

// Get goal by user ID
router.get('/user/:userId', getUserGoal);

// Create a new goal
router.post('/', createGoal);

// Update an existing goal (e.g., incrementing a streak)
router.patch('/:id', updateGoal);

export default router;