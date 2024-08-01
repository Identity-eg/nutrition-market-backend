import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/category.js';

const router = Router();
router
  .route('/')
  .post(
    // authenticateUser,
    // authorizePermissions('admin'),
    controllers.createCategory
  )
  .get(controllers.getCategories);

router
  .route('/:id')
  .get(controllers.getSingleCategory)
  .patch(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.updateCategory
  )
  .delete(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.deleteCategory
  );

export default router;
