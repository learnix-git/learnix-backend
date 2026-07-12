import { Router } from 'express';
import { AuthController } from '../controllers/auth-controllers';
import { compel } from "../middlewares/auth-middlewares"; 

const router = Router();

// GET
router.get('/info', compel, AuthController.info);

// POST
router.post('/google-login', AuthController.google_login);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgot_password);

export default router;