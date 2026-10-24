import { Router } from 'express';
import { resetDatabase } from '../controllers/reset';

const router = Router();

router.post('/', resetDatabase);

export default router;