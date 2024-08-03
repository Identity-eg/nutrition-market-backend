import { Router } from 'express';

const router = Router();
import {
  authenticateUser,
  authorizePermissions,
} from '../middlewares/full-auth.js';
import {
  addAddress,
  blockUser,
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
} from '../controllers/user.js';
import { USER_ROLES } from '../constants/index.js';

router.get(
  '/',
  authenticateUser,
  authorizePermissions(USER_ROLES.superAdmin),
  getAllUsers
);

router.get('/getMe', authenticateUser, showCurrentUser);
router.patch('/updateUserPassword', authenticateUser, updateUserPassword);

router.post('/address', authenticateUser, addAddress);

router.patch(
  '/block',
  authenticateUser,
  authorizePermissions(USER_ROLES.superAdmin),
  blockUser
);

router
  .route('/:id')
  .get(authenticateUser, getSingleUser)
  .patch(authenticateUser, updateUser);

export default router;
