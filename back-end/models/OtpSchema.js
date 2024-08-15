import mongoose from 'mongoose';
import validator from 'validator';

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Enter Valid Email');
            }
        },
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
