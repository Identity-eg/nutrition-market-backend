import { Router } from 'express';
import {
	authenticateUser,
	authorizePermissions,
} from '../middlewares/full-auth.js';
import * as controllers from '../controllers/product.js';
import {
	USER_ROLES,
	usersAllowedToAccessDashboard,
} from '../constants/index.js';

const router = Router();

router
	.route('/')
	.post(
		authenticateUser,
		authorizePermissions(...usersAllowedToAccessDashboard),
		controllers.createProduct
	)
	.get(controllers.getAllProducts);

router.get('/offers', controllers.getOffers);

router.get(
	'/company/:id',
	authenticateUser,
	authorizePermissions(USER_ROLES.admin),
	controllers.getCompanyProducts
);

router.get('/slug/:slug', controllers.getSingleProductBySlug);

router
	.route('/:id')
	.get(controllers.getSingleProduct)
	.patch(
		[authenticateUser, authorizePermissions(...usersAllowedToAccessDashboard)],
		controllers.updateProduct
	)
	.delete(
		[authenticateUser, authorizePermissions(...usersAllowedToAccessDashboard)],
		controllers.deleteProduct
	);

router.route('/:id/reviews').get(controllers.getSingleProductReviews);
router.route('/:id/similar').get(controllers.getSimilarProducts);

export default router;
