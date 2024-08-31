import express from 'express';
import { createNewChat, getUserChats, sendMessage, handleMessageAction } from '../Controllers/chatController.js';

const router = express.Router();

// Create new chat
router.post('/create-chat', createNewChat);

// Get all chats of a user
router.get('/user-chats/:userId', getUserChats);

// Send a message in a chat
router.post('/send-message', sendMessage);

// Handle actions in a message
router.post('/handle-message-action', handleMessageAction);

export default router;
