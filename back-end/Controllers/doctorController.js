import Doctor from '../models/DoctorSchema.js';

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
        const doctor = await Doctor.findById(id);

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
    const id = req.params.id;
    try {
        const doctors = await Doctor.find({}).select('-password');

        res.status(200).json({
            success: true,
            message: 'All doctors are found successfully',
            data: doctors,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'All doctors are not found !!!',
        });
    }
};
