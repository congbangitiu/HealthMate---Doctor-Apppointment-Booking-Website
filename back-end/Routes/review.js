import express from 'express';
import { getAllReviews, createReview, getUserById } from '../Controllers/reviewController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';

const router = express.Router({ mergeParams: true });
router
    .route('/')
    .get(getAllReviews)
    .post(authenticate, restrict(['patient']), createReview)
    .get('/:id', authenticate, getUserById);

export default router;
