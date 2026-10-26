
import { ObjectId } from 'mongodb';

export interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends BaseDocument {
  phoneNumber: string;
  name: string;
  profileImageUrl?: string;
  role: 'user' | 'admin';
  lastActive?: Date;
}

export interface MessageDocument extends BaseDocument {
  senderId: ObjectId;
  receiverId: ObjectId;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  repliedToMessageId?: ObjectId;
  attachments?: string[];
}

export interface GroupDocument extends BaseDocument {
  name: string;
  adminId: ObjectId;
  members: {
    userId: ObjectId;
    role: 'admin' | 'member';
    joinedAt: Date;
  }[];
}
