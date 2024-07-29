import Prescription from '../models/PrescriptionSchema.js';

export const createPrescription = async (req, res) => {
    try {
        const newPrescription = new Prescription(req.body);
        await newPrescription.save();
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

export const updatePrescription = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const updatedPrescription = await Prescription.findOneAndUpdate({ appointment: appointmentId }, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedPrescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Prescription updated successfully',
            data: updatedPrescription,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
