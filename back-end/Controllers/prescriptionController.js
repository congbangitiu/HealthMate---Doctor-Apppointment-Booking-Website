import Booking from '../Models/BookingSchema.js';
import Prescription from '../Models/PrescriptionSchema.js';

export const createPrescription = async (req, res) => {
    try {
        const newPrescription = new Prescription({
            ...req.body,
            actionHistory: [{ action: 'create', timestamp: new Date() }],
        });
        await newPrescription.save();

        // Get the booking details
        const booking = await Booking.findById(req.body.appointment).populate('user doctor');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Notify the patient
        req.io.to(booking.user._id.toString()).emit('prescription-notification', {
            appointmentId: booking._id,
            doctor: {
                id: booking.doctor._id,
                fullname: booking.doctor.fullname,
                photo: booking.doctor.photo,
            },
            timeSlot: booking.timeSlot,
            actionHistory: newPrescription.actionHistory,
            createdAt: newPrescription.createdAt,
        });

        res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            data: newPrescription,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating prescription',
            error: error.message,
        });
    }
};

export const getPrescriptionByAppointmentId = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const prescription = await Prescription.findOne({ appointment: appointmentId });
        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        res.status(200).json({ success: true, data: prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const updatePrescriptionByAppointmentId = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const updatedPrescription = await Prescription.findOneAndUpdate(
            { appointment: appointmentId },
            {
                $set: req.body,
                $push: { actionHistory: { action: 'update', timestamp: new Date() } },
            },
            { new: true, runValidators: true },
        );

        if (!updatedPrescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }

        // Get the booking details
        const booking = await Booking.findById(req.body.appointment).populate('user doctor');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Notify the patient
        req.io.to(booking.user._id.toString()).emit('prescription-notification', {
            appointmentId: booking._id,
            doctor: {
                id: booking.doctor._id,
                fullname: booking.doctor.fullname,
                photo: booking.doctor.photo,
            },
            timeSlot: booking.timeSlot,
            actionHistory: updatedPrescription.actionHistory,
            createdAt: updatedPrescription.updatedAt,
        });

        res.status(200).json({
            success: true,
            message: 'Prescription updated successfully',
            data: updatedPrescription,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const countUnreadPrescriptions = async (req, res) => {
    try {
        const unreadPrescriptions = await Prescription.countDocuments({
            appointment: { $in: await Booking.find({ user: req.params.userId }).distinct('_id') },
            unread: true,
        });

        res.json({ unreadCount: unreadPrescriptions });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unread prescriptions', error });
    }
};

export const markPrescriptionsAsRead = async (req, res) => {
    try {
        await Prescription.updateMany(
            {
                appointment: { $in: await Booking.find({ user: req.params.userId }).distinct('_id') },
                unread: true,
            },
            { $set: { unread: false } },
        );

        res.json({ message: 'Marked all unread prescriptions as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking prescriptions as read', error });
    }
};
