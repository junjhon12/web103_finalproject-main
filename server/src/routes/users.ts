import { Router } from 'express';
import { registerUser, loginUser, guestLogin } from '../controllers/users';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/guest', guestLogin);

export default router;