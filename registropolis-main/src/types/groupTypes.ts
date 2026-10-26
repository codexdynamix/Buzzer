
import { ObjectId } from 'mongodb';

export interface ServerMember {
  userId: ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface ServerGroup {
  _id?: ObjectId;
  name: string;
  adminId: ObjectId;
  members: ServerMember[];
  createdAt: Date;
  updatedAt: Date;
}
