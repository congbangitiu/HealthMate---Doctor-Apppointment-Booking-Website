import mongoose from 'mongoose';
import validator from 'validator';

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Enter valid email');
            }
        },
        required: false,
    },
    phone: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isMobilePhone(value, 'any', { strictMode: true })) {
                throw new Error('Enter a valid phone number');
            }
        },
        required: false,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 120,
    },
});

export default mongoose.model('Otp', OtpSchema);
