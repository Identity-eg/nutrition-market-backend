import { Router } from 'express';
import {
  authenticateUser,
  authorizePermissions,
} from '../middlewares/full-auth.js';
import * as orderCont from '../controllers/order.js';
const router = Router();

router
  .route('/')
  .post(authenticateUser, orderCont.createOrder)
  .get(authenticateUser, authorizePermissions('admin'), orderCont.getAllOrders);

router
  .route('/showAllMyOrders')
  .get(authenticateUser, orderCont.getCurrentUserOrders);

router
  .route('/:id')
  .get(authenticateUser, orderCont.getSingleOrder)
  .patch(authenticateUser, orderCont.updateOrder);

export default router;
