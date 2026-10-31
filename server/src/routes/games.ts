import { Router } from 'express';
import { getGames, createGame, updateGame, deleteGame } from '../controllers/games';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// The global catalogue is shared by every user, so mutations require a login.
router.get('/', authenticateToken, getGames);
router.post('/', authenticateToken, createGame);
router.patch('/:id', authenticateToken, updateGame);
router.delete('/:id', authenticateToken, deleteGame);

export default router;
