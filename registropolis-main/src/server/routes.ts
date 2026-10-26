
import express from 'express';
import authRoutes from './routes/auth.routes';
import messageRoutes from './routes/messages.routes';
import groupRoutes from './routes/groups.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/messages', messageRoutes);
router.use('/groups', groupRoutes);

export default router;
