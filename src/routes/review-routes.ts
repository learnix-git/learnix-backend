import { Router } from 'express';
import { ReviewController } from '../controllers/review-controllers';
import { compel } from "../middlewares/auth-middlewares";

const router = Router();

// GET
router.get('/tutor/:id', ReviewController.get_reviews);

// POST
router.post('/', compel, ReviewController.create_review);

// DELETE
router.delete('/:id', compel, ReviewController.delete_review);

export default router;