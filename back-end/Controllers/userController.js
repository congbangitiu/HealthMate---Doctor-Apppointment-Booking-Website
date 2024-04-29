import User from '../models/UserSchema.js';
import Booking from '../models/BookingSchema.js';
import Doctor from '../models/DoctorSchema.js';

export const updateUser = async (req, res) => {
    const id = req.params.id;
    try {
        const updatedUser = await User.findByIdAndUpdate(id, { $set: req.body }, { new: true });

        res.status(200).json({
            success: true,
            message: 'User is updated successfully',
            data: updatedUser,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'User is updated failed !!!',
        });
    }
};

export const deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'User is deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'User is deleted failed !!!',
        });
    }
};

export const getSingleUser = async (req, res) => {
    const id = req.params.id;
    try {
        const user = await User.findById(id);

        res.status(200).json({
            success: true,
            message: 'User is found successfully',
            data: user,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'User is not found !!!',
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');

        res.status(200).json({
            success: true,
            message: 'All users are found successfully',
            data: users,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'All users are not found !!!',
        });
    }
};

export const getUserProfile = async (req, res) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User is not found',
            });
        }

        const { password, ...rest } = user._doc;
        res.status(200).json({
            success: true,
            message: "User's information is retrieved successfully",
            data: { ...rest },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Fail to retrieve user's information",
        });
    }
};

export const getMyAppointments = async (req, res) => {
    try {
        // Retrieve appointments from booking for specific user
        const bookings = await Booking.find({ user: req.userId });
        // Extract doctor ids from appointment bookings
        const doctorIds = bookings.map((element) => element.doctor.id);
        // Retrieve doctors using doctor ids
        const doctors = await Doctor.find({ _id: { $in: doctorIds } }).select('-password');

        res.status(200).json({
            success: true,
            message: 'Appointments are gotten successfully',
            data: doctors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Fail to retrieve appointments',
        });
    }
};