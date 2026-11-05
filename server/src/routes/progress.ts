import { Router } from 'express';
import {
  getProgressEntries,
  createProgressEntry,
  updateProgressEntry,
  deleteProgressEntry,
} from '../controllers/progress';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/game/:userGameId', getProgressEntries);
router.post('/', createProgressEntry);
router.patch('/:id', updateProgressEntry);
router.delete('/:id', deleteProgressEntry);

export default router;
