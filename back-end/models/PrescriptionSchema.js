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
        patient: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctor: {
            type: mongoose.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        diseaseName: { type: String, required: true },
        medications: [medicationSchema],
    },
    { timestamps: true },
);

export default mongoose.model('Prescription', prescriptionSchema);
