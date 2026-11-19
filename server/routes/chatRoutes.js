import express from 'express';
import {
  streamChat,
  getConversations,
  getConversationById,
  deleteConversation,
  exportConversation,
} from '../controllers/chatController.js';

const router = express.Router();

// Real-time Chat Streaming via SSE
router.post('/chat/stream', streamChat);

// Conversation History CRUD & Search
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.delete('/conversations/:id', deleteConversation);

// Markdown Transcript Export
router.get('/conversations/:id/export', exportConversation);

export default router;

