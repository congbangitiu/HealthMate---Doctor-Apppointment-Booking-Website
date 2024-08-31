import User from '../Models/UserSchema.js';
import Booking from '../Models/BookingSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import bcrypt from 'bcryptjs';

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
        const { query } = req.query;
        let users;
        if (query) {
            users = await User.find({
                $or: [{ fullname: { $regex: req.query.query, $options: 'i' } }],
            }).select('-password');
        } else {
            users = await User.find({}).select('-password');
        }

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
        const appointments = await Booking.find({ user: req.userId }).populate('user', '-password');

        // Extract doctor ids from appointment bookings
        const doctorIds = appointments.map((element) => element.doctor.id);
        // Retrieve doctors using doctor ids
        const doctors = await Doctor.find({ _id: { $in: doctorIds } }).select('-password');

        res.status(200).json({
            success: true,
            message: 'Appointments are gotten successfully',
            data: appointments,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Fail to retrieve appointments',
        });
    }
};

export const getAppointmentById = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the appointment by ID and populate the user and doctor fields
        const appointment = await Booking.findById(id)
            .populate({
                path: 'user',
                select: 'fullname email phone gender photo dateOfBirth address',
            })
            .populate({
                path: 'doctor',
                select: 'fullname email phone photo signature',
            });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

export const changePassword = async (req, res) => {
    const userId = req.userId;
    const { oldPassword, newPassword, confirmedNewPassword } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'The old password is incorrect !!!',
            });
        }

        // Check if the new password and confirm new password match
        if (newPassword !== confirmedNewPassword) {
            return res.status(400).json({
                success: false,
                message: 'The new password and confirm new password do not match !!!',
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
