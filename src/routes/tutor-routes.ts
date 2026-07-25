import { Router } from 'express';
import multer from 'multer';
import { TutorController } from '../controllers/tutor-controllers';
import { compel } from '../middlewares/auth-middlewares';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
});

// GET
router.get('/skills', compel, TutorController.get_skills);
router.get('/degrees', compel, TutorController.get_degrees);
router.get('/history', compel, TutorController.get_history);
router.get('/schedule', compel, TutorController.get_schedule);

// POST
router.post('/skills', compel, TutorController.create_skill);
router.post('/degrees', compel, upload.single('file'), TutorController.create_degree);
router.post('/history', compel, TutorController.create_history);

// PATCH
router.patch('/history/:id', compel, TutorController.update_history);

// PUT
router.put('/schedule', compel, TutorController.update_schedule);

// DELETE
router.delete('/skills/:topic', compel, TutorController.delete_skill);
router.delete('/degrees/:id', compel, TutorController.delete_degree);
router.delete('/history/:id', compel, TutorController.delete_history);

export default router;