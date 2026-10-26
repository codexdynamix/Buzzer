
import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../../db/mongodb';
import { ServerMember, ServerGroup } from '../../../types/groupTypes';
import { authenticateToken } from './auth.middleware';

const router = express.Router();

// Get all groups for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.userId;

    const groups = await db.collection('groups').find({
      'members.userId': new ObjectId(userId)
    }).toArray();

    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// Create a new group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, members } = req.body;
    const db = await getDb();
    const userId = req.user.userId;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Members must be a non-empty array of user IDs' });
    }

    const memberObjects: ServerMember[] = members.map(memberId => ({ 
      userId: new ObjectId(memberId),
      role: 'member',
      joinedAt: new Date() 
    }));

    memberObjects.push({ 
      userId: new ObjectId(userId),
      role: 'admin',
      joinedAt: new Date()
    });

    const newGroup: Omit<ServerGroup, '_id'> = {
      name,
      adminId: new ObjectId(userId),
      members: memberObjects,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('groups').insertOne(newGroup);

    res.status(201).json({
      message: 'Group created successfully',
      groupId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

export default router;
