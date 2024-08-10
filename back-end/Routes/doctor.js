import express from 'express';
import {
    updateDoctor,
    deleteDoctor,
    getSingleDoctor,
    getAllDoctors,
    getDoctorProfile,
    getAllDoctorAppointments,
    changePassword,
    getAppointmentById,
    uploadSignature,
} from '../Controllers/doctorController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';
import reviewRouter from './review.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Nested route
router.use('/:doctorId/reviews', reviewRouter);

router.get('/:id', getSingleDoctor);
router.get('/', getAllDoctors);
router.put('/:id', authenticate, restrict(['doctor', 'admin']), updateDoctor);
router.delete('/:id', authenticate, restrict(['doctor', 'admin']), deleteDoctor);
router.get('/profile/me', authenticate, restrict(['doctor']), getDoctorProfile);
router.get('/appointments/my-appointments', authenticate, restrict(['doctor']), getAllDoctorAppointments);
router.get('/appointments/my-appointments/:id', authenticate, restrict(['doctor']), getAppointmentById);
router.put('/change-password/:id', authenticate, restrict(['doctor']), changePassword);
router.post('/upload-signature/:id', authenticate, restrict(['doctor']), upload.single('signature'), uploadSignature);

export default router;
