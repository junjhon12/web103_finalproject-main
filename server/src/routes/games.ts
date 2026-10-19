import { Router } from 'express';
import { getGames, createGame, updateGame, deleteGame } from '../controllers/games';

const router = Router();

router.get('/', getGames);
router.post('/', createGame);
router.patch('/:id', updateGame);
router.delete('/:id', deleteGame);

export default router;