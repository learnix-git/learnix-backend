import { Router } from 'express';
import { RequestController } from '../controllers/request-controllers';
import { compel, extract } from "../middlewares/auth-middlewares";

const router = Router();

// GET
router.get('/', extract, RequestController.get_requests);
router.get('/:id', extract, RequestController.get_request);

// POST
router.post('/', compel, RequestController.create_request);

// PATCH
router.patch('/:id', compel, RequestController.update_request);

// DELETE
router.delete('/:id', compel, RequestController.delete_request);

export default router;