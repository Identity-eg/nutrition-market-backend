import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/dosageForm.js';
import { USER_ROLES } from '../constants/index.js';

const router = Router();
router
	.route('/')
	.post(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.createDosageForm
	)
	.get(controllers.getDosageForms);

router
	.route('/:id')
	.get(controllers.getSingleDosageForm)
	.patch(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.updateDosageForm
	)
	.delete(
		authenticateUser,
		authorizePermissions(USER_ROLES.superAdmin),
		controllers.deleteDosageForm
	);

export default router;
