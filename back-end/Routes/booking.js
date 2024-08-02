import express from 'express';
import { authenticate } from './../auth/verifyToken.js';
import { getCheckoutSession, updateAppointmentStatus } from '../Controllers/bookingController.js';

const router = express.Router();
router.post('/checkout-session/:doctorId', authenticate, getCheckoutSession);
router.put('/:id/status', authenticate, updateAppointmentStatus);

export default router;
