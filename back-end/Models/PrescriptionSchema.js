import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: {
        timesPerDay: { type: Number, required: true },
        quantityPerTime: { type: Number, required: true },
        totalUnits: { type: Number, required: true },
        timeOfDay: {
            type: [String],
            enum: ['Morning', 'Noon', 'Afternoon'],
            required: true,
        },
        dosageForm: {
            type: String,
            required: true,
            default: 'Tablet',
        },
        mealRelation: {
            type: String,
            enum: ['Before meal', 'After meal'],
            required: true,
        },
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
        doctorAdvice: { type: String },
        unread: {
            type: Boolean,
            default: true,
        },
        actionHistory: [historySchema],
        isSigned: {
            type: Boolean,
            default: false,
        },
        pdfInfo: {
            url: String,
            publicId: String,
            createdAt: {
                type: Date,
                default: Date.now,
            },
            updatedAt: Date,
        },
    },
    { timestamps: true },
);

export default mongoose.model('Prescription', prescriptionSchema);
