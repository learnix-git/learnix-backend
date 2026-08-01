import { Router } from 'express';
import { PaymentController } from '../controllers/payment-controllers';
import { compel } from '../middlewares/auth-middlewares';

const router = Router();

// GET
router.get('/my', compel, PaymentController.get_my_payments);

// POST
router.post('/contracts/:id/student-deposit', compel, PaymentController.student_deposit);
router.post('/contracts/:id/tutor-deposit', compel, PaymentController.tutor_deposit);
router.post('/contracts/:id/pay-final', compel, PaymentController.student_pay_final);

// PATCH
router.patch('/:id/confirm-payout', compel, PaymentController.confirm_payout);

export default router;