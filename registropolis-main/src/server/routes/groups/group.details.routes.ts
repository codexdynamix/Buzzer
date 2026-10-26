
import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../../db/mongodb';
import { authenticateToken } from './auth.middleware';

const router = express.Router();

// Get group details
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const db = await getDb();
    const userId = req.user.userId;

    const group = await db.collection('groups').findOne({
      _id: new ObjectId(groupId),
      'members.userId': new ObjectId(userId)
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ message: 'Failed to fetch group details' });
  }
});

// Update group details
router.put('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    const db = await getDb();
    const userId = req.user.userId;

    const group = await db.collection('groups').findOne({
      _id: new ObjectId(groupId),
      adminId: new ObjectId(userId)
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or not authorized' });
    }

    await db.collection('groups').updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { name, updatedAt: new Date() } }
    );

    res.status(200).json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Failed to update group' });
  }
});

export default router;

