import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import authRoute from './Routes/auth.js';
import userRoute from './Routes/user.js';
import doctorRoute from './Routes/doctor.js';
import reviewRoute from './Routes/review.js';
import bookingRoute from './Routes/booking.js';
import prescriptionRoute from './Routes/prescription.js';
import chatRoute from './Routes/chat.js';
import User from './Models/UserSchema.js';
import Doctor from './Models/DoctorSchema.js';
import Chat from './Models/ChatSchema.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const corsOptions = { origin: true };

// Create HTTP server
const server = http.createServer(app);

// Create a new instance of Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Database connection function
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB is connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed with error: ', error);
        process.exit(1); // Exit the process with failure
    }
};

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Attach Socket.IO to the request object
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.send('API is working');
});

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/doctors', doctorRoute);
app.use('/api/v1/reviews', reviewRoute);
app.use('/api/v1/bookings', bookingRoute);
app.use('/api/v1/prescriptions', prescriptionRoute);
app.use('/api/v1/chats', chatRoute);

// Socket.IO logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('user-online', async ({ userId }) => {
        await User.findByIdAndUpdate(userId, { status: 'online' });
        await Doctor.findByIdAndUpdate(userId, { status: 'online' });
        io.emit('user-status-changed', { userId, status: 'online' });
    });

    socket.on('send-message', async ({ chatId, senderId, content }) => {
        const chat = await Chat.findById(chatId);
        if (chat) {
            chat.messages.push({ sender: senderId, content });
            await chat.save();
            io.to(chatId).emit('new-message', { senderId, content });
        }
    });

    socket.on('join-chat', ({ chatId }) => {
        socket.join(chatId);
    });

    socket.on('disconnect', async () => {
        const userId = socket.userId;
        await User.findByIdAndUpdate(userId, { status: 'offline' });
        await Doctor.findByIdAndUpdate(userId, { status: 'offline' });
        io.emit('user-status-changed', { userId, status: 'offline' });
        console.log('A user disconnected:', socket.id);
    });
});

// Start the server and connect to the database
server.listen(port, () => {
    connectDB(); // Call the database connection function
    console.log('Server is running on port ' + port);
});
