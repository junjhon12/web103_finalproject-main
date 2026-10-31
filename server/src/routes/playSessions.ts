import { Router } from 'express';
import {
  getSessions,
  logSession,
  updateSession,
  deleteSession
} from '../controllers/playSessions';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/game/:userGameId', getSessions);
router.post('/', logSession);
router.patch('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
