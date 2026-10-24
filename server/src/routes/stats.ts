import { Router } from 'express';
import { getUserStats } from '../controllers/stats';

const router = Router();

router.get('/user/:userId', getUserStats);

export default router;