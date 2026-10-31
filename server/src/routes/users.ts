import { Router } from 'express';
import { registerUser, loginUser, guestLogin } from '../controllers/users';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Throttle credential endpoints to slow down brute-force and guest spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again later.',
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/guest', authLimiter, guestLogin);

export default router;
