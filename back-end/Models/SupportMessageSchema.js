import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportRequest', required: true, index: true },
    senderKey: { type: String, required: true, select: false },
    senderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    senderRole: { type: String, enum: ['admin', 'patient', 'doctor', 'guest'], required: true },
    senderName: { type: String, required: true },
    clientId: { type: String, required: true },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
}, { timestamps: true });
schema.index({ request: 1, senderKey: 1, clientId: 1 }, { unique: true });
schema.index({ request: 1, _id: -1 });
export default mongoose.model('SupportMessage', schema);
