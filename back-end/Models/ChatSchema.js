import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
        doctor: { type: mongoose.Types.ObjectId, ref: 'Doctor', required: true },
        user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
        messages: [
            {
                sender: {
                    type: mongoose.Types.ObjectId,
                    required: true,
                    refPath: 'messages.senderModel',
                },
                senderModel: {
                    type: String,
                    enum: ['User', 'Doctor'],
                },
                type: {
                    type: String,
                    enum: ['text', 'media', 'document', 'link'],
                },
                mediaType: {
                    type: String,
                    enum: ['image', 'video'],
                },
                documentDetails: {
                    documentName: { type: String },
                    documentSize: { type: Number }, // in bytes
                    documentType: {
                        type: String,
                        enum: ['doc', 'docx', 'xlsx', 'csv', 'pdf'],
                    },
                },
                content: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
            },
        ],
        unreadMessages: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    { timestamps: true },
);

export default mongoose.model('Chat', chatSchema);
