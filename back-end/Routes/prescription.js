import express from 'express';
import { authenticate, restrict } from '../auth/verifyToken.js';
import {
    createPrescription,
    getPrescriptionByAppointmentId,
    updatePrescriptionByAppointmentId,
    countUnreadPrescriptions,
    markPrescriptionsAsRead
} from '../Controllers/prescriptionController.js';

const router = express.Router();
router.post('/', authenticate, restrict(['doctor']), createPrescription);
router.get('/:appointmentId', authenticate, getPrescriptionByAppointmentId);
router.put('/:appointmentId', authenticate, restrict(['doctor']), updatePrescriptionByAppointmentId);
router.get('/:userId/unread-prescriptions', authenticate, countUnreadPrescriptions);
router.post('/:userId/mark-prescriptions-read', authenticate, markPrescriptionsAsRead);

export default router;
