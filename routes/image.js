import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/image.js';

const router = Router();
router
  .route('/')
  .get(controllers.getImages)
  .post(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.createImage
  );

router
  .route('/:id')
  .get(controllers.getSingleImage)
  .patch(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.updateImage
  )
  .delete(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.deleteImage
  );

export default router;
