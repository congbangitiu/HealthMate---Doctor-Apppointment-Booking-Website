import express from 'express';
import { authenticate, restrict } from './../auth/verifyToken.js';
import {
    createExamination,
    getExaminationByAppointmentId,
    updateExaminationByAppointmentId,
    getExaminationPDF,
} from '../Controllers/examinationController.js';

const router = express.Router();
router.post('/', authenticate, restrict(['doctor']), createExamination);
router.get('/:appointmentId', authenticate, getExaminationByAppointmentId);
router.put('/:appointmentId', authenticate, restrict(['doctor']), updateExaminationByAppointmentId);
router.get('/:id/pdf', getExaminationPDF);

export default router;
