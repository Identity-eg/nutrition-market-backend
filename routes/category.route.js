import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/category.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();
router
	.route('/')
	.post(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.createCategory
	)
	.get(controllers.getCategories);

router.get('/slug/:slug', controllers.getSingleCategoryBySlug);

router
	.route('/:id')
	.get(controllers.getSingleCategoryById)
	.patch(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.updateCategory
	)
	.delete(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.deleteCategory
	);

export default router;
