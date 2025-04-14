import express from 'express';
import { registerAndVerifyOTP, login, sendEmailOTP, sendSMSOTP } from '../Controllers/authController.js';

const router = express.Router();

router.post('/register-verify-otp', registerAndVerifyOTP);
router.post('/login', login);
router.post('/send-email-otp', sendEmailOTP);
router.post('/send-sms-otp', sendSMSOTP);

export default router;
