import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/mongodb';
import { authMiddleware } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = express.Router();

// Get conversation messages between current user and another user
router.get('/:userId', authMiddleware, cacheMiddleware(300), async (req: any, res: any) => {
  try {
    const db = await getDb();
    const currentUserId = new ObjectId(req.user.id);
    const otherUserId = new ObjectId(req.params.userId);
    
    const messages = await db
      .collection('messages')
      .find({
        $or: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ],
        isGroupMessage: { $ne: true }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    // Return messages in ascending order
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to retrieve messages' });
  }
});

// Send a new message
router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const db = await getDb();
    const { receiverId, content, repliedToMessageId } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    const message: any = {
      senderId: new ObjectId(req.user.id),
      receiverId: new ObjectId(receiverId),
      content,
      status: 'sent',
      createdAt: new Date()
    };

    if (repliedToMessageId) {
      message.repliedToMessageId = new ObjectId(repliedToMessageId);
    }

    const result = await db.collection('messages').insertOne(message);
    
    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.insertedId
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Update message status (read, delivered)
router.patch('/:messageId/status', authMiddleware, async (req: any, res: any) => {
  try {
    const db = await getDb();
    const messageId = new ObjectId(req.params.messageId);
    const { status } = req.body;
    
    if (!status || !['sent', 'delivered', 'read'].includes(status)) {
      return res.status(400).json({ message: 'Valid status required' });
    }

    // Verify the message exists and user is the receiver
    const message = await db.collection('messages').findOne({
      _id: messageId,
      receiverId: new ObjectId(req.user.id)
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    await db.collection('messages').updateOne(
      { _id: messageId },
      { $set: { status, updatedAt: new Date() } }
    );
    
    res.json({ message: 'Message status updated successfully' });
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({ message: 'Failed to update message status' });
  }
});

export default router;
