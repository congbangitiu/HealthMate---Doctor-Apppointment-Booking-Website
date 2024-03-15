import User from '../models/UserSchema.js';
import Doctor from '../models/DoctorSchema.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, {
        expiresIn: '15d',
    });
};

export const register = async (req, res) => {
    const { fullname, username, phone, email, password, role, photo, gender } = req.body;
    try {
        let user = null;
        if (role === 'patient') {
            user = await User.findOne({ email });
        } else if (role === 'doctor') {
            user = await Doctor.findOne({ email });
        }

        // Check if user exist
        if (user) {
            return res.status(400).json({ message: 'User already exist' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        if (role === 'patient') {
            {
                user = new User({
                    fullname,
                    username,
                    phone,
                    email,
                    password: hashPassword,
                    confirmedPassword: hashPassword,
                    role,
                    photo,
                    gender,
                });
            }
        }

        if (role === 'doctor') {
            {
                user = new Doctor({
                    fullname,
                    username,
                    phone,
                    email,
                    password: hashPassword,
                    confirmedPassword: hashPassword,
                    role,
                    photo,
                    gender,
                });
            }
        }

        await user.save();
        res.status(200).json({
            success: true,
            message: 'User is created successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error. Try again !!!',
        });
    }
};

export const login = async (req, res) => {
    const { email } = req.body;
    try {
        let user = null;
        const patient = await User.findOne({ email });
        const doctor = await Doctor.findOne({ email });

        if (patient) {
            user = patient;
        }

        if (doctor) {
            user = doctor;
        }

        // Check if user exist or not
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if password is correct or not
        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                status: false,
                message: 'Password is not correct. Try input again !!!',
            });
        }

        // Get token
        const token = generateToken(user);
        const { password, role, appointment, ...rest } = user._doc;
        res.status(200).json({
            status: true,
            message: 'Login successfully',
            token,
            data: { ...rest },
            role,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Login failed',
        });
    }
};
