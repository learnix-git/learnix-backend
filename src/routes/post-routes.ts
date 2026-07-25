import { Router } from 'express';
import { PostController } from '../controllers/post-controllers';
import { compel } from "../middlewares/auth-middlewares";

const router = Router();

// GET
router.get('/', PostController.get_posts);
router.get('/:id', PostController.get_post);

// POST
router.post('/', compel, PostController.create_post);

// PATCH
router.patch('/:id', compel, PostController.update_post);

// DELETE
router.delete('/:id', compel, PostController.delete_post);

export default router;