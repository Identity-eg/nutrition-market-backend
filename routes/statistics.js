import { Router } from 'express';
import {
	authenticateUser,
	authorizePermissions,
} from '../middlewares/full-auth.js';
import * as controllers from '../controllers/statistics.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();

router.get(
	'/total-sales',
	authenticateUser,
	authorizePermissions(USER_ROLES.admin, USER_ROLES.superAdmin),
	controllers.getTotalSales
);
router.get(
	'/monthly-sales/:year',
	authenticateUser,
	authorizePermissions(USER_ROLES.admin, USER_ROLES.superAdmin),
	controllers.getMonthlySales
);

export default router;
