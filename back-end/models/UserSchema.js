import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    confirmedPassword:  { type: String, required: true },
    phone: { type: Number },
    photo: { type: String },
    role: {
        type: String,
        enum: ['patient', 'admin'],
        default: 'patient',
    },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodType: { type: String },
    appointments: [{ type: mongoose.Types.ObjectId, ref: 'Appointment' }],
});

export default mongoose.model('User', UserSchema);
