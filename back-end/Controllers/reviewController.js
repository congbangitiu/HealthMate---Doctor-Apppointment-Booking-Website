import Review from '../models/ReviewSchema.js';
import Doctor from '../models/DoctorSchema.js';
import User from '../models/UserSchema.js';

// Get all reviews
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({});
        res.status(200).json({
            success: true,
            message: 'Get all reviews successfully',
            data: reviews,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Get all reviews failed',
        });
    }
};

// Create review
export const createReview = async (req, res) => {
    if (!req.body.doctor) {
        req.body.doctor = req.params.doctorId;
    }
    if (!req.body.user) {
        req.body.user = req.userId;
    }
    const newReview = new Review(req.body);
    try {
        const savedReview = await newReview.save();
        await Doctor.findByIdAndUpdate(req.body.doctor, {
            $push: { reviews: savedReview._id },
        });
        res.status(200).json({
            success: true,
            message: 'Feedback successfully',
            data: savedReview,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'User fetched successfully',
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
