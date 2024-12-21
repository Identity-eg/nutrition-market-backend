import { Router } from 'express';

const router = Router();
import {
	authenticateUser,
	authorizePermissions,
} from '../middlewares/full-auth.js';
import {
	blockUser,
	getAllUsers,
	getSingleUser,
	getUserForOtp,
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

router.patch(
	'/block',
	authenticateUser,
	authorizePermissions(USER_ROLES.superAdmin),
	blockUser
);

router.route('/otp/:id').get(getUserForOtp);

router
	.route('/:id')
	.get(authenticateUser, getSingleUser)

	.patch(authenticateUser, updateUser);

export default router;
