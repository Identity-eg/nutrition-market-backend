import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/color.js';

const router = Router();
router
	.route('/')
	.post(
		authenticateUser,
		authorizePermissions('admin'),
		controllers.createColor
	)
	.get(controllers.getColors);

router
	.route('/:id')
	.patch(
		authenticateUser,
		authorizePermissions('admin'),
		controllers.updateColor
	)
	.delete(
		authenticateUser,
		authorizePermissions('admin'),
		controllers.deleteColor
	);

export default router;
