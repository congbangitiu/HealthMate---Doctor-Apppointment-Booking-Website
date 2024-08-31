import Chat from '../Models/ChatSchema.js';

// Create new chat
export const createNewChat = async (req, res) => {
    const { doctorId, userId } = req.body;

    try {
        // Check if a chat already exists between the doctor and patient
        let chat = await Chat.findOne({ doctor: doctorId, user: userId });

        if (!chat) {
            // If no chat exists, create a new patient
            chat = new Chat({
                doctor: doctorId,
                user: userId,
                messages: [], // Start with an empty message array
            });

            await chat.save();
        }

        res.status(201).json({ chatId: chat._id }); // Return the ID of the chat
    } catch (error) {
        res.status(500).json({ message: 'Failed to create chat: ' + error.message });
    }
};

// Get all chats of a user
export const getUserChats = async (req, res) => {
    const { userId } = req.params; // Assuming userId is passed as a URL parameter

    try {
        // Find all chats where the patient is the user
        const chats = await Chat.find({
            $or: [{ user: userId }, { doctor: userId }],
        })
            .populate('doctor', 'fullname photo')
            .populate('user', 'fullname photo')
            .populate('messages.sender', 'fullname');

        if (!chats) {
            return res.status(404).json({ message: 'No chats found for this user.' });
        }

        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve chats.', error: error.message });
    }
};

// Send a message in a chat
export const sendMessage = async (req, res) => {
    const { chatId, senderId, senderModel, type, content } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const newMessage = { sender: senderId, senderModel, type, content };
        chat.messages.push(newMessage);
        await chat.save();

        // Emit the message to all connected clients in the room
        req.io.to(chatId).emit('new-message', newMessage);

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
        console.log(error);
    }
};

// Handle actions in a message
export const handleMessageAction = async (req, res) => {
    const { chatId, messageId, actionType, newContent, userId } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const messageIndex = chat.messages.findIndex((msg) => msg._id.toString() === messageId);

        if (messageIndex === -1) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const message = chat.messages[messageIndex];

        // Check user permissions (only the sender can edit or delete messages)
        if (message.sender.toString() !== userId) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        if (actionType === 'edit') {
            message.content = newContent;
        } else if (actionType === 'removeForEveryone') {
            // Perform "Remove for everyone"
            chat.messages.splice(messageIndex, 1);
        } else {
            return res.status(400).json({ error: 'Invalid action type' });
        }

        await chat.save();

        res.status(200).json({ message: 'Action performed successfully', chat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to perform action on message' });
    }
};
