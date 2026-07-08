import { Router } from 'express';
import { AuthController } from '../controllers/auth';

const router = Router();

router.post('/google-login', AuthController.google_login);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/info', AuthController.info);

export default router;