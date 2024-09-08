import { Router } from 'express';
import {
  authenticateUser,
  authorizePermissions,
} from '../middlewares/full-auth.js';
import * as orderCont from '../controllers/order.js';
import { USER_ROLES } from '../constants/index.js';
const router = Router();

router
  .route('/')
  .post(orderCont.createOrder)
  .get(
    authenticateUser,
    authorizePermissions(USER_ROLES.superAdmin),
    orderCont.getAllOrders
  );

router
  .route('/showAllMyOrders')
  .get(authenticateUser, orderCont.getCurrentUserOrders);

router
  .route('/:id')
  .get(authenticateUser, orderCont.getSingleOrder)
  .patch(authenticateUser, orderCont.updateOrder);

export default router;
