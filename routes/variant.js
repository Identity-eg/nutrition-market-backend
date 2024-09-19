import { Router } from 'express';

const router = Router();
import {
  authenticateUser,
  authorizePermissions,
} from '../middlewares/full-auth.js';
import * as controllers from '../controllers/variant.js';
import { usersAllowedToAccessDashboard } from '../constants/index.js';

router
  .route('/')
  .post(
    authenticateUser,
    authorizePermissions(...usersAllowedToAccessDashboard),
    controllers.createVariant
  );

router
  .route('/:variantId')
  .get(
    authenticateUser,
    authorizePermissions(...usersAllowedToAccessDashboard),
    controllers.getVariant
  )
  .patch(
    authenticateUser,
    authorizePermissions(...usersAllowedToAccessDashboard),
    controllers.updateVariant
  )
  .delete(
    authenticateUser,
    authorizePermissions(...usersAllowedToAccessDashboard),
    controllers.deleteVariant
  );

export default router;
