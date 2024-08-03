import { Router } from 'express';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/cart.js';

const router = Router();

router
  .route('/')
  .get(authenticateUser, controllers.getCart)
  .post(authenticateUser, controllers.addItemToCart)
  .delete(authenticateUser, controllers.deleteCart);

router.post('/sync', authenticateUser, controllers.syncCart)

router.post('/:itemId/reduce-one', authenticateUser, controllers.reduceByone);
router.post(
  '/:itemId/increase-one',
  authenticateUser,
  controllers.increaseByone
);

router.delete('/:itemId', authenticateUser, controllers.deleteItemFromCart);

export default router;
