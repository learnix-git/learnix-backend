import { Router } from 'express';
import { FollowController } from '../controllers/follow-controllers';
import { compel } from "../middlewares/auth-middlewares";

const router = Router();

// GET
router.get('/', compel, FollowController.get_follows);

// POST
router.post('/', compel, FollowController.create_follow);

// DELETE
router.delete('/:tutorId', compel, FollowController.delete_follow);

export default router;