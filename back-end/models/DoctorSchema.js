import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    gender: { type: String },
    password: { type: String, required: true },
    phone: { type: Number },
    photo: { type: String },
    signature: { type: String },
    ticketPrice: { type: Number },
    role: { type: String },
    specialty: { type: String },
    subspecialty: { type: String },
    qualifications: { type: Array },
    experiences: { type: Array },
    bio: { type: String },
    about: { type: String },
    availableSchedules: [
        {
            day: { type: String, required: true },
            shifts: [
                {
                    type: String,
                    enum: ['morning', 'afternoon', 'evening'],
                    required: true,
                },
            ],
        },
        { _id: false },
    ],
    timeSlots: [
        {
            day: { type: String, required: true },
            startingTime: { type: String, required: true },
            endingTime: { type: String, required: true },
        },
    ],
    reviews: [{ type: mongoose.Types.ObjectId, ref: 'Review' }],
    averageRating: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 },
    isApproved: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    appointments: [{ type: mongoose.Types.ObjectId, ref: 'Booking' }],
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline',
    },
});

export default mongoose.model('Doctor', doctorSchema);
