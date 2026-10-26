
import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/mongodb';
import { ServerMember } from '../../../../types/groupTypes';
import { authenticateToken } from '../auth.middleware';
import { CacheService } from '../../../services/cache.service';

const router = express.Router();
const GROUP_CACHE_PREFIX = 'group:';

router.delete('/:groupId/members/:memberId', authenticateToken, async (req: any, res: any) => {
  try {
    const { groupId, memberId } = req.params;
    const db = await getDb();
    const userId = req.user.userId;

    // Check if user is admin of the group
    const group = await db.collection('groups').findOne({
      _id: new ObjectId(groupId),
      adminId: new ObjectId(userId)
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or not authorized' });
    }

    // Fix typing issue with explicit generic parameter
    await db.collection<{
      _id: ObjectId;
      members: ServerMember[];
    }>('groups').updateOne(
      { _id: new ObjectId(groupId) },
      { $pull: { members: { userId: new ObjectId(memberId) } } }
    );

    // Invalidate cache
    const cacheKey = `${GROUP_CACHE_PREFIX}${groupId}`;
    await CacheService.del(cacheKey);

    res.status(200).json({ message: 'Member removed from group' });
  } catch (error) {
    console.error('Error removing member from group:', error);
    res.status(500).json({ message: 'Failed to remove member from group' });
  }
});

export default router;
