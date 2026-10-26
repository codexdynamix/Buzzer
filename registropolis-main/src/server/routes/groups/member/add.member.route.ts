
import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/mongodb';
import { ServerMember, ServerGroup } from '../../../../types/groupTypes';
import { authenticateToken } from '../auth.middleware';
import { CacheService } from '../../../services/cache.service';

const router = express.Router();
const GROUP_CACHE_PREFIX = 'group:';

router.post('/:groupId/members', authenticateToken, async (req: any, res: any) => {
  try {
    const { groupId } = req.params;
    const { userId: newMemberId } = req.body;
    const db = await getDb();
    const userId = req.user.userId;

    const cacheKey = `${GROUP_CACHE_PREFIX}${groupId}`;
    let group = await CacheService.get<ServerGroup>(cacheKey);

    if (!group) {
      const dbGroup = await db.collection('groups').findOne({
        _id: new ObjectId(groupId),
        adminId: new ObjectId(userId)
      });

      if (dbGroup) {
        group = {
          _id: dbGroup._id,
          name: dbGroup.name,
          adminId: dbGroup.adminId,
          members: dbGroup.members || [],
          createdAt: dbGroup.createdAt,
          updatedAt: dbGroup.updatedAt
        };
        await CacheService.set(cacheKey, group, 300);
      }
    }

    if (!group) {
      return res.status(404).json({ message: 'Group not found or not authorized' });
    }

    const isExistingMember = group.members.some(member => 
      member.userId.toString() === newMemberId
    );

    if (isExistingMember) {
      return res.status(400).json({ message: 'User is already a member of the group' });
    }

    const newMember: ServerMember = {
      userId: new ObjectId(newMemberId),
      role: 'member',
      joinedAt: new Date()
    };

    // Fix the typing issue with explicit generic parameter
    await db.collection<{
      _id: ObjectId;
      members: ServerMember[];
    }>('groups').updateOne(
      { _id: new ObjectId(groupId) },
      { $push: { members: newMember } }
    );

    await CacheService.del(cacheKey);
    res.status(200).json({ message: 'Member added to group' });
  } catch (error) {
    console.error('Error adding member to group:', error);
    res.status(500).json({ message: 'Failed to add member to group' });
  }
});

export default router;
