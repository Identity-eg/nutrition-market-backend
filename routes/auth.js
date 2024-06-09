import { Router } from 'express';
import { login, logout, register, refresh } from '../controllers/auth.js';
import loginLimiter from '../middlewares/loginLimiter.js';

const router = Router();


router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/refresh', refresh);
router.get('/logout', logout);

export default router;
