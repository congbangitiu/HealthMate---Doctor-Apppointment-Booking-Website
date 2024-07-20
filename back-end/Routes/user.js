import express from 'express';
import {
    updateUser,
    deleteUser,
    getSingleUser,
    getAllUsers,
    getUserProfile,
    getMyAppointments,
    changePassword,
} from '../Controllers/userController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';

const router = express.Router();

router.get('/:id', getSingleUser);
router.get('/', authenticate, restrict(['admin']), getAllUsers);
router.put('/:id', authenticate, restrict(['patient']), updateUser);
router.delete('/:id', authenticate, restrict(['patient']), deleteUser);
router.get('/profile/me', authenticate, restrict(['patient']), getUserProfile);
router.get('/appointments/my-appointments', authenticate, restrict(['patient']), getMyAppointments);
router.put('/change-password/:id', authenticate, restrict(['patient']), changePassword);

export default router;
