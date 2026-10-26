
import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/mongodb';
import { ServerGroup, ServerMember } from '../../../../types/groupTypes';
import { authenticateToken } from '../auth.middleware';
import { CacheService } from '../../../services/cache.service';

const router = express.Router();
const GROUP_CACHE_PREFIX = 'group:';

router.delete('/:groupId/leave', authenticateToken, async (req: any, res: any) => {
  try {
    const { groupId } = req.params;
    const db = await getDb();
    const cacheKey = `${GROUP_CACHE_PREFIX}${groupId}`;
    
    let group = await CacheService.get<ServerGroup>(cacheKey);
    
    if (!group) {
      const dbGroup = await db.collection('groups').findOne({
        _id: new ObjectId(groupId)
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
      return res.status(404).json({ message: 'Group not found' });
    }
    
    const userId = req.user.userId;
    
    if (group.adminId.toString() === userId) {
      if (group.members.length <= 1) {
        await db.collection('groups').deleteOne({ _id: new ObjectId(groupId) });
        await CacheService.del(cacheKey);
        return res.status(200).json({ message: 'Group deleted successfully' });
      } else {
        const newAdmin = group.members.find(m => m.userId.toString() !== userId);
        if (!newAdmin) {
          return res.status(400).json({ message: 'Cannot leave group, no members to assign as admin' });
        }
        
        // Fix typing issue with explicit generic parameter
        await db.collection<{
          _id: ObjectId;
          adminId: ObjectId;
          members: ServerMember[];
        }>('groups').updateOne(
          { _id: new ObjectId(groupId) },
          { 
            $set: { adminId: newAdmin.userId },
            $pull: { members: { userId: new ObjectId(userId) } }
          }
        );
      }
    } else {
      // Fix typing issue with explicit generic parameter
      await db.collection<{
        _id: ObjectId;
        members: ServerMember[];
      }>('groups').updateOne(
        { _id: new ObjectId(groupId) },
        { $pull: { members: { userId: new ObjectId(userId) } } }
      );
    }
    
    await CacheService.del(cacheKey);
    res.status(200).json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Failed to leave group' });
  }
});

export default router;
