import { Router } from 'express';
import {
	authenticateUser,
	authorizePermissions,
} from '../middlewares/full-auth.js';
import {
	createProduct,
	getAllProducts,
	getSingleProduct,
	updateProduct,
	deleteProduct,
	// uploadImage,
	getSimilarProducts,
	getSingleProductReviews,
} from '../controllers/product.js';
import { usersAllowedToAccessDashboard } from '../constants/index.js';

const router = Router();

router.route('/').post(createProduct).get(getAllProducts);

// router
//   .route('/uploadImage')
//   .post(
//     [
//       authenticateUser,
//       authorizePermissions(USER_ROLES.superAdmin, USER_ROLES.admin),
//     ],
//     uploadImage
//   );

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
