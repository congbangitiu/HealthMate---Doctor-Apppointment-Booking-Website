import express from 'express';
import {
    createNewChat,
    getUserChats,
    updateUnreadMessages,
    handleMessageAction,
} from '../Controllers/chatController.js';

const router = express.Router();

// Create new chat
router.post('/create-chat', createNewChat);

// Get all chats of a user
router.get('/user-chats/:userId', getUserChats);

// Update unread messages
router.post('/update-unread-messages', updateUnreadMessages);

// Handle actions in a message
router.post('/handle-message-action', handleMessageAction);

export default router;
