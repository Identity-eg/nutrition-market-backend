import { Router } from 'express';
import {
	authenticateUser,
	authorizePermissions,
} from '../middlewares/full-auth.js';
import * as controllers from '../controllers/coupon.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router
	.route('/')
	.get(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin, USER_ROLES.admin),
		controllers.getCoupons
	)
	.post(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin, USER_ROLES.admin),
		controllers.createCoupon
	);

router.route('/apply-coupon').post(controllers.applyCoupon);
router.route('/remove-coupon').post(controllers.removeCouponFromCart);

export default router;
