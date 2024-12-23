import { Router } from 'express';

const router = Router();
import {
	authenticateUser,
	authorizePermissions,
} from '../middlewares/full-auth.js';
import * as controllers from '../controllers/user.js';
import { USER_ROLES } from '../constants/index.js';

router.get(
	'/',
	authenticateUser,
	authorizePermissions(USER_ROLES.superAdmin),
	controllers.getAllUsers
);

router.get('/getMe', authenticateUser, controllers.showCurrentUser);
router.patch(
	'/updateUserPassword',
	authenticateUser,
	controllers.updateUserPassword
);

router.patch(
	'/block',
	authenticateUser,
	authorizePermissions(USER_ROLES.superAdmin),
	controllers.blockUser
);

router.route('/verify-email/:id').get(controllers.getUserForVerification);

router
	.route('/:id')
	.get(authenticateUser, controllers.getSingleUser)

	.patch(authenticateUser, controllers.updateUser);

export default router;
