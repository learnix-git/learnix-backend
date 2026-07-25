import { Router } from 'express';
import { UserController } from '../controllers/user-controllers';
import { compel } from "../middlewares/auth-middlewares";

const router = Router();

// GET
router.get('/banks', compel, UserController.get_banks);
router.get('/tutors/:id', UserController.get_tutor_profile);
router.get('/students/:id', UserController.get_student_profile);
router.get('/:id/info', UserController.get_info);

// POST
router.post('/banks', compel, UserController.create_bank);

// PATCH
router.patch('/update-info', compel, UserController.update_info);
router.patch('/update-avatar', compel, UserController.update_avatar);

// DELETE
router.delete('/banks/:id', compel, UserController.delete_bank);

export default router;