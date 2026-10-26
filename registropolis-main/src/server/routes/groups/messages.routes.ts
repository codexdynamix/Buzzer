
import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../../db/mongodb';
import { authenticateToken } from './auth.middleware';

const router = express.Router();

// Get group messages
router.get('/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const db = await getDb();
    const userId = req.user.userId;

    const group = await db.collection('groups').findOne({
      _id: new ObjectId(groupId),
      'members.userId': new ObjectId(userId)
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or you are not a member' });
    }

    const messages = await db.collection('messages').find({
      groupId: new ObjectId(groupId)
    }).toArray();

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ message: 'Failed to fetch group messages' });
  }
});

// Send message to group
router.post('/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, repliedToMessageId } = req.body;
    const db = await getDb();
    const userId = req.user.userId;

    const group = await db.collection('groups').findOne({
      _id: new ObjectId(groupId),
      'members.userId': new ObjectId(userId)
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or you are not a member' });
    }

    const newMessage = {
      groupId: new ObjectId(groupId),
      senderId: new ObjectId(userId),
      content,
      timestamp: new Date(),
      repliedToMessageId: repliedToMessageId ? new ObjectId(repliedToMessageId) : null
    };

    const result = await db.collection('messages').insertOne(newMessage);

    res.status(201).json({
      message: 'Message sent to group',
      messageId: result.insertedId
    });
  } catch (error) {
    console.error('Error sending message to group:', error);
    res.status(500).json({ message: 'Failed to send message to group' });
  }
});

export default router;

