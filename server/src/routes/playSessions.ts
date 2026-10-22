import { Router } from 'express';
import { 
  getSessions, 
  logSession, 
  updateSession, 
  deleteSession 
} from '../controllers/playSessions';

const router = Router();

// Get all sessions for a specific user's game library record
router.get('/game/:userGameId', getSessions);

// Log a new session
router.post('/', logSession);

// Update a specific session
router.patch('/:id', updateSession);

// Delete a specific session
router.delete('/:id', deleteSession);

export default router;