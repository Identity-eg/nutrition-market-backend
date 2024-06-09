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

router
  .route('/')
  .get(authenticateUser, authorizePermissions('admin'), getAllUsers);

router.route('/getMe').get(authenticateUser, showCurrentUser);
router.route('/updateUserPassword').patch(authenticateUser, updateUserPassword);

router.route('/address').post(authenticateUser, addAddress);
router
  .route('/block')
  .put(authenticateUser, authorizePermissions('admin'), blockUser);

router
  .route('/:id')
  .get(authenticateUser, getSingleUser)
  .put(authenticateUser, updateUser);


export default router;
