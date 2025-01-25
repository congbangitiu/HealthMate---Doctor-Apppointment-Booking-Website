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
    console.log('Client connected with socket ID:', socket.id);

    socket.on('user-online', async ({ userId }) => {
        try {
            await User.findByIdAndUpdate(userId, { status: 'online' });
            await Doctor.findByIdAndUpdate(userId, { status: 'online' });
            io.emit('user-status-changed', { userId, status: 'online' });
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    });

    socket.on('send-message', async ({ chatId, senderId, content, type, mediaType, documentDetails }) => {
        console.log('DEBUG: Server received send-message with data:', {
            chatId,
            senderId,
            content,
            type,
            mediaType,
            documentDetails,
        });

        try {
            const chat = await Chat.findById(chatId);
            if (chat) {
                // Create a new message object
                const newMessage = {
                    sender: senderId,
                    content,
                    type,
                    timestamp: new Date(),
                };

                // If media => store mediaType
                if (type === 'media') {
                    newMessage.mediaType = mediaType;
                }

                // If document => store documentDetails
                if (type === 'document') {
                    newMessage.documentDetails = documentDetails;
                }

                chat.messages.push(newMessage);
                await chat.save();

                // After saving, retrieve the inserted message
                const savedMessage = chat.messages[chat.messages.length - 1];

                // Emit to everyone in room
                io.to(chatId).emit('new-message', {
                    chatId,
                    _id: savedMessage._id,
                    content: savedMessage.content,
                    sender: { _id: senderId },
                    timestamp: savedMessage.timestamp,
                    type: savedMessage.type,
                    ...(savedMessage.type === 'media' && { mediaType: savedMessage.mediaType }),
                    ...(savedMessage.type === 'document' && {
                        documentDetails: savedMessage.documentDetails,
                    }),
                });

                console.log('DEBUG: Sent new-message event to chatId:', chatId);
            } else {
                console.error(`Chat with ID ${chatId} not found`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('join-chat', (chatId) => {
        socket.join(chatId);
        console.log(`DEBUG: Socket ${socket.id} joined chat room ${chatId}`);
    });

    socket.on('disconnect', async () => {
        if (socket.userId) {
            try {
                await User.findByIdAndUpdate(socket.userId, { status: 'offline' });
                await Doctor.findByIdAndUpdate(socket.userId, { status: 'offline' });
                io.emit('user-status-changed', { userId: socket.userId, status: 'offline' });
            } catch (error) {
                console.error('Error updating user status on disconnect:', error);
            }
        }
        console.log('Client disconnected with socket ID:', socket.id);
    });

    socket.on('error', (error) => {
        console.error('Socket.IO Error:', error);
    });
});

// Start the server and connect to the database
server.listen(port, () => {
    connectDB(); // Call the database connection function
    console.log('Server is running on port ' + port);
});
