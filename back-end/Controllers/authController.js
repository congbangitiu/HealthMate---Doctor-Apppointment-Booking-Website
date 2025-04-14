import User from '../Models/UserSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import Otp from '../Models/OtpSchema.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, {
        expiresIn: '15d',
    });
};

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const registerAndVerifyOTP = async (req, res) => {
    const { fullname, username, phone, email, password, confirmedPassword, role, photo, gender, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            error: 'Please provide both email and OTP!',
        });
    }

    try {
        let user = null;

        // Check if user already exists
        if (role === 'patient') {
            user = await User.findOne({ email });
        } else if (role === 'doctor') {
            user = await Doctor.findOne({ email });
        }

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check OTP
        const otpRecord = await Otp.findOne({ email: email });
        if (!otpRecord) {
            return res.status(400).json({ error: 'OTP expired or not found for this email!' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP!' });
        }

        // If password and confirm password do not match
        if (password !== confirmedPassword) {
            return res.status(400).json({ message: 'Passwords do not match!' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Create new account
        if (role === 'patient') {
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
        } else if (role === 'doctor') {
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

        await user.save();

        // Delete OTP after successfully creating an account
        await Otp.deleteOne({ email: email });

        res.status(200).json({
            success: true,
            message: 'Account created successfully!',
        });
    } catch (error) {
        console.error('Error in register and verify OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Try again!',
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

export const sendEmailOTP = async (req, res) => {
    const { fullname, email } = req.body;

    if (!email) {
        return res.status(400).json({
            error: 'Please enter your email!',
        });
    }

    try {
        // Generate 6 digit OTP
        const OTP = Math.floor(100000 + Math.random() * 900000);
        const existEmail = await Otp.findOne({ email: email });

        if (existEmail) {
            // Update OTP and reset the creation time
            existEmail.otp = OTP;
            existEmail.createdAt = Date.now();
            await existEmail.save();
        } else {
            // Create new OTP record
            const saveOtpData = new Otp({
                email,
                otp: OTP,
            });
            await saveOtpData.save();
        }

        // Send OTP
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'HEALTHMATE - OTP Validation',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <p style="color: #4e545f;">Dear ${fullname},</p>
                    <p style="color: #4e545f;">Thank you for choosing <strong>HEALTHMATE</strong>! Please use the OTP below to complete your account registration. This OTP is valid for only <strong>2 minutes</strong>, so be sure to use it promptly.</p>
                    <div style="font-size: 30px; color: #30d5c8; letter-spacing: 10px; font-weight: bold; margin: 20px 0; text-align: center;">
                        ${OTP.toString().split('').join(' ')}
                    </div>
                    <p style="color: #4e545f; font-style: italic">CONFIDENTIALITY NOTICE: This email is intended only for the person named in the message body. For your security, do not share this OTP with anyone, including HealthMate staff. We will never ask for your OTP under any circumstances.</p>
                    <p style="color: #4e545f; font-style: italic; margin-top: 20px">Best regards,</p>
                    <strong style="color: #4e545f;">HealthMate Clinic</strong>
                </div>
            `,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log('Error: ', err);
                res.status(400).json({ error: 'Failed to send email' });
            } else {
                console.log('Email sent: ', info.response);
                res.status(200).json({ message: 'OTP sent successfully to your email!' });
            }
        });

        // Return HTML content for testing API instead of sending real email
        // res.send(`
        //     <div style="font-family: Arial, sans-serif;">
        //         <p style="color: #4e545f;">Dear ${fullname},</p>
        //         <p style="color: #4e545f;">Thank you for choosing <strong>HEALTHMATE</strong>! Please use the OTP below to complete your account registration. This OTP is valid for only <strong>2 minutes</strong>, so be sure to use it promptly.</p>
        //         <div style="font-size: 30px; color: #30d5c8; letter-spacing: 10px; font-weight: bold; margin: 20px 0; text-align: center;">
        //             ${OTP.toString().split('').join(' ')}
        //         </div>
        //         <p style="color: #4e545f; font-style: italic">CONFIDENTIALITY NOTICE: This email is intended only for the person named in the message body. For your security, do not share this OTP with anyone, including HealthMate staff. We will never ask for your OTP under any circumstances.</p>
        //         <p style="color: #4e545f; font-style: italic; margin-top: 20px">Best regards,</p>
        //         <strong style="color: #4e545f;">HealthMate Clinic</strong>
        //     </div>
        // `);
    } catch (error) {
        console.error('Error in sendOTP:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const sendSMSOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    console.log(phoneNumber);

    if (!phoneNumber) {
        return res.status(400).json({
            error: 'Please enter your phone number!',
        });
    }

    try {
        // Generate 6 digit OTP
        const OTP = Math.floor(100000 + Math.random() * 900000);
        let otpRecord = await Otp.findOne({ phone: phoneNumber });

        if (otpRecord) {
            // Update OTP and reset the creation time
            otpRecord.otp = OTP;
            otpRecord.createdAt = Date.now();
            await otpRecord.save();
        } else {
            // Create new OTP record
            otpRecord = new Otp({
                phone: phoneNumber,
                otp: OTP,
            });
            await otpRecord.save();
        }

        // Send OTP using Twilio
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = new twilio(accountSid, authToken);

        client.messages
            .create({
                body: `Thank you for choosing HEALTHMATE. Your OTP is: ${OTP}`,
                from: process.env.PHONE_NUMBER,
                to: phoneNumber,
            })
            .then((message) => {
                console.log('OTP sent successfully to your phone!');
                res.status(200).json({ message: 'OTP sent successfully to your phone!' });
            })
            .catch((error) => {
                console.error('Error in sendSMSOTP:', error);
                res.status(400).json({ error: 'Failed to send SMS' });
            });
    } catch (error) {
        console.error('Error in sendSMSOTP:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const addDoctorByAdmin = async (req, res) => {
    const { fullname, username, email, password, role, isApprove } = req.body;

    try {
        // Check if user already exists
        const doctor = await Doctor.findOne({ email });
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
            email,
            password: hashPassword,
            role,
            isApprove,
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
