import { Router } from 'express';
import { 
  getUserLibrary, 
  addGameToLibrary, 
  updateLibraryGame, 
  removeGameFromLibrary 
} from '../controllers/userGames';

const router = Router();

// Get a specific user's populated library
router.get('/user/:userId', getUserLibrary);

// Add a game to a library
router.post('/', addGameToLibrary);

// Update a specific library record (rating, status, review)
router.patch('/:id', updateLibraryGame);

// Remove a specific record from a library
router.delete('/:id', removeGameFromLibrary);

export default router;