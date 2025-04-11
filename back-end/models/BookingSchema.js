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

const timeSlotSchema = new mongoose.Schema(
    {
        day: { type: String, required: true },
        startingTime: { type: String, required: true },
        endingTime: { type: String, required: true },
    },
    { _id: false },
);

const pdfInfoSchema = new mongoose.Schema(
    {
        url: { type: String },
        publicId: { type: String },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const nextAppointmentSchema = new mongoose.Schema(
    {
        timeSlot: timeSlotSchema,
        pdfInfo: {
            type: pdfInfoSchema,
            default: null,
        },
    },
    { _id: false },
);

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
            enum: ['e-wallet', 'cash', 'free'],
        },
        timeSlot: timeSlotSchema,
        nextAppointment: nextAppointmentSchema,
        session: { type: String },
        unread: {
            type: Boolean,
            default: true,
        },
        isReExamination: {
            type: Boolean,
            default: false,
        },
        parentBooking: {
            type: mongoose.Types.ObjectId,
            ref: 'Booking',
            default: null,
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
        select: 'fullname email phone photo signature subspecialty',
    });
    next();
});

export default mongoose.model('Booking', bookingSchema);
