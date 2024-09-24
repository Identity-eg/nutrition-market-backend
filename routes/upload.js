import { Router } from 'express';

const router = Router();
import {
  authenticateUser,
  authorizePermissions,
} from '../middlewares/full-auth.js';
import {
  uploadSingleImage,
  uploadMultipleImage,
} from '../controllers/upload.js';
import { USER_ROLES } from '../constants/index.js';
import {
  resizeMultipleImage,
  resizeSingleImage,
  uploadWithMulter,
} from '../middlewares/upload.js';

router.post(
  '/single',
  authenticateUser,
  authorizePermissions(USER_ROLES.superAdmin, USER_ROLES.admin),
  uploadWithMulter.single('image'),
  resizeSingleImage,
  uploadSingleImage
);

router.post(
  '/multiple',
  authenticateUser,
  authorizePermissions(USER_ROLES.superAdmin, USER_ROLES.admin),
  uploadWithMulter.array('images', 5),
  resizeMultipleImage,
  uploadMultipleImage
);

export default router;
