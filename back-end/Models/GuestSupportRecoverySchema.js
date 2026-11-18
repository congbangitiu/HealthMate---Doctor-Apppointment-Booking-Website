import mongoose from 'mongoose';
const schema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        tokenHash: { type: String, required: true, unique: true, select: false },
        language: { type: String, enum: ['vi', 'en'], required: true },
        expiresAt: { type: Date, required: true },
        usedAt: { type: Date, default: null },
    },
    { timestamps: true },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model('GuestSupportRecovery', schema);
