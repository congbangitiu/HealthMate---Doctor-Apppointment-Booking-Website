import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: {
        timesPerDay: { type: Number, required: true },
        quantityPerTime: { type: Number, required: true },
    },
});

const historySchema = new mongoose.Schema(
    {
        action: { type: String, enum: ['create', 'update'] },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false },
);

const prescriptionSchema = new mongoose.Schema(
    {
        appointment: {
            type: mongoose.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        diseaseName: { type: String, required: true },
        medications: [medicationSchema],
        note: { type: String },
        unread: {
            type: Boolean,
            default: true,
        },
        actionHistory: [historySchema],
    },
    { timestamps: true },
);

export default mongoose.model('Prescription', prescriptionSchema);
