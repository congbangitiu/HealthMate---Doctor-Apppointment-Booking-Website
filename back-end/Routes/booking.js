import express from 'express';
import { authenticate, restrict } from './../auth/verifyToken.js';
import {
    createBooking,
    getCheckoutSession,
    updateAppointmentStatus,
    getAllAppointments,
    getAppointmentBySessionId,
    getAppointmentById
} from '../Controllers/bookingController.js';

const router = express.Router();
router.post('/create', authenticate, createBooking);
router.post('/checkout-session/:doctorId', authenticate, getCheckoutSession);
router.put('/:id/status', authenticate, updateAppointmentStatus);
router.get('/', authenticate, restrict(['admin']), getAllAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.get('/appointment/:sessionId', authenticate, getAppointmentBySessionId);

export default router;
