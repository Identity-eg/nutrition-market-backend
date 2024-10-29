import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/image.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();
router
	.route('/')
	.get(controllers.getImages)
	.post(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.createImage
	);

router
	.route('/:id')
	.get(controllers.getSingleImage)
	.patch(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.updateImage
	)
	.delete(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.deleteImage
	);

export default router;
