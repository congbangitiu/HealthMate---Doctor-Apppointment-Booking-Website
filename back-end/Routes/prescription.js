import express from 'express';
import { authenticate, restrict } from '../auth/verifyToken.js';
import {
    createPrescription,
    getPrescriptionByAppointmentId,
    updatePrescriptionByAppointmentId,
} from '../Controllers/prescriptionController.js';

const router = express.Router();
router.post('/', authenticate, restrict(['doctor']), createPrescription);
router.get('/:appointmentId', authenticate, getPrescriptionByAppointmentId);
router.put('/:appointmentId', authenticate, restrict(['doctor']), updatePrescriptionByAppointmentId);

export default router;
