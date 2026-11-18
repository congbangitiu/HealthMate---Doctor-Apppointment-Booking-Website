import mongoose from 'mongoose';
const schema = new mongoose.Schema(
    {
        tokenHash: { type: String, required: true, unique: true, select: false },
        requestIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SupportRequest' }],
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model('GuestSupportSession', schema);
