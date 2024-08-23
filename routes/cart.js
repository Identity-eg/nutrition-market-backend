import { Router } from 'express';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/cart.js';

const router = Router();

router
  .route('/')
  .get(controllers.getCart)
  .post(controllers.addItemToCart)
  .delete(controllers.deleteCart);

router.get('/sync', authenticateUser, controllers.syncCart);

router.post('/:itemId/reduce-one', controllers.reduceByone);
router.post('/:itemId/increase-one', controllers.increaseByone);

router.delete('/:itemId', controllers.deleteItemFromCart);

export default router;
