import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'done', 'cancelled'],
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const bookingSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        ticketPrice: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'done', 'cancelled'],
            default: 'pending',
        },
        statusHistory: [statusHistorySchema],
        isPaid: {
            type: Boolean,
            default: false,
        },
        paymentMethod: {
            type: String,
            enum: ['e-wallet', 'cash'],
        },
        timeSlot: {
            day: { type: String, required: true },
            startingTime: { type: String, required: true },
            endingTime: { type: String, required: true },
        },
        session: { type: String },
        unread: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

bookingSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'fullname email phone gender photo dateOfBirth address',
    }).populate({
        path: 'doctor',
        select: 'fullname email phone photo signature specialization',
    });
    next();
});

export default mongoose.model('Booking', bookingSchema);
