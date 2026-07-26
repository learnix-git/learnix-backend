import { Router } from 'express';
import { BookmarkController } from '../controllers/bookmark-controllers';
import { compel } from "../middlewares/auth-middlewares";

const router = Router();

// GET
router.get('/', compel, BookmarkController.get_bookmarks);

// POST
router.post('/', compel, BookmarkController.create_bookmark);

// DELETE
router.delete('/:requestId', compel, BookmarkController.delete_bookmark);

export default router;