import express from 'express';
import { authenticate, restrict } from './../auth/verifyToken.js';
import {
    createBooking,
    getCheckoutSession,
    updateAppointmentStatus,
    getAllAppointments,
    getAppointmentBySessionId,
    getAppointmentById,
    countUnreadAppointments,
    markAppointmentAsRead,
} from '../Controllers/bookingController.js';

const router = express.Router();
router.post('/create', authenticate, createBooking);
router.post('/checkout-session/:doctorId', authenticate, getCheckoutSession);
router.put('/:id/status', authenticate, updateAppointmentStatus);
router.get('/', authenticate, restrict(['admin']), getAllAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.get('/appointment/:sessionId', authenticate, getAppointmentBySessionId);
router.get('/:doctorId/unread-bookings', authenticate, countUnreadAppointments);
router.post('/:doctorId/mark-bookings-read', authenticate, markAppointmentAsRead);

export default router;
