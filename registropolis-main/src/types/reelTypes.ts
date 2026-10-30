export type ReelMediaType = 'video' | 'animation';

export interface ReelComment {
  id: string;
  reelId: string;
  userId: string;
  user: string;
  avatar: string;
  text: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
}

export interface ReelRecord {
  id: string;
  ownerId: string;
  sellerId: string;
  seller: string;
  sellerAvatar: string;
  verified?: boolean;
  location: string;
  productTitle: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  mediaType: ReelMediaType;
  videoUrl?: string;
  posterUrl: string;
  photos?: string[];
  isAnimation: boolean;
  musicTrackId?: string;
  likes: number;
  commentCount: number;
  shares: number;
  views: number;
  tag: string;
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: string;
}

export interface UploadedReelMedia {
  path: string;
  token: string;
  url: string;
}

export interface CreateReelPayload {
  productTitle: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  mediaType: ReelMediaType;
  mediaPaths: string[];
  musicTrackId?: string;
}
