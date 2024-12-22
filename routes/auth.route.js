import { Router } from 'express';
import * as controllers from '../controllers/auth.js';
import loginLimiter from '../middlewares/loginLimiter.js';

const router = Router();

router.post('/register', loginLimiter, controllers.register);
router.post('/verify-email', controllers.verifyEmail);

router.post('/login', loginLimiter, controllers.login);
router.get('/logout', controllers.logout);

router.get('/refresh', controllers.refresh);

router.post('/forgot-password', controllers.forgotPassword);
router.put('/reset-password/:token', controllers.resetPassword);

router.get('/google', controllers.loginWithGoogle);
router.get('/google/callback', controllers.loginWithGoogleCallback);

export default router;
