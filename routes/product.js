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
  uploadImage,
  getSimilarProducts,
  getSingleProductReviews,
} from '../controllers/product.js';

const router = Router();

router.route('/').post(createProduct).get(getAllProducts);

router
  .route('/uploadImage')
  .post([authenticateUser, authorizePermissions('admin')], uploadImage);

router
  .route('/:id')
  .get(getSingleProduct)
  .patch([authenticateUser, authorizePermissions('admin')], updateProduct)
  .delete([authenticateUser, authorizePermissions('admin')], deleteProduct);

router.route('/:id/reviews').get(getSingleProductReviews);
router.route('/:id/similar').get(getSimilarProducts);

export default router;
