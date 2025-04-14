import express from 'express';
import { addNewDoctor, addDoctorTest } from '../Controllers/adminController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';

const router = express.Router();

router.post('/add-doctor', authenticate, restrict(['admin']), addNewDoctor);
router.post('/add-doctor-test', authenticate, restrict(['admin']), addDoctorTest);

export default router;
