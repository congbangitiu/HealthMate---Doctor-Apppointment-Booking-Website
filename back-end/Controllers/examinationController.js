import Booking from '../Models/BookingSchema.js';
import Examination from '../Models/ExaminationSchema.js';

export const createExamination = async (req, res) => {
    try {
        const booking = await Booking.findById(req.body.appointment);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const newExamination = new Examination({
            ...req.body,
        });
        await newExamination.save();

        res.status(201).json({
            success: true,
            message: 'Examination created successfully',
            data: newExamination,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating examination',
            error: error.message,
        });
    }
};

export const getExaminationByAppointmentId = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const examination = await Examination.findOne({ appointment: appointmentId });
        if (!examination) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }
        res.status(200).json({ success: true, data: examination });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const updateExaminationByAppointmentId = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const updatedExamination = await Examination.findOneAndUpdate(
            { appointment: appointmentId },
            {
                $set: req.body,
                $push: { actionHistory: { action: 'update', timestamp: new Date() } },
            },
            { new: true, runValidators: true },
        );

        if (!updatedExamination) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }

        // Get the booking details
        const booking = await Booking.findById(req.body.appointment).populate('user doctor');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Examination updated successfully',
            data: updatedExamination,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const savePDFLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { pdfUrl, publicId } = req.body;

        const updatedExam = await Examination.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    'pdfInfo.url': pdfUrl,
                    'pdfInfo.publicId': publicId,
                    'pdfInfo.updatedAt': new Date(),
                },
            },
            {
                new: true,
                runValidators: true,
            },
        );

        if (!updatedExam) {
            return res.status(404).json({
                success: false,
                message: 'Examination not found',
                receivedId: id,
            });
        }

        res.json({ success: true, data: updatedExam });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
};
