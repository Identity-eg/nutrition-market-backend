import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/dosageForm.js';

const router = Router();
router
  .route('/')
  .post(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.createDosageForm
  )
  .get(controllers.getDosageForms);

router
  .route('/:id')
  .get(controllers.getSingleDosageForm)
  .patch(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.updateDosageForm
  )
  .delete(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.deleteDosageForm
  );

export default router;
