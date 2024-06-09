import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/brand.js';

const router = Router();
router
  .route('/')
  .post(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.createBrand
  )
  .get(controllers.getBrands);

router
  .route('/:id')
  .patch(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.updateBrand
  )
  .delete(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.deleteBrand
  );

export default router;
