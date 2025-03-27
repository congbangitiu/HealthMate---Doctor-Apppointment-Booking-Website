import mongoose from 'mongoose';

const ExaminationSchema = new mongoose.Schema(
    {
        appointment: {
            type: mongoose.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },

        chiefComplaint: {
            type: String,
            required: true,
        },

        clinicalIndications: {
            type: String,
            required: true,
        },

        ultrasoundRequest: [
            {
                type: String,
                enum: [
                    'Liver',
                    'Gallbladder',
                    'Pancreas',
                    'Right Kidney',
                    'Left Kidney',
                    'Spleen',
                    'Bladder',
                    'Abdominal Cavity',
                ],
                required: true,
            },
        ],

        ultrasoundPhotos: [
            {
                type: String,
            },
        ],

        ultrasoundResults: {
            type: Map,
            of: String,
            default: {},
        },

        conclusion: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

export default mongoose.model('Examination', ExaminationSchema);
