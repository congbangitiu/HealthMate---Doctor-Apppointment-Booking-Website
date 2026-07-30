import express from 'express';
import {
    registerAndVerifyOTP,
    login,
    sendEmailOTP,
    sendSMSOTP,
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword,
} from '../Controllers/authController.js';

const router = express.Router();

router.post('/register-verify-otp', registerAndVerifyOTP);
router.post('/login', login);
router.post('/send-email-otp', sendEmailOTP);
router.post('/send-sms-otp', sendSMSOTP);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/verify', verifyForgotPasswordOTP);
router.post('/forgot-password/reset', resetPassword);

export default router;
