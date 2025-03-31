import express from 'express';
import { authenticate, restrict } from './../auth/verifyToken.js';
import {
    createExamination,
    getExaminationByAppointmentId,
    updateExaminationByAppointmentId,
    savePDFLink,
} from '../Controllers/examinationController.js';

const router = express.Router();
router.post('/', authenticate, restrict(['doctor']), createExamination);
router.get('/:appointmentId', authenticate, getExaminationByAppointmentId);
router.put('/:appointmentId', authenticate, restrict(['doctor']), updateExaminationByAppointmentId);
router.post('/:id/save-pdf-link', authenticate, restrict(['doctor']), savePDFLink);

export default router;
