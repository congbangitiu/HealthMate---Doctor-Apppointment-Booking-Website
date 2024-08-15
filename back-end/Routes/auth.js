import express from 'express';
import { registerAndVerifyOTP, login, sendOTP} from '../Controllers/authController.js';

const router = express.Router();

router.post('/register-verify-otp', registerAndVerifyOTP);
router.post('/login', login);
router.post('/send-otp', sendOTP);


export default router;
