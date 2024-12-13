import { Router } from 'express';
import {
	login,
	logout,
	register,
	refresh,
	forgotPassword,
	resetPassword,
	loginWithGoogle,
	loginWithGoogleCallback,
} from '../controllers/auth.js';
import loginLimiter from '../middlewares/loginLimiter.js';

const router = Router();

router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/refresh', refresh);
router.get('/logout', logout);

router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/google', loginWithGoogle);
router.get('/google/callback', loginWithGoogleCallback);

export default router;
