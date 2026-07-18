import { Router } from 'express';
import multer from 'multer';
import { ChatController } from '../controllers/chat-controllers';
import { compel } from '../middlewares/auth-middlewares';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upsert', compel, ChatController.upsert);
router.post('/list', compel, ChatController.list);
router.post('/messages', compel, ChatController.messages);
router.post('/send', compel, ChatController.send);
router.post('/read', compel, ChatController.read);
router.post('/typing', compel, ChatController.typing);
router.post('/online', compel, ChatController.online);
router.post('/upload', compel, upload.single('file'), ChatController.upload);
router.post('/unread-count', compel, ChatController.unread);

export default router;