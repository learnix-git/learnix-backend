import { Router } from 'express';
import multer from 'multer';
import { DegreeController } from '../controllers/degree-controller';
import { compel } from '../middlewares/auth-middlewares';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
});

// GET
router.get('/', compel, DegreeController.get_degrees);

// POST
router.post('/', compel, upload.single('file'), DegreeController.create_degree);

// DELETE
router.delete('/:id', compel, DegreeController.delete_degree);

export default router;
