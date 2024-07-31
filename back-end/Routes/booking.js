import express from 'express';
import { authenticate, restrict } from './../auth/verifyToken.js';
import { getCheckoutSession, updateAppointmentStatus } from '../Controllers/bookingController.js';

const router = express.Router();
router.post('/checkout-session/:doctorId', authenticate, getCheckoutSession);
router.put('/:id/status', authenticate, restrict(['doctor']), updateAppointmentStatus);

export default router;
