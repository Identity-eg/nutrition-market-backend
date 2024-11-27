import { Router } from 'express';
import {
	authenticateUser,
	authorizePermissions,
} from '../middlewares/full-auth.js';
import {
	createProduct,
	getAllProducts,
	getCompanyProducts,
	getSingleProduct,
	updateProduct,
	deleteProduct,
	getSimilarProducts,
	getSingleProductReviews,
	getSingleProductBySlug,
} from '../controllers/product.js';
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
		createProduct
	)
	.get(getAllProducts);

router.get(
	'/company/:id',
	authenticateUser,
	authorizePermissions(USER_ROLES.admin),
	getCompanyProducts
);

router.get('/slug/:slug', getSingleProductBySlug);

router
	.route('/:id')
	.get(getSingleProduct)
	.patch(
		[authenticateUser, authorizePermissions(...usersAllowedToAccessDashboard)],
		updateProduct
	)
	.delete(
		[authenticateUser, authorizePermissions(...usersAllowedToAccessDashboard)],
		deleteProduct
	);

router.route('/:id/reviews').get(getSingleProductReviews);
router.route('/:id/similar').get(getSimilarProducts);

export default router;
