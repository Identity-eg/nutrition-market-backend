import { Router } from 'express';
import { authorizePermissions } from '../middlewares/full-auth.js';
import { authenticateUser } from '../middlewares/full-auth.js';
import * as controllers from '../controllers/company.js';

const router = Router();
router
  .route('/')
  .post(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.createCompany
  )
  .get(controllers.getCompanys);

router
  .route('/:id')
  .patch(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.updateCompany
  )
  .delete(
    authenticateUser,
    authorizePermissions('admin'),
    controllers.deleteCompany
  );

export default router;
