import express from 'express';
import { getAllReviews, createReview, getUserById } from '../Controllers/reviewController.js';
import { authenticate, restrict } from './../auth/verifyToken.js';

const router = express.Router({ mergeParams: true });

// Route for getting all reviews or creating a review
router
    .route('/')
    .get(getAllReviews)
    .post(authenticate, restrict(['patient']), createReview);

// Separate route for getting a user by ID
router.get('/:id', authenticate, getUserById);

export default router;
