import express from 'express';
import {
    updateUser,
    deleteUser,
    getSingleUser,
    getAllUsers,
    getUserProfile,
    getMyAppointments,
    changePassword,
    getAppointmentById,
    getAllMyPrescriptions,
} from '../Controllers/userController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';

const router = express.Router();

router.get('/:id', getSingleUser);
router.get('/', authenticate, restrict(['admin']), getAllUsers);
router.get('/appointments/my-prescriptions', authenticate, restrict(['patient']), getAllMyPrescriptions);
router.put('/:id', authenticate, restrict(['patient']), updateUser);
router.delete('/:id', authenticate, restrict(['patient', 'admin']), deleteUser);
router.get('/profile/me', authenticate, restrict(['patient', 'admin']), getUserProfile);
router.get('/appointments/my-appointments', authenticate, restrict(['patient', 'admin']), getMyAppointments);
router.get('/appointments/my-appointments/:id', authenticate, restrict(['patient', 'admin']), getAppointmentById);
router.put('/change-password/:id', authenticate, restrict(['patient']), changePassword);

export default router;
