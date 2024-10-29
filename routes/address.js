import { Router } from 'express';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/address.js';

const router = Router();

router
	.route('/')
	.get(authenticateUser, controllers.getAddresses)
	.post(authenticateUser, controllers.createAddress);

router
	.route('/:addressId')
	.get(authenticateUser, controllers.getSingleAddress)
	.patch(authenticateUser, controllers.updateAddress)
	.delete(authenticateUser, controllers.deleteAddress);

export default router;
