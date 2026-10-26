
import express from 'express';
import addMemberRoute from './member/add.member.route';
import removeMemberRoute from './member/remove.member.route';
import leaveGroupRoute from './member/leave.group.route';

const router = express.Router();

router.use('/', addMemberRoute);
router.use('/', removeMemberRoute);
router.use('/', leaveGroupRoute);

export default router;
