import { Router } from 'express';
import { resetDatabase } from '../controllers/reset';
import { authenticateToken } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

router.post(
  '/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many reset attempts. Please try again later.',
  }),
  authenticateToken,
  resetDatabase
);

export default router;
