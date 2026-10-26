
import express from 'express';
import groupManagementRoutes from './groups/group.management.routes';
import groupDetailsRoutes from './groups/group.details.routes';
import memberManagementRoutes from './groups/member.management.routes';
import messageRoutes from './groups/messages.routes';

const router = express.Router();

// Mount the sub-routers
router.use('/', groupManagementRoutes);
router.use('/', groupDetailsRoutes);
router.use('/', memberManagementRoutes);
router.use('/', messageRoutes);

export default router;

