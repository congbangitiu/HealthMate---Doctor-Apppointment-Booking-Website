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

export const addDoctorTest = async (req, res) => {
    try {
        const {
            fullname,
            username,
            email,
            password,
            gender,
            phone,
            role,
            ticketPrice,
            specialty,
            subspecialty,
            qualifications,
            experiences,
            bio,
            about,
            timeSlots,
            totalPatients,
            photo,
            signature,
            isApproved,
            status,
        } = req.body;

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ success: false, message: 'Doctor already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Prepare doctor data
        const doctorData = {
            fullname,
            username,
            email,
            password: hashedPassword,
            gender,
            phone,
            role: role || 'doctor',
            ticketPrice,
            specialty,
            subspecialty,
            qualifications,
            experiences,
            bio,
            about,
            totalPatients,
            timeSlots,
            isApproved: isApproved || 'approved',
            status: status || 'online',
        };

        // Optional fields: only add if provided
        if (photo) doctorData.photo = photo;
        if (signature) doctorData.signature = signature;

        // Create and save the doctor
        const newDoctor = new Doctor(doctorData);
        await newDoctor.save();

        res.status(201).json({
            success: true,
            message: 'Doctor added successfully!',
            doctorId: newDoctor._id,
        });
    } catch (error) {
        console.error('Error in adding new doctor:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Try again!',
        });
    }
};
