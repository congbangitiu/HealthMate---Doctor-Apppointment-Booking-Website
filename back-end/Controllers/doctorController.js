import Doctor from '../models/DoctorSchema.js';
import Booking from '../models/BookingSchema.js';
import User from '../models/UserSchema.js';
import bcrypt from 'bcryptjs';

export const updateDoctor = async (req, res) => {
    const id = req.params.id;
    try {
        const updatedDoctor = await Doctor.findByIdAndUpdate(id, { $set: req.body }, { new: true });

        res.status(200).json({
            success: true,
            message: 'Doctor is updated successfully',
            data: updatedDoctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Doctor is updated failed !!!',
        });
    }
};

export const deleteDoctor = async (req, res) => {
    const id = req.params.id;
    try {
        await Doctor.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Doctor is deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Doctor is deleted failed !!!',
        });
    }
};

export const getSingleDoctor = async (req, res) => {
    const id = req.params.id;
    try {
        const doctor = await Doctor.findById(id).populate('reviews').select('-password');

        res.status(200).json({
            success: true,
            message: 'Doctor is found successfully',
            data: doctor,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Doctor is not found !!!',
        });
    }
};

export const getAllDoctors = async (req, res) => {
    try {
        const { query } = req.query;
        let doctors;
        if (query) {
            doctors = await Doctor.find({
                isApproved: 'approved',
                $or: [
                    { fullname: { $regex: req.query.query, $options: 'i' } },
                    { specialization: { $regex: req.query.query, $options: 'i' } },
                ],
            }).select('-password');
        } else {
            doctors = await Doctor.find({ isApproved: 'approved' }).select('-password');
        }

        res.status(200).json({
            success: true,
            message: 'Doctors are found successfully',
            data: doctors,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Doctors are not found !!!',
        });
    }
};

export const getDoctorProfile = async (req, res) => {
    const doctorId = req.userId;

    try {
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor is not found',
            });
        }

        const { password, ...rest } = doctor._doc;
        const appointments = await Booking.find({ doctor: doctorId });

        res.status(200).json({
            success: true,
            message: "Doctor's information is retrieved successfully",
            data: { ...rest, appointments },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Fail to retrieve user's information",
        });
    }
};

export const getAllDoctorAppointments = async (req, res) => {
    try {
        const appointments = await Booking.find({ doctor: req.userId }).populate('user', '-password');

        res.status(200).json({
            success: true,
            message: 'Appointments are retrieved successfully',
            data: appointments,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve appointments',
        });
    }
};

export const changePassword = async (req, res) => {
    const userId = req.userId;
    const { oldPassword, newPassword, confirmedNewPassword } = req.body;

    try {
        // Fetch the user or doctor based on the role
        let user = await User.findById(userId);
        let doctor = null;

        if (!user) {
            doctor = await Doctor.findById(userId);
            if (!doctor) {
                console.error('User or Doctor not found');
                return res.status(404).json({
                    success: false,
                    message: 'User or Doctor not found',
                });
            }
        }

        const account = user || doctor;

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, account.password);
        if (!isMatch) {
            console.error('The old password is incorrect');
            return res.status(400).json({
                success: false,
                message: 'The old password is incorrect !!!',
            });
        }

        // Check if the new password and confirm new password match
        if (newPassword !== confirmedNewPassword) {
            console.error('The new password and confirm new password do not match');
            return res.status(400).json({
                success: false,
                message: 'The new password and confirm new password do not match !!!',
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the password
        account.password = hashedPassword;
        await account.save();

        console.log('Password changed successfully');
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
