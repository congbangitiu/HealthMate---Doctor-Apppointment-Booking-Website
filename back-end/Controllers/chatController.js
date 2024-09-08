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
    const { chatId, senderId, senderModel, type, mediaType, content, documentDetails } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        let newMessage;

        if (type === 'media') {
            // Ensure mediaType is provided when type is 'media'
            if (!mediaType || !['image', 'video'].includes(mediaType)) {
                return res.status(400).json({ error: 'Invalid or missing mediaType for media message' });
            }

            newMessage = { sender: senderId, senderModel, type, mediaType, content };
        } else if (type === 'document') {
            // Ensure documentDetails are provided when type is 'document'
            if (
                !documentDetails ||
                !documentDetails.documentName ||
                !documentDetails.documentType ||
                !documentDetails.documentSize
            ) {
                return res.status(400).json({ error: 'Missing document details for document message' });
            }

            newMessage = { sender: senderId, senderModel, type, content, documentDetails };
        } else {
            // For other types like 'text' or 'link'
            newMessage = { sender: senderId, senderModel, type, content };
        }

        chat.messages.push(newMessage);

        // Determine who the recipient is to increase the unread message count
        const receiverId = senderModel === 'Doctor' ? chat.user._id : chat.doctor._id;

        // Update the number of unread messages for the recipient
        if (!chat.unreadMessages.has(receiverId.toString())) {
            chat.unreadMessages.set(receiverId.toString(), 0);
        }
        chat.unreadMessages.set(receiverId.toString(), chat.unreadMessages.get(receiverId.toString()) + 1);

        await chat.save();

        // Emit the message to all connected clients in the room
        req.io.to(chatId).emit('new-message', newMessage);

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
        console.log(error);
    }
};

// Update unread messages in chat
export const updateUnreadMessages = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Set unreadMessages for this user to 0
        chat.unreadMessages.set(userId, 0);

        await chat.save();

        res.status(200).json({ message: 'Unread messages updated', chat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update unread messages' });
        console.error(error);
    }
};

// Handle actions in a message
export const handleMessageAction = async (req, res) => {
    const { chatId, messageId, actionType, newContent, userId } = req.body;

    try {
        // Find the chat and populate doctor and user
        let chat = await Chat.findById(chatId).populate('doctor', 'fullname photo').populate('user', 'fullname photo');

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Find the message by its ID
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
            // Update the message content
            message.content = newContent;
        } else if (actionType === 'removeForEveryone') {
            // Remove the message from the chat
            chat.messages.splice(messageIndex, 1);
        } else {
            return res.status(400).json({ error: 'Invalid action type' });
        }

        // Save the chat after performing the action
        await chat.save();

        // Populate the chat again after the update
        chat = await Chat.findById(chatId)
            .populate('doctor', 'fullname photo')
            .populate('user', 'fullname photo')
            .populate('messages.sender', 'fullname'); // Also populate sender details for each message

        // Return the updated chat
        res.status(200).json({ message: 'Action performed successfully', chat });
    } catch (error) {
        res.status(500).json({ error: 'Failed to perform action on message', details: error.message });
    }
};
