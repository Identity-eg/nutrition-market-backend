import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/company.js';
import {
	USER_ROLES,
	usersAllowedToAccessDashboard,
} from '../constants/index.js';

const router = Router();
router
	.route('/')
	.post(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.createCompany
	)
	.get(controllers.getCompanys);

router.get('/slug/:slug', controllers.getSingleCompanyBySlug);

router
	.route('/:id')
	.get(controllers.getSingleCompanyById)
	.patch(
		authenticateUser,
		authorizePermissions(...usersAllowedToAccessDashboard),
		controllers.updateCompany
	)
	.delete(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.deleteCompany
	);

export default router;
