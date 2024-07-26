import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    gender: { type: String },
    password: { type: String, required: true },
    phone: { type: Number },
    photo: { type: String },
    ticketPrice: { type: Number },
    role: { type: String },
    specialization: { type: String },
    qualifications: { type: Array },
    experiences: { type: Array },
    bio: { type: String },
    about: { type: String },
    timeSlots: { type: Array },
    reviews: [{ type: mongoose.Types.ObjectId, ref: 'Review' }],
    averageRating: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 },
    isApproved: {
        type: String,
        enum: ['pending', 'approved', 'cancelled'],
        default: 'pending',
    },
    appointments: [{ type: mongoose.Types.ObjectId, ref: 'Booking' }],
});

export default mongoose.model('Doctor', doctorSchema);
