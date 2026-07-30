import mongoose from 'mongoose';

const PasswordResetSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    model: { type: String, enum: ['User', 'Doctor'], required: true },
    otp: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    },
});

export default mongoose.model('PasswordReset', PasswordResetSchema);
