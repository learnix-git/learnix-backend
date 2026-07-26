import { Router } from 'express';
import { SubjectController } from '../controllers/subject-controllers';

const router = Router();

// GET
router.get('/', SubjectController.get_subjects);

export default router;