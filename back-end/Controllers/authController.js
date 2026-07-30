import User from '../Models/UserSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import Otp from '../Models/OtpSchema.js';
import PasswordReset from '../Models/PasswordResetSchema.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import twilio from 'twilio';
import dotenv from 'dotenv';
import mailTransporter from '../utils/mailTransporter.js';

dotenv.config();

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, {
        expiresIn: '15d',
    });
};

// Secret riêng cho resetToken: nếu ký bằng JWT_SECRET_KEY, một resetToken sẽ đi qua
// được middleware authenticate. Derive từ secret gốc để không phải thêm biến môi trường.
const RESET_TOKEN_SECRET = `${process.env.JWT_SECRET_KEY}-reset-password`;
const RESET_TOKEN_EXPIRES_IN = '10m';
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// Tài khoản nằm ở 2 collection khác nhau (giống login) nên phải tìm ở cả hai
const findAccountByEmail = async (email) => {
    const patient = await User.findOne({ email });
    if (patient) {
        return { account: patient, model: 'User' };
    }

    const doctor = await Doctor.findOne({ email });
    if (doctor) {
        return { account: doctor, model: 'Doctor' };
    }

    return null;
};

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

        mailTransporter.sendMail(mailOptions, (err, info) => {
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

// Bước 1: xác nhận email có tài khoản -> sinh OTP -> gửi mail
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Please enter your email!',
        });
    }

    try {
        const found = await findAccountByEmail(email);
        if (!found) {
            // Dùng 400 thay vì 404: 404 dễ bị lẫn với "route không tồn tại" khi debug
            return res.status(400).json({
                success: false,
                message: 'This email does not exist in our system!',
            });
        }

        // Chặn spam gửi lại ở server, không chỉ dựa vào bộ đếm ngược trên UI
        const existingRequest = await PasswordReset.findOne({ email });
        if (existingRequest) {
            const elapsed = Date.now() - new Date(existingRequest.createdAt).getTime();
            if (elapsed < RESEND_COOLDOWN_MS) {
                const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
                return res.status(429).json({
                    success: false,
                    retryAfter,
                    message: `Please wait ${retryAfter}s before requesting a new OTP!`,
                });
            }
        }

        // Generate 6 digit OTP
        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(OTP, salt);

        // Ghi đè yêu cầu cũ và reset lại thời gian sống (TTL) + số lần thử
        await PasswordReset.findOneAndUpdate(
            { email },
            { email, model: found.model, otp: hashedOTP, attempts: 0, createdAt: new Date() },
            { upsert: true, new: true },
        );

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'HEALTHMATE - Reset Your Password',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <p style="color: #4e545f;">Dear ${found.account.fullname || 'user'},</p>
                    <p style="color: #4e545f;">We received a request to reset the password of your <strong>HEALTHMATE</strong> account. Please use the OTP below to continue. This OTP is valid for only <strong>10 minutes</strong>.</p>
                    <div style="font-size: 30px; color: #30d5c8; letter-spacing: 10px; font-weight: bold; margin: 20px 0; text-align: center;">
                        ${OTP.split('').join(' ')}
                    </div>
                    <p style="color: #4e545f;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
                    <p style="color: #4e545f; font-style: italic">CONFIDENTIALITY NOTICE: This email is intended only for the person named in the message body. For your security, do not share this OTP with anyone, including HealthMate staff. We will never ask for your OTP under any circumstances.</p>
                    <p style="color: #4e545f; font-style: italic; margin-top: 20px">Best regards,</p>
                    <strong style="color: #4e545f;">HealthMate Clinic</strong>
                </div>
            `,
        };

        await mailTransporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your email!',
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again!',
        });
    }
};

// Bước 2: so OTP -> phát resetToken ngắn hạn cho bước đặt lại mật khẩu
export const verifyForgotPasswordOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both email and OTP!',
        });
    }

    try {
        const resetRequest = await PasswordReset.findOne({ email });
        if (!resetRequest) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or not found. Please request a new one!',
            });
        }

        const isOtpMatch = await bcrypt.compare(otp.toString(), resetRequest.otp);
        if (!isOtpMatch) {
            resetRequest.attempts += 1;

            // Hết lượt thì huỷ yêu cầu, buộc gửi lại OTP mới
            if (resetRequest.attempts >= MAX_OTP_ATTEMPTS) {
                await PasswordReset.deleteOne({ _id: resetRequest._id });
                return res.status(400).json({
                    success: false,
                    message: 'Too many incorrect attempts. Please request a new OTP!',
                });
            }

            await resetRequest.save();
            const attemptsLeft = MAX_OTP_ATTEMPTS - resetRequest.attempts;
            return res.status(400).json({
                success: false,
                attemptsLeft,
                message: `Invalid OTP! You have ${attemptsLeft} attempt(s) left.`,
            });
        }

        // resetId giúp resetToken chỉ dùng được một lần: xoá bản ghi là token hết hiệu lực
        const resetToken = jwt.sign(
            { email, model: resetRequest.model, resetId: resetRequest._id.toString() },
            RESET_TOKEN_SECRET,
            { expiresIn: RESET_TOKEN_EXPIRES_IN },
        );

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully!',
            resetToken,
        });
    } catch (error) {
        console.error('Error in verifyForgotPasswordOTP:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again!',
        });
    }
};

// Bước 3: đổi mật khẩu bằng resetToken
export const resetPassword = async (req, res) => {
    const { resetToken, newPassword, confirmedPassword } = req.body;

    if (!resetToken || !newPassword || !confirmedPassword) {
        return res.status(400).json({
            success: false,
            message: 'Please fill in all the required fields!',
        });
    }

    if (newPassword !== confirmedPassword) {
        return res.status(400).json({
            success: false,
            message: 'The new password and confirm password do not match!',
        });
    }

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters and contain both letters and numbers!',
        });
    }

    try {
        let payload;
        try {
            payload = jwt.verify(resetToken, RESET_TOKEN_SECRET);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Your reset session has expired. Please start again!',
            });
        }

        // Bản ghi đã bị xoá => token đã dùng hoặc yêu cầu đã hết hạn
        const resetRequest = await PasswordReset.findById(payload.resetId);
        if (!resetRequest || resetRequest.email !== payload.email) {
            return res.status(401).json({
                success: false,
                message: 'This reset link has already been used. Please start again!',
            });
        }

        const Model = payload.model === 'Doctor' ? Doctor : User;
        const account = await Model.findOne({ email: payload.email });
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const isSameAsOldPassword = await bcrypt.compare(newPassword, account.password);
        if (isSameAsOldPassword) {
            return res.status(400).json({
                success: false,
                message: 'The new password must be different from your current password!',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        account.password = hashedPassword;
        // UserSchema lưu confirmedPassword (đã hash) nên phải cập nhật cùng lúc,
        // DoctorSchema không có field này
        if (Model.schema.path('confirmedPassword')) {
            account.confirmedPassword = hashedPassword;
        }
        await account.save();

        await PasswordReset.deleteOne({ _id: resetRequest._id });

        res.status(200).json({
            success: true,
            message: 'Your password has been reset successfully!',
        });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again!',
        });
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
