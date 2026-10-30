import express from 'express';
import { getCalendarAvailability, rescheduleAppointment, getScheduleNotifications, markScheduleNotificationsRead } from '../Controllers/scheduleController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';
import {
    createBooking,
    createReExaminationBooking,
    getCheckoutSession,
    updateAppointmentStatus,
    updateNextAppointmentTimeSlot,
    savePDFLink,
    getAllAppointments,
    getAppointmentBySessionId,
    getAppointmentById,
    countUnreadAppointments,
    markAppointmentAsRead,
} from '../Controllers/bookingController.js';

const router = express.Router();
router.get('/calendar/availability', authenticate, restrict(['doctor']), getCalendarAvailability);
router.get('/calendar/notifications', authenticate, restrict(['patient']), getScheduleNotifications);
router.post('/calendar/notifications/read', authenticate, restrict(['patient']), markScheduleNotificationsRead);
router.put('/:id/reschedule', authenticate, restrict(['doctor']), rescheduleAppointment);
router.post('/create', authenticate, restrict(['patient']), createBooking);
router.post('/re-examination', authenticate, restrict(['doctor']), createReExaminationBooking);
router.post('/checkout-session/:doctorId', authenticate, getCheckoutSession);
router.put('/:id/status', authenticate, updateAppointmentStatus);
router.put('/:id/next-time-slot', authenticate, restrict(['doctor']), updateNextAppointmentTimeSlot);
router.post('/:id/save-pdf-link', authenticate, restrict(['doctor']), savePDFLink);
router.get('/', authenticate, restrict(['admin']), getAllAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.get('/appointment/:sessionId', authenticate, getAppointmentBySessionId);
router.get('/:doctorId/unread-bookings', authenticate, countUnreadAppointments);
router.post('/:doctorId/mark-bookings-read', authenticate, markAppointmentAsRead);

export default router;
