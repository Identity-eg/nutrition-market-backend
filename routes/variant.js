import { Router } from 'express';
import {
  authenticateUser,
  authorizePermissions,
} from '../middlewares/full-auth.js';
import * as controllers from '../controllers/variant.js';

const router = Router();

router
  .route('/')
  .post(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.createVariant
  );
// .get(controllers.getAllVariants);

router
  .route('/:id')
  .get(controllers.getSingleVariant)
  .patch(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.updateVariant
  )
  .delete(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.deleteVariant
  );

export default router;
