import User from '../Models/UserSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import Chat from '../Models/ChatSchema.js';

const userSockets = {}; // Used to manage sockets by userId

const chatSocketHandler = (io) => {
    io.on('connection', (socket) => {
        socket.on(
            'send-message',
            async ({ chatId, senderId, senderModel, content, type, mediaType, documentDetails }) => {
                try {
                    const chat = await Chat.findById(chatId);
                    if (chat) {
                        // Create a new message object
                        const newMessage = {
                            sender: senderId,
                            senderModel,
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

                        // Handle unread messages
                        const receiverId =
                            senderModel === 'Doctor'
                                ? chat.user?._id?.toString?.() || chat.user?.toString()
                                : chat.doctor?._id?.toString?.() || chat.doctor?.toString();

                        if (receiverId) {
                            const currentUnread = chat.unreadMessages.get(receiverId) || 0;
                            chat.unreadMessages.set(receiverId, currentUnread + 1);
                        }

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
            },
        );

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

        socket.on('mark-as-read', async ({ chatId, userId }) => {
            const chat = await Chat.findById(chatId);
            if (chat) {
                chat.unreadMessages.set(userId, 0);
                await chat.save();

                io.to(chatId).emit('unread-messages-updated', {
                    chatId,
                    unreadMessages: Object.fromEntries(chat.unreadMessages),
                });
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
};

export default chatSocketHandler;
