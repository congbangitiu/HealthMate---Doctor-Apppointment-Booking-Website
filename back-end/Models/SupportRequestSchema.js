import mongoose from 'mongoose';

export const supportCategories = [
    'account',
    'appointment',
    'payment',
    'medical-records',
    'technical',
    'feedback',
    'other',
];

export const supportStatuses = ['new', 'in-progress', 'resolved', 'spam'];

const schema = new mongoose.Schema(
    {
        fullname: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, trim: true, maxlength: 254 },
        phone: { type: String, required: true, match: /^[0-9]{9,15}$/ },
        category: { type: String, enum: supportCategories, required: true },
        subject: { type: String, trim: true, maxlength: 200 },
        message: { type: String, required: true, trim: true, maxlength: 5000 },
        senderId: { type: mongoose.Schema.Types.ObjectId, default: null },
        senderRole: { type: String, enum: ['patient', 'doctor', 'admin', 'guest'], default: 'guest' },
        status: { type: String, enum: supportStatuses, default: 'new' },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        assignee: {
            type: new mongoose.Schema(
                {
                    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                    fullname: { type: String, required: true },
                },
                { _id: false },
            ),
            default: null,
        },
        history: [
            {
                type: { type: String, enum: ['status', 'note', 'claim', 'release'], required: true },
                actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                actorName: { type: String, required: true },
                at: { type: Date, required: true },
                from: { type: String, enum: supportStatuses },
                to: { type: String, enum: supportStatuses },
                note: { type: String, maxlength: 2000 },
            },
        ],
        ownerNotificationId: String,
        ownerNotificationActorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ownerNotificationAt: Date,
        ownerNotificationKind: { type: String, enum: ['status', 'message'] },
        ownerNotificationStatus: String,
        ownerNotificationRead: { type: Boolean, default: true },
        guestAccessHash: { type: String, select: false },
        notificationAt: { type: Date, default: Date.now },
        notificationId: { type: String },
        notificationKind: { type: String, enum: ['request', 'message'], default: 'request' },
        submissionIp: { type: String, required: true, select: false },
    },
    { timestamps: true },
);
schema.index({ submissionIp: 1, createdAt: -1 });

schema.index({ status: 1, createdAt: -1 });
schema.index({ notificationAt: -1, createdAt: -1 });
schema.index({ senderId: 1, senderRole: 1, ownerNotificationAt: -1 });

export default mongoose.model('SupportRequest', schema);
