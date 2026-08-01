import { Router } from 'express';
import { SkillController } from '../controllers/skill-controller';
import { compel } from '../middlewares/auth-middlewares';

const router = Router();

// GET
router.get('/', compel, SkillController.get_skills);

// POST
router.post('/', compel, SkillController.create_skill);

// DELETE
router.delete('/:topic', compel, SkillController.delete_skill);

export default router;
