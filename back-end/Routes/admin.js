import express from 'express';
import { addNewDoctor } from '../Controllers/adminController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';

const router = express.Router();

router.post('/add-doctor', authenticate, restrict(['admin']), addNewDoctor);

export default router;
