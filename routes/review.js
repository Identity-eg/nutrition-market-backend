import { Router } from 'express';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/review.js';

const router = Router();

router
	.route('/')
	.post(authenticateUser, controllers.createReview)
	.get(controllers.getAllReviews);

router
	.route('/:id')
	.get(controllers.getSingleReview)
	.patch(authenticateUser, controllers.updateReview)
	.delete(authenticateUser, controllers.deleteReview);

export default router;
