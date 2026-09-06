import { Router } from 'express';
import {
  getConversations,
  getMessages,
  startOrGetConversation,
} from '../controllers/chatController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/conversations', startOrGetConversation);
router.get('/conversations/:conversationId/messages', getMessages);

export default router;