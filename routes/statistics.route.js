import { Router } from 'express';
import {
	authenticateUser,
	authorizePermissions,
} from '../middlewares/full-auth.js';
import * as controllers from '../controllers/statistics.js';
import { usersAllowedToAccessDashboard } from '../constants/index.js';

const router = Router();

router.get(
	'/total-sales',
	authenticateUser,
	authorizePermissions(...usersAllowedToAccessDashboard),
	controllers.getTotalSales
);
router.get(
	'/top-area-sales',
	authenticateUser,
	authorizePermissions(...usersAllowedToAccessDashboard),
	controllers.getTopAreaSales
);
router.get(
	'/monthly-sales/:year',
	authenticateUser,
	authorizePermissions(...usersAllowedToAccessDashboard),
	controllers.getMonthlySales
);
router.get(
	'/top-selling-products',
	authenticateUser,
	authorizePermissions(...usersAllowedToAccessDashboard),
	controllers.getTopSellingProducts
);
router.get('/top-selling-categories', controllers.getTopSellingCategories);

export default router;
