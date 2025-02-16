import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: {
        timesPerDay: { type: Number, required: true },
        quantityPerTime: { type: Number, required: true },
    },
});

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
    },
    { timestamps: true },
);

export default mongoose.model('Prescription', prescriptionSchema);
