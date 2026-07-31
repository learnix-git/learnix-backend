import { Router } from 'express';
import { ContractController } from '../controllers/contract-controllers';
import { compel } from '../middlewares/auth-middlewares';

const router = Router();

// GET
router.get('/my',       compel, ContractController.get_my_contracts_student);
router.get('/tutor',    compel, ContractController.get_my_contracts_tutor);
router.get('/:id',      compel, ContractController.get_contract);

// POST
router.post('/', compel, ContractController.create_contract);

// PATCH
router.patch('/:id/accept',  compel, ContractController.accept_contract);
router.patch('/:id/reject',  compel, ContractController.reject_contract);
router.patch('/:id/cancel',  compel, ContractController.cancel_contract);
router.patch('/:id/finish',  compel, ContractController.finish_contract);

export default router;
