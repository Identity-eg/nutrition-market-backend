import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/sub-category.js';

const router = Router();
router
  .route('/')
  .post(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.createSubCategory
  )
  .get(controllers.getSubCategories);

router
  .route('/:id')
  .patch(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.updateSubCategory
  )
  .delete(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.deleteSubCategory
  );

export default router;
