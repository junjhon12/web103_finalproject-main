import { Router } from 'express';
import {
  getUserLibrary,
  addGameToLibrary,
  updateLibraryGame,
  removeGameFromLibrary
} from '../controllers/userGames';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Every library operation is scoped to the authenticated user.
router.use(authenticateToken);

router.get('/user/:userId', getUserLibrary);
router.post('/', addGameToLibrary);
router.patch('/:id', updateLibraryGame);
router.delete('/:id', removeGameFromLibrary);

export default router;
