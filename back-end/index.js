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
const userSockets = {};
io.on('connection', (socket) => {
    socket.on('send-message', async ({ chatId, senderId, content, type, mediaType, documentDetails }) => {
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

                // Store the chat to the database
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
            } else {
                console.error(`Chat with ID ${chatId} not found`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('remove-message', async ({ chatId, messageId }) => {
        try {
            const chat = await Chat.findById(chatId);
            if (!chat) throw new Error('Chat not found');

            // Delete messages from chat.messages
            chat.messages = chat.messages.filter((msg) => msg._id.toString() !== messageId);
            await chat.save();

            // Broadcast event to all clients in the room
            io.to(chatId).emit('message-removed', { chatId, messageId });
        } catch (error) {
            console.error('Error removing message:', error);
        }
    });

    socket.on('edit-message', async ({ chatId, messageId, newContent }) => {
        try {
            const chat = await Chat.findById(chatId);
            if (!chat) throw new Error('Chat not found');

            // Find and edit message content
            const message = chat.messages.find((msg) => msg._id.toString() === messageId);
            if (!message) throw new Error('Message not found');
            message.content = newContent;
            await chat.save();

            // Broadcast event to all clients in the room
            io.to(chatId).emit('message-edited', { chatId, messageId, newContent });
        } catch (error) {
            console.error('Error editing message:', error);
        }
    });

    socket.on('join-chat', async ({ chatId, userId, role }) => {
        try {
            if (socket.rooms.has(chatId)) {
                return;
            }

            // Join room
            socket.join(chatId);

            // Manage socket list by userId
            if (!userSockets[userId]) {
                userSockets[userId] = new Set();
            }
            userSockets[userId].add(socket.id);

            // Update online status only if necessary
            if (userSockets[userId].size === 1) {
                let currentStatus;
                if (role === 'patient') {
                    const user = await User.findById(userId);
                    currentStatus = user?.status;
                } else if (role === 'doctor') {
                    const doctor = await Doctor.findById(userId);
                    currentStatus = doctor?.status;
                }

                if (currentStatus !== 'online') {
                    if (role === 'patient') {
                        await User.findByIdAndUpdate(userId, { status: 'online' });
                    } else if (role === 'doctor') {
                        await Doctor.findByIdAndUpdate(userId, { status: 'online' });
                    }

                    io.emit('user-status-changed', { userId, status: 'online', role });
                }
            }

            // Attach role and userId to socket
            socket.userId = userId;
            socket.role = role;
        } catch (error) {
            console.error('Error joining chat room:', error);
        }
    });

    socket.on('disconnect', async () => {
        const { userId, role } = socket;

        if (userId) {
            try {
                // Remove current socket from user list
                if (userSockets[userId]) {
                    userSockets[userId].delete(socket.id);

                    // If there are no more sockets, update offline status
                    if (userSockets[userId].size === 0) {
                        delete userSockets[userId];

                        if (role === 'patient') {
                            await User.findByIdAndUpdate(userId, { status: 'offline' });
                        } else if (role === 'doctor') {
                            await Doctor.findByIdAndUpdate(userId, { status: 'offline' });
                        }

                        // Emit the user-status-changed event
                        io.emit('user-status-changed', { userId, status: 'offline', role });
                    }
                }
            } catch (error) {
                console.error('Error updating status to offline:', error);
            }
        }
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
