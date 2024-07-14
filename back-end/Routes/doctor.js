import express from 'express';
import {
    updateDoctor,
    deleteDoctor,
    getSingleDoctor,
    getAllDoctors,
    getDoctorProfile,
    getAllDoctorAppointments,
    changePassword,
} from '../Controllers/doctorController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';
import reviewRouter from './review.js';

const router = express.Router();

// Nested route
router.use('/:doctorId/reviews', reviewRouter);

router.get('/:id', getSingleDoctor);
router.get('/', getAllDoctors);
router.put('/:id', authenticate, restrict(['doctor']), updateDoctor);
router.delete('/:id', authenticate, restrict(['doctor']), deleteDoctor);
router.get('/profile/me', authenticate, restrict(['doctor']), getDoctorProfile);
router.get('/appointments/my-appointments', authenticate, restrict(['doctor']), getAllDoctorAppointments);
router.put('/change-password/:id', authenticate, restrict(['doctor']), changePassword);

export default router;
