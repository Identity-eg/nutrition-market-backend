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
	.post(orderCont.createOnlineOrder)
	.get(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		orderCont.getAllOrders
	);

router
	.route('/cash-on-delivery')
	.post(authenticateUser, orderCont.createCashOnDeliveryOrder);

router
	.route('/my-orders')
	.get(authenticateUser, orderCont.getCurrentUserOrders);
router
	.route('/my-company-orders')
	.get(
		authenticateUser,
		authorizePermissions(USER_ROLES.admin),
		orderCont.getCompanyOrders
	);

router
	.route('/:id')
	.get(authenticateUser, orderCont.getSingleOrder)
	.patch(authenticateUser, orderCont.updateOrder)
	.delete(authenticateUser, orderCont.cancelOrder);

export default router;
