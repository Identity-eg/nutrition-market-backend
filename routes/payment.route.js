import { Router } from 'express';
import { authenticateUser } from '../middlewares/full-auth.js';
import { afterPayment, createPayment } from '../controllers/payment.js';

const router = Router();

router.route('/').post(authenticateUser, createPayment);
router.route('/after-payment').get(afterPayment);

export default router;
