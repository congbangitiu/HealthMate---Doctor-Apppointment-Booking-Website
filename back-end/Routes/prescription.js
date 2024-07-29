import express from 'express';
import { authenticate, restrict } from '../auth/verifyToken.js';
import {
    createPrescription,
    getPrescriptionByAppointmentId,
    updatePrescription,
} from '../Controllers/prescriptionController.js';

const router = express.Router();
router.post('/', authenticate, restrict(['doctor']), createPrescription);
router.get('/:appointmentId', getPrescriptionByAppointmentId);
router.put('/:appointmentId', authenticate, restrict(['doctor']), updatePrescription);

export default router;
