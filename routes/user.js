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

router.get('/', authenticateUser, authorizePermissions('admin'), getAllUsers);

router.get('/getMe', authenticateUser, showCurrentUser);
router.patch('/updateUserPassword', authenticateUser, updateUserPassword);

router.post('/address', authenticateUser, addAddress);

router.patch(
  '/block',
  authenticateUser,
  authorizePermissions('admin'),
  blockUser
);

router
  .route('/:id')
  .get(authenticateUser, getSingleUser)
  .patch(authenticateUser, updateUser);

export default router;
