import Doctor from '../models/DoctorSchema.js';
import Booking from '../models/BookingSchema.js';

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
