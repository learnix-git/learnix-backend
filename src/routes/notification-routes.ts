import { Router } from 'express';
import { NotificationController } from '../controllers/notification-controllers';
import { compel } from '../middlewares/auth-middlewares';

const router = Router();

router.post('/', compel, NotificationController.list);
router.post('/read', compel, NotificationController.read);
router.post('/read-group', compel, NotificationController.readGroup);
router.post('/read-all', compel, NotificationController.readAll);

export default router;