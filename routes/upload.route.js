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
import { usersAllowedToAccessDashboard } from '../constants/index.js';
import {
	resizeMultipleImage,
	resizeSingleImage,
	uploadWithMulter,
} from '../middlewares/upload.js';

router.post(
	'/single',
	authenticateUser,
	authorizePermissions(...usersAllowedToAccessDashboard),
	uploadWithMulter.single('image'),
	resizeSingleImage,
	uploadSingleImage
);

router.post(
	'/multiple',
	authenticateUser,
	authorizePermissions(...usersAllowedToAccessDashboard),
	uploadWithMulter.array('images', 5),
	resizeMultipleImage,
	uploadMultipleImage
);

export default router;
