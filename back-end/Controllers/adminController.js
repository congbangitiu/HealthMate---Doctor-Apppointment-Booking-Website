import Doctor from '../Models/DoctorSchema.js';
import bcrypt from 'bcryptjs';

export const addNewDoctor = async (req, res) => {
    const { fullname, username, gender, email, password, specialty, subspecialty, role, isApproved } = req.body;

    try {
        // Check if user already exists
        let doctor = await Doctor.findOne({ email });
        if (doctor) {
            return res.status(400).json({ message: 'Doctor already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Create new account
        doctor = new Doctor({
            fullname,
            username,
            gender,
            email,
            password: hashPassword,
            specialty,
            subspecialty,
            role,
            isApproved,
        });

        await doctor.save();

        res.status(200).json({
            success: true,
            message: 'Add new doctor successfully!',
        });
    } catch (error) {
        console.error('Error in adding new doctor:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Try again!',
        });
    }
};
