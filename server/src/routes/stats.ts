import { Router } from 'express';
import { getUserStats } from '../controllers/stats';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/user/:userId', authenticateToken, getUserStats);

export default router;
