import 'dotenv/config';
import fs from 'fs';
import { randomBytes } from 'crypto';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient, Db, Collection } from 'mongodb';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { SEED_USERS as ACCOUNTS_DATA, SEED_LISTINGS as LISTINGS_DATA, SEED_BUSINESSES as BUSINESSES_DATA, SeedBusiness } from './registropolis-main/src/data/seedAccounts';
import { AdminPermission, StaffRole, hasAdminPermission, isStaffRole } from './registropolis-main/src/config/adminAccess';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
let socketServer: SocketIOServer | undefined;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'buzzer-dev-jwt-secret-key-123456';
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_FILE_PATH = path.resolve(
  __dirname,
  process.env.BUZZER_DATABASE_FILE || 'data/buzzer_database.json',
);

// ── Types ─────────────────────────────────────────────────────

type User = {
  id: string;
  phoneNumber?: string;
  email?: string;
  passwordHash?: string;
  name: string;
  profileImageUrl?: string;
  role: string;
  createdAt: string;
  bio?: string;
  location?: string;
  contactPhone?: string;
  whatsapp?: boolean;
  viber?: boolean;
  telegram?: boolean;
  signal?: boolean;
  messenger?: boolean;
  staffRole?: StaffRole;
};

type Listing = {
  id: string;
  section: string;
  data: any;
  userId: string;
  status: 'active' | 'paused' | 'sold' | 'pending_review' | 'flagged' | 'rejected';
  riskScore?: number;
  riskFlags?: string[];
  riskSummary?: string;
  createdAt: string;
};

type JobApplication = {
  id: string;
  listingId: string;
  applicantId: string;
  coverLetter: string;
  status: 'submitted' | 'reviewed' | 'accepted' | 'declined';
  createdAt: string;
};

type Business = SeedBusiness;

type Message = {
  id: string;
  chatId: string;
  senderId: string;
  recipientId?: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  listing?: { id: string; title: string; price: string; image?: string; category: string };
  replyTo?: { id: string; content: string; sender: string };
  type?: 'offer';
  offerData?: {
    listingTitle: string;
    listingImage?: string;
    askingPrice: number;
    offerPrice: number;
    status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
    isCounter?: boolean;
    expiresAt?: number;
  };
};

type Group = {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  avatar?: string;
};

type GroupMessage = {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  timestamp: string;
};

type AdminLog = {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: Record<string, any>;
};

type FeatureFlag = {
  name: string;
  enabled: boolean;
  scope: 'global' | 'user';
  targetUsers?: string[];
  moderationEnabled?: boolean;
  moderationRules?: {
    requiresApproval?: boolean;
    autoModeration?: boolean;
    maxDailySubmissions?: number;
  };
  lastModified: Date;
  modifiedBy: string;
};

type UserRestriction = {
  id: string;
  userId: string;
  type: 'ban' | 'suspend' | 'restrict';
  reason: string;
  status: 'active' | 'lifted';
  createdBy: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  liftedBy?: string;
  liftedAt?: Date;
};

type Story = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  media: { type: 'image' | 'video'; url: string }[];
  content?: string;
  timestamp: string;
  viewers: string[];
  isExpired: boolean;
};

type SupportTicket = {
  ticketId: string;
  userId: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  userWarned?: boolean;
  assignedTo?: string | null;
  escalatedAt?: Date;
  slaDueAt?: Date;
  responses?: SupportTicketResponse[];
};

type SupportTicketResponse = {
  responseId: string;
  userId: string;
  message: string;
  createdAt: Date;
};

type AnalyticsRecord = {
  date: string;
  metrics: { activeUsers: number; newUsers: number; messagesSent: number; avgResponseTime: number; errorRate: number };
  pageViews: Record<string, number>;
  userActions: Record<string, number>;
};

type PasswordResetToken = {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
};

type VerificationRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  vertical: 'real-estate' | 'service' | 'marketplace' | 'transport' | 'business';
  badgeTitle: string;
  documentType: 'realtor_license' | 'master_trade' | 'dealer_permit' | 'business_reg';
  documentNumber: string;
  documentImage: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

// ── In-Memory Database Engine ─────────────────────────────────

function matchesFilter(doc: any, filter?: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, filterVal] of Object.entries(filter)) {
    const docVal = doc[key];
    if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
      if ('$in' in filterVal) {
        const inArray = (filterVal as any).$in as any[];
        if (Array.isArray(docVal)) {
          if (!docVal.some(v => inArray.includes(v))) return false;
        } else {
          if (!inArray.includes(docVal)) return false;
        }
      } else if ('$ne' in filterVal) {
        if (docVal === (filterVal as any).$ne) return false;
      } else if ('$gte' in filterVal) {
        if (docVal < (filterVal as any).$gte) return false;
      } else if ('$lte' in filterVal) {
        if (docVal > (filterVal as any).$lte) return false;
      }
    } else if (Array.isArray(docVal)) {
      if (!docVal.includes(filterVal)) return false;
    } else {
      if (docVal !== filterVal) return false;
    }
  }
  return true;
}

function project(doc: any, proj?: Record<string, number>): any {
  if (!proj) return doc;
  const isInclusive = Object.values(proj).some(v => v === 1);
  if (isInclusive) {
    const result: any = {};
    for (const [k, v] of Object.entries(proj)) {
      if (v === 1 && doc[k] !== undefined) result[k] = doc[k];
    }
    return result;
  } else {
    const result = { ...doc };
    for (const [k, v] of Object.entries(proj)) {
      if (v === 0) delete result[k];
    }
    return result;
  }
}

class InMemoryCursor<T> {
  constructor(private docs: T[], private projectionOptions?: Record<string, number>) {}
  private _sort?: Record<string, number>;
  private _limit?: number;

  sort(sortObj: Record<string, number>) {
    this._sort = sortObj;
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  async toArray(): Promise<T[]> {
    let list = [...this.docs];
    if (this._sort) {
      const [field, dir] = Object.entries(this._sort)[0];
      list.sort((a: any, b: any) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }
    if (typeof this._limit === 'number' && this._limit > 0) {
      list = list.slice(0, this._limit);
    }
    if (this.projectionOptions) {
      list = list.map(d => project(d, this.projectionOptions));
    }
    return JSON.parse(JSON.stringify(list));
  }
}

let onDatabaseChange: (() => void) | null = null;

class InMemoryCollection<T extends Record<string, any>> {
  docs: T[] = [];

  constructor(initialData: T[] = []) {
    this.docs = [...initialData];
  }

  find(filter?: any, options?: { projection?: Record<string, number> }) {
    const matched = this.docs.filter(doc => matchesFilter(doc, filter));
    return new InMemoryCursor<T>(matched, options?.projection);
  }

  async findOne(filter?: any, options?: { projection?: Record<string, number> }): Promise<T | null> {
    const item = this.docs.find(doc => matchesFilter(doc, filter));
    if (!item) return null;
    return JSON.parse(JSON.stringify(project(item, options?.projection)));
  }

  async insertOne(doc: T): Promise<{ acknowledged: boolean; insertedId: any }> {
    this.docs.push(JSON.parse(JSON.stringify(doc)));
    onDatabaseChange?.();
    return { acknowledged: true, insertedId: (doc as any).id || (doc as any)._id || uid() };
  }

  async updateOne(filter: any, update: any, options?: { upsert?: boolean }): Promise<any> {
    const idx = this.docs.findIndex(doc => matchesFilter(doc, filter));
    if (idx === -1) {
      if (options?.upsert) {
        const newDoc: any = { ...filter };
        if (update.$setOnInsert) Object.assign(newDoc, update.$setOnInsert);
        if (update.$set) this.applySet(newDoc, update.$set);
        if (update.$inc) this.applyInc(newDoc, update.$inc);
        this.docs.push(newDoc);
        onDatabaseChange?.();
        return { acknowledged: true, modifiedCount: 1, upsertedCount: 1 };
      }
      return { acknowledged: true, modifiedCount: 0 };
    }

    const doc = this.docs[idx];
    if (update.$set) this.applySet(doc, update.$set);
    if (update.$inc) this.applyInc(doc, update.$inc);
    const mutableDoc = doc as Record<string, any>;
    if (update.$addToSet) {
      for (const [k, v] of Object.entries(update.$addToSet)) {
        if (!Array.isArray(mutableDoc[k])) mutableDoc[k] = [];
        if (!mutableDoc[k].includes(v)) mutableDoc[k].push(v);
      }
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        if (!Array.isArray(mutableDoc[k])) mutableDoc[k] = [];
        mutableDoc[k].push(v);
      }
    }
    onDatabaseChange?.();
    return { acknowledged: true, modifiedCount: 1 };
  }

  private applySet(target: any, setObj: Record<string, any>) {
    for (const [path, val] of Object.entries(setObj)) {
      const parts = path.split('.');
      let curr = target;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = val;
    }
  }

  private applyInc(target: any, incObj: Record<string, any>) {
    for (const [path, val] of Object.entries(incObj)) {
      const parts = path.split('.');
      let curr = target;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      const lastKey = parts[parts.length - 1];
      curr[lastKey] = (curr[lastKey] || 0) + val;
    }
  }

  async deleteOne(filter: any): Promise<{ acknowledged: boolean; deletedCount: number }> {
    const idx = this.docs.findIndex(doc => matchesFilter(doc, filter));
    if (idx !== -1) {
      this.docs.splice(idx, 1);
      onDatabaseChange?.();
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  async countDocuments(filter?: any): Promise<number> {
    if (!filter || Object.keys(filter).length === 0) return this.docs.length;
    return this.docs.filter(doc => matchesFilter(doc, filter)).length;
  }

  async createIndex(_spec: any, _options?: any): Promise<string> {
    return 'index_created';
  }
}

// ── Database Instances ────────────────────────────────────────

let users: InMemoryCollection<User> | Collection<User>;
let listings: InMemoryCollection<Listing> | Collection<Listing>;
let businesses: InMemoryCollection<Business> | Collection<Business>;
let jobApplications: InMemoryCollection<JobApplication> | Collection<JobApplication>;
let messages: InMemoryCollection<Message> | Collection<Message>;
let groups: InMemoryCollection<Group> | Collection<Group>;
let groupMessages: InMemoryCollection<GroupMessage> | Collection<GroupMessage>;
let adminLogs: InMemoryCollection<AdminLog> | Collection<AdminLog>;
let featureFlags: InMemoryCollection<FeatureFlag> | Collection<FeatureFlag>;
let userRestrictions: InMemoryCollection<UserRestriction> | Collection<UserRestriction>;
let stories: InMemoryCollection<Story> | Collection<Story>;
let supportTickets: InMemoryCollection<SupportTicket> | Collection<SupportTicket>;
let analytics: InMemoryCollection<AnalyticsRecord> | Collection<AnalyticsRecord>;
let passwordResetTokens: InMemoryCollection<PasswordResetToken> | Collection<PasswordResetToken>;
let verificationRequests: InMemoryCollection<VerificationRequest> | Collection<VerificationRequest>;

const PASSWORD_HASH = bcrypt.hashSync('buzzer123', 10);

const SEED_USERS: User[] = [
  // Superadmin account preserved for system health and administration
  {
    id: 'u_admin',
    email: 'admin@buzzer.com',
    passwordHash: PASSWORD_HASH,
    name: 'Admin User',
    role: 'admin',
    staffRole: 'superadmin',
    profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Buzzer Platform Superadmin & City Coordinator',
    location: 'Downtown Center',
    contactPhone: '+1 (555) 010-0001',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  // All 30 Real User accounts across the 6 sections!
  ...ACCOUNTS_DATA.map(u => ({
    id: u.id,
    email: u.email,
    passwordHash: PASSWORD_HASH,
    name: u.name,
    role: 'user' as const,
    profileImageUrl: u.profileImageUrl,
    bio: `${u.specialty} • ${u.bio}`,
    location: u.location,
    contactPhone: u.contactPhone,
    whatsapp: u.whatsapp,
    telegram: u.telegram,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  })),
];

const ADMIN_FEATURE_NAMES = [
  'messaging', 'file_sharing', 'group_creation', 'story_sharing', 'business_features',
  'marketplace', 'real_estate', 'taxi_service', 'food_delivery', 'job_posting',
  'event_creation', 'user_verification', 'content_moderation', 'analytics',
  'user_management', 'system_settings',
];

const SEED_LISTINGS: Listing[] = [
  ...LISTINGS_DATA.map(l => ({
    id: l.id,
    section: l.section,
    userId: l.userId,
    status: l.status,
    createdAt: l.createdAt,
    data: l.data,
  })),
  {
    id: 'lst_mod_1',
    section: 'marketplace',
    userId: 'u_mkt_2',
    status: 'pending_review',
    riskScore: 92,
    riskFlags: ['EXTREME_LOW_PRICE', 'EXTERNAL_ESCROW_RISK'],
    riskSummary: 'Listed at $250 which is 88% below category average ($2,200). External contact prompt found in description.',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    data: {
      title: 'Apple MacBook Pro M3 Max 16" - 64GB / 1TB SSD Space Black',
      price: '$250',
      category: 'Electronics',
      description: 'Brand new in sealed box. Need quick cash today for moving. Message me on WhatsApp directly at +1-555-0199 for instant pickup, do not use in-app checkout.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop',
      condition: 'Brand New',
      location: 'Downtown Center',
    },
  },
  {
    id: 'lst_mod_2',
    section: 'real-estate',
    userId: 'u_re_2',
    status: 'flagged',
    riskScore: 78,
    riskFlags: ['DUPLICATE_IMAGE_CLUSTER', 'UNVERIFIED_BROKER_REPOST'],
    riskSummary: 'Photo signatures match listing #lst_re_2 posted by Sophia Rossi 4 days ago. Possible unverified broker duplicate.',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    data: {
      title: 'Waterfront Marina Sky Villa with Direct Dock Access',
      price: '$3,200 / mo',
      category: 'Apartments',
      description: 'Stunning direct water views with high ceilings and private elevator entrance. Immediate lease available.',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop',
      bedrooms: '3 Beds',
      bathrooms: '2.5 Baths',
      sqft: '2,100 sq ft',
      location: 'Waterfront Marina',
    },
  },
  {
    id: 'lst_mod_3',
    section: 'transport',
    userId: 'u_trn_1',
    status: 'pending_review',
    riskScore: 58,
    riskFlags: ['PHONE_IN_DESCRIPTION'],
    riskSummary: 'Unformatted direct phone number detected in vehicle description. Bypasses in-app messaging policy.',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    data: {
      title: '2023 Mercedes-Benz Sprinter 2500 High Roof Cargo Van',
      price: '$44,900',
      category: 'Commercial Vans',
      description: 'Clean title, 28k highway miles. Full service records available. Call or text 555-019-3388 anytime for test drive.',
      image: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&auto=format&fit=crop',
      mileage: '28,000 miles',
      year: '2023',
      transmission: 'Automatic',
      location: 'Industrial District',
    },
  },
  {
    id: 'lst_mod_4',
    section: 'job',
    userId: 'u_job_1',
    status: 'pending_review',
    riskScore: 84,
    riskFlags: ['PAY_RATE_OUTLIER', 'SUSPICIOUS_KEYWORD_PATTERN'],
    riskSummary: 'Guaranteed daily rate of $650 for entry-level data processing. High probability of recruitment scam.',
    createdAt: new Date(Date.now() - 140 * 60000).toISOString(),
    data: {
      title: 'Remote Senior Data Verification Analyst (Immediate Start)',
      company: 'Apex Global Logistics Partners',
      salary: '$650 / day',
      type: 'Full-time Remote',
      description: 'Perform simple verification tasks from home on your own schedule. Guaranteed daily payout. No previous experience needed.',
      location: 'Remote / City Wide',
      requirements: ['Own computer with internet', 'Availability 2 hours per day'],
    },
  },
];

const SEED_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'vr_1',
    userId: 'u_re_1',
    userName: "Liam O'Connor",
    userEmail: 'liam.properties@buzzer.com',
    vertical: 'real-estate',
    badgeTitle: 'Licensed Real Estate Broker (State ID #RE-99214)',
    documentType: 'realtor_license',
    documentNumber: 'RE-NY-840192',
    documentImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    submittedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    status: 'pending',
  },
  {
    id: 'vr_2',
    userId: 'u_srv_1',
    userName: 'Nathan Cross',
    userEmail: 'nathan.electric@buzzer.com',
    vertical: 'service',
    badgeTitle: 'Master Certified Electrician #EL-4011',
    documentType: 'master_trade',
    documentNumber: 'EL-98214-MA',
    documentImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop',
    submittedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    status: 'pending',
  },
  {
    id: 'vr_3',
    userId: 'u_trn_2',
    userName: 'Emily Zhang',
    userEmail: 'emily.evshare@buzzer.com',
    vertical: 'transport',
    badgeTitle: 'Commercial Fleet Operator #TR-7721',
    documentType: 'dealer_permit',
    documentNumber: 'FLEET-EV-331',
    documentImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop',
    submittedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    status: 'pending',
  },
  {
    id: 'vr_4',
    userId: 'u_mkt_1',
    userName: 'Elena Torres',
    userEmail: 'elena.vintage@buzzer.com',
    vertical: 'marketplace',
    badgeTitle: 'Antique Guild Certified Appraiser',
    documentType: 'business_reg',
    documentNumber: 'AG-VINTAGE-004',
    documentImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop',
    submittedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    status: 'approved',
    reviewedBy: 'u_admin',
    reviewedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    reviewNotes: 'Identity and registration authenticated with National Antique Guild registry.',
  },
];

const SEED_GROUPS: Group[] = [
  {
    id: 'grp_1',
    name: 'City Creators Guild',
    members: ['u_admin', 'u_jordan', 'u_sarah', 'u_alex'],
    createdBy: 'u_jordan',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'grp_2',
    name: 'Downtown Marketplace Hub',
    members: ['u_admin', 'u_jordan', 'u_alex'],
    createdBy: 'u_admin',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'grp_3',
    name: 'Tech & Careers Forum',
    members: ['u_admin', 'u_sarah', 'u_jordan'],
    createdBy: 'u_sarah',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    avatar: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=100&auto=format&fit=crop&q=80',
  },
];

const SEED_GROUP_MESSAGES: GroupMessage[] = [
  {
    id: 'gm_1',
    groupId: 'grp_1',
    senderId: 'u_jordan',
    content: 'Welcome everyone to the City Creators Guild! Let us know what projects you are building this month.',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'gm_2',
    groupId: 'grp_1',
    senderId: 'u_alex',
    content: 'Excited to be here! Finishing up a new batch of restored mid-century furniture pieces.',
    timestamp: new Date(Date.now() - 1.8 * 86400000).toISOString(),
  },
  {
    id: 'gm_3',
    groupId: 'grp_1',
    senderId: 'u_sarah',
    content: 'Awesome! We are hosting the Saturday evening rooftop meetup. Looking forward to seeing everyone.',
    timestamp: new Date(Date.now() - 1.5 * 86400000).toISOString(),
  },
];

const SEED_STORIES: Story[] = [
  {
    id: 'st_1',
    userId: 'u_jordan',
    userName: 'Jordan Smith',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' }],
    content: 'Morning roast and ceramic testing session ☕',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    viewers: ['u_admin', 'u_sarah'],
    isExpired: false,
  },
  {
    id: 'st_2',
    userId: 'u_alex',
    userName: 'Alex Rivera',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80' }],
    content: 'Workshop tour: fresh wax on vintage leather!',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    viewers: ['u_jordan'],
    isExpired: false,
  },
];

async function initializeDatabase() {
  if (MONGODB_URI) {
    try {
      console.log('Connecting to MongoDB...');
      const mongoClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
      });
      await mongoClient.connect();
      const mongoDb = mongoClient.db('buzzer');
      users = mongoDb.collection('users');
      listings = mongoDb.collection('listings');
      jobApplications = mongoDb.collection('job_applications');
      messages = mongoDb.collection('messages');
      groups = mongoDb.collection('groups');
      groupMessages = mongoDb.collection('group_messages');
      adminLogs = mongoDb.collection('admin_logs');
      featureFlags = mongoDb.collection('feature_flags');
      userRestrictions = mongoDb.collection('user_restrictions');
      stories = mongoDb.collection('stories');
      supportTickets = mongoDb.collection('support_tickets');
      analytics = mongoDb.collection('analytics');
      businesses = mongoDb.collection('businesses');
      passwordResetTokens = mongoDb.collection('password_reset_tokens');
      verificationRequests = mongoDb.collection('verification_requests');

      const seedEmails = SEED_USERS.map(user => user.email);
      const existingSeedUsers = await users.find({ email: { $in: seedEmails } }).toArray();
      const existingSeedEmails = new Set(existingSeedUsers.map(user => user.email?.toLowerCase()));
      const missingSeedUsers = SEED_USERS.filter(user => !existingSeedEmails.has(user.email?.toLowerCase() || ''));
      if (missingSeedUsers.length > 0) {
        await Promise.all(missingSeedUsers.map(user => users.insertOne(user)));
      }
      for (const user of existingSeedUsers) {
        if (!user.passwordHash) {
          await users.updateOne({ id: user.id }, { $set: { passwordHash: PASSWORD_HASH } });
        }
      }
      const ownerSeed = SEED_USERS.find(user => user.id === 'u_admin');
      if (!ownerSeed) throw new Error('The primary staff account seed is missing');
      await users.updateOne(
        { email: ownerSeed.email },
        { $set: { role: 'admin', staffRole: 'superadmin' } },
      );
      await Promise.all(ADMIN_FEATURE_NAMES.map(name => featureFlags.updateOne(
        { name },
        { $setOnInsert: { name, enabled: true, scope: 'global', targetUsers: [], moderationEnabled: false, moderationRules: {}, lastModified: new Date(), modifiedBy: 'system' } },
        { upsert: true },
      )));

      console.log('Connected to MongoDB');
      return;
    } catch (err: any) {
      console.warn('MongoDB connection unavailable (' + err.message + '). Falling back to fast in-memory store.');
    }
  }

  function saveToDisk() {
    try {
      const dir = path.dirname(DATABASE_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const dump = {
        users: (users as InMemoryCollection<User>).docs,
        listings: (listings as InMemoryCollection<Listing>).docs,
        businesses: (businesses as InMemoryCollection<Business>).docs,
        jobApplications: (jobApplications as InMemoryCollection<JobApplication>).docs,
        messages: (messages as InMemoryCollection<Message>).docs,
        groups: (groups as InMemoryCollection<Group>).docs,
        groupMessages: (groupMessages as InMemoryCollection<GroupMessage>).docs,
        adminLogs: (adminLogs as InMemoryCollection<AdminLog>).docs,
        featureFlags: (featureFlags as InMemoryCollection<FeatureFlag>).docs,
        userRestrictions: (userRestrictions as InMemoryCollection<UserRestriction>).docs,
        stories: (stories as InMemoryCollection<Story>).docs,
        supportTickets: (supportTickets as InMemoryCollection<SupportTicket>).docs,
        analytics: (analytics as InMemoryCollection<AnalyticsRecord>).docs,
        passwordResetTokens: (passwordResetTokens as InMemoryCollection<PasswordResetToken>).docs,
        verificationRequests: (verificationRequests as InMemoryCollection<VerificationRequest>).docs,
      };
      fs.writeFileSync(DATABASE_FILE_PATH, JSON.stringify(dump, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save database to disk:', e);
    }
  }

  let initialDump: any = null;
  try {
    if (fs.existsSync(DATABASE_FILE_PATH)) {
      const raw = fs.readFileSync(DATABASE_FILE_PATH, 'utf-8');
      initialDump = JSON.parse(raw);
      console.log(`Loaded database from disk: ${path.relative(__dirname, DATABASE_FILE_PATH)}`);
    }
  } catch (e) {
    console.warn('Could not read existing database file, bootstrapping clean data:', e);
  }

  console.log('Booting database with 30 real user accounts across 6 sections.');
  users = new InMemoryCollection<User>(initialDump?.users || SEED_USERS);
  const ownerSeed = SEED_USERS.find(user => user.id === 'u_admin');
  if (!ownerSeed) throw new Error('The primary staff account seed is missing');
  const owner = await users.findOne({ email: ownerSeed.email });
  if (owner) {
    await users.updateOne({ email: ownerSeed.email }, { $set: { role: 'admin', staffRole: 'superadmin' } });
  } else {
    await users.insertOne(ownerSeed);
  }
  
  // Merge any missing moderation queue seed items into existing listings
  const baseListings: Listing[] = initialDump?.listings || SEED_LISTINGS;
  const existingIds = new Set(baseListings.map(l => l.id));
  const mergedListings = [...baseListings];
  for (const seedL of SEED_LISTINGS) {
    if (!existingIds.has(seedL.id)) {
      mergedListings.push(seedL);
    }
  }
  listings = new InMemoryCollection<Listing>(mergedListings);
  businesses = new InMemoryCollection<Business>(initialDump?.businesses || BUSINESSES_DATA);
  jobApplications = new InMemoryCollection<JobApplication>(initialDump?.jobApplications || []);
  messages = new InMemoryCollection<Message>(initialDump?.messages || []);
  groups = new InMemoryCollection<Group>(initialDump?.groups || SEED_GROUPS);
  groupMessages = new InMemoryCollection<GroupMessage>(initialDump?.groupMessages || SEED_GROUP_MESSAGES);
  adminLogs = new InMemoryCollection<AdminLog>(initialDump?.adminLogs || []);
  featureFlags = new InMemoryCollection<FeatureFlag>(initialDump?.featureFlags || [
    { name: 'instant_chat', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
    { name: 'reels_feed', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
    { name: 'auto_spam_filter', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
    { name: 'duplicate_image_shield', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
    { name: 'pii_protection_mode', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
  ]);
  await Promise.all(ADMIN_FEATURE_NAMES.map(name => featureFlags.updateOne(
    { name },
    { $setOnInsert: { name, enabled: true, scope: 'global', targetUsers: [], moderationEnabled: false, moderationRules: {}, lastModified: new Date(), modifiedBy: 'system' } },
    { upsert: true },
  )));
  userRestrictions = new InMemoryCollection<UserRestriction>(initialDump?.userRestrictions || []);
  stories = new InMemoryCollection<Story>(initialDump?.stories || SEED_STORIES);
  supportTickets = new InMemoryCollection<SupportTicket>(initialDump?.supportTickets || [
    {
      ticketId: 'tck_101',
      userId: 'u_jordan',
      subject: 'Feature Suggestion: Category Filter Tags',
      description: 'Would love to filter marketplace listings by multiple tags.',
      priority: 'low',
      category: 'feature_request',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000),
    },
    {
      ticketId: 'tck_102',
      userId: 'u_mkt_3',
      subject: 'Transaction dispute on pottery kiln order #882',
      description: 'Customer claims courier dropped the box, requested return label authorization.',
      priority: 'high',
      category: 'dispute',
      status: 'open',
      createdAt: new Date(Date.now() - 1800000),
      updatedAt: new Date(Date.now() - 1800000),
    },
  ]);
  analytics = new InMemoryCollection<AnalyticsRecord>(initialDump?.analytics || [
    {
      date: new Date().toISOString().split('T')[0],
      metrics: { activeUsers: 31, newUsers: 30, messagesSent: 12, avgResponseTime: 45, errorRate: 0 },
      pageViews: { home: 34, marketplace: 22, messages: 18, jobs: 12, services: 9 },
      userActions: { login: 6, view_listing: 28, send_message: 8 },
    },
  ]);
  passwordResetTokens = new InMemoryCollection<PasswordResetToken>(initialDump?.passwordResetTokens || []);
  verificationRequests = new InMemoryCollection<VerificationRequest>(initialDump?.verificationRequests || SEED_VERIFICATION_REQUESTS);

  onDatabaseChange = saveToDisk;
  saveToDisk();
}

// ── Socket.IO Setup ───────────────────────────────────────────

function setupSocketIO() {
  const io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  });
  socketServer = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') return next(new Error('Unauthorized'));
    try {
      const claims = jwt.verify(token, JWT_SECRET) as { userId?: string };
      if (!claims.userId) return next(new Error('Unauthorized'));
      (socket.data as { userId: string }).userId = claims.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as { userId: string }).userId;

    socket.on('join-room', async (peerId: string) => {
      if (typeof peerId !== 'string' || !peerId || peerId === userId) return;
      if (!await users.findOne({ id: peerId })) return;
      socket.join(directChatId(userId, peerId));
    });

    socket.on('leave-room', (peerId: string) => {
      if (typeof peerId === 'string' && peerId && peerId !== userId) {
        socket.leave(directChatId(userId, peerId));
      }
    });

    socket.on('send-message', async (data: { messageId?: string }) => {
      if (typeof data?.messageId !== 'string') return;
      const message = await messages.findOne({ id: data.messageId, senderId: userId });
      if (message?.recipientId) {
        const sender = await users.findOne({ id: userId });
        socket.to(message.chatId).emit('new-message', {
          ...message,
          senderName: sender?.name ?? 'Buzzer user',
          senderAvatar: sender?.profileImageUrl ?? '',
        });
      }
    });

    socket.on('typing', (data: { peerId: string; isTyping: boolean }) => {
      if (typeof data?.peerId !== 'string' || !data.peerId || data.peerId === userId) return;
      socket.to(directChatId(userId, data.peerId)).emit('user-typing', {
        userId,
        isTyping: Boolean(data.isTyping),
      });
    });
  });

  return io;
}

// ── Helpers ───────────────────────────────────────────────────

function generateToken(userId: string, identifier: string, claims: Record<string, unknown> = {}) {
  return jwt.sign({ userId, identifier, ...claims }, JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(u: User) {
  const { passwordHash, ...safe } = u;
  return safe;
}

function uid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function directChatId(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join(':');
}

function listingDataForOwner(section: string, data: Record<string, any>, id: string, ownerName: string) {
  const normalized = { ...data };
  for (const field of [
    'verified', 'rating', 'reviews', 'sellerRating', 'distance', 'followers',
    'featured', 'attendees', 'attending', 'isAttending',
  ]) {
    delete normalized[field];
  }
  return {
    ...normalized,
    id,
    seller: ownerName,
    ...(section === 'service' ? { name: ownerName } : {}),
  };
}

function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET) as any;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requirePermission(permission: AdminPermission) {
  return (req: any, res: any, next: any) => {
    if (!req.staffRole || !hasAdminPermission(req.staffRole, permission)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
}

function requireFeature(featureName: string) {
  return async (_req: any, res: any, next: any) => {
    try {
      const feature = await featureFlags.findOne({ name: featureName });
      if (feature?.enabled === false) {
        return res.status(503).json({ message: 'This feature is currently unavailable' });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

function listingFeatureName(section: string) {
  const featureNameBySection: Record<string, string> = {
    marketplace: 'marketplace',
    job: 'job_posting',
    service: 'business_features',
    'real-estate': 'real_estate',
    transport: 'taxi_service',
    event: 'event_creation',
  };
  return featureNameBySection[section];
}

async function listingFeatureEnabled(section: string) {
  const featureName = listingFeatureName(section);
  if (!featureName) return true;
  const feature = await featureFlags.findOne({ name: featureName });
  return feature?.enabled !== false;
}

function staffRoleForUser(user: User | null | undefined): StaffRole | undefined {
  const role = user?.staffRole ??
    (user?.role === 'moderator' ? 'moderator' : undefined);
  return isStaffRole(role) ? role : undefined;
}

function adminMiddleware(req: any, res: any, next: any) {
  authMiddleware(req, res, async () => {
    const tokenRole = req.user?.staffRole;
    if (req.user?.demoStaff === true) {
      if (process.env.NODE_ENV === 'production' || !isStaffRole(tokenRole)) {
        return res.status(403).json({ message: 'Development staff sessions are disabled' });
      }
      const demoUser = await users.findOne({ id: req.user.userId });
      if (!demoUser || demoUser.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      req.staffRole = tokenRole;
      return next();
    }

    const user = await users.findOne({ id: req.user.userId });
    const staffRole = staffRoleForUser(user);
    if (!user || !staffRole || !isStaffRole(staffRole)) {
      return res.status(403).json({ message: 'Staff access required' });
    }
    req.staffRole = staffRole;
    next();
  });
}

// ── Auth API Routes ───────────────────────────────────────────

app.post('/api/auth/email-signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: 'Email, password and name are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email address' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const normalizedEmail = email.toLowerCase();
  const existing = await users.findOne({ email: normalizedEmail });
  if (existing) return res.status(409).json({ message: 'An account with this email already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uid();
  const user: User = { id: userId, email: normalizedEmail, passwordHash, name, role: 'user', createdAt: new Date().toISOString() };
  await users.insertOne(user);
  const token = generateToken(userId, normalizedEmail);
  res.json({ success: true, token, user: safeUser(user) });
});

app.post('/api/auth/email-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await users.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) return res.status(401).json({ message: 'No account found with this email' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Incorrect password' });
  const token = generateToken(user.id, email.toLowerCase());
  res.json({ success: true, token, user: safeUser(user) });
});

app.get('/api/auth/me', authMiddleware, async (req: any, res) => {
  if (req.user?.demoStaff === true && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ message: 'Development staff sessions are disabled' });
  }
  const user = await users.findOne({ id: req.user.userId });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const demoRole: unknown = req.user?.staffRole;
  if (req.user?.demoStaff === true && process.env.NODE_ENV !== 'production' && isStaffRole(demoRole)) {
    const demoProfiles: Record<StaffRole, { name: string; email: string; title: string }> = {
      superadmin: { name: 'Alex Vance', email: 'admin@buzzer.com', title: 'Platform Director & Superadmin' },
      operations: { name: 'Elena Rostova', email: 'elena.ops@buzzer.com', title: 'Commercial Operations & Partner CRM' },
      moderator: { name: 'David Chen', email: 'david.mod@buzzer.com', title: 'Trust & Safety Lead Moderator' },
      support: { name: 'Sarah Miller', email: 'sarah.support@buzzer.com', title: 'Customer Experience & Help Desk' },
    };
    const profile = demoProfiles[demoRole];
    return res.json({
      success: true,
      user: {
        ...safeUser(user),
        name: profile.name,
        email: profile.email,
        role: 'admin',
        staffRole: demoRole,
        demoStaff: true,
        staffTitle: profile.title,
      },
    });
  }
  res.json({ success: true, user: safeUser(user) });
});

app.post('/api/auth/logout', (_req, res) => res.json({ success: true, message: 'Logged out' }));

app.post('/api/auth/forgot-password', async (_req, res) => {
  res.status(503).json({ message: 'Password reset email delivery is not configured' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const resetToken = await passwordResetTokens.findOne({ token });
  if (!resetToken) return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
  if (new Date() > resetToken.expiresAt) {
    await passwordResetTokens.deleteOne({ token });
    return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await users.updateOne({ id: resetToken.userId }, { $set: { passwordHash } });
  await passwordResetTokens.deleteOne({ token });
  res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
});

// ── Listings API ──────────────────────────────────────────────

app.get('/api/listings', async (_req, res) => {
  try {
    const [activeListings, configuredFlags] = await Promise.all([
      listings.find({ status: 'active' }).sort({ createdAt: -1 }).toArray(),
      featureFlags.find().toArray(),
    ]);
    const disabled = new Set(configuredFlags.filter(flag => !flag.enabled).map(flag => flag.name));
    const all = activeListings.filter(listing => {
      const featureName = listingFeatureName(listing.section);
      return !featureName || !disabled.has(featureName);
    });
    const ownerIds = [...new Set(all.map(listing => listing.userId))];
    const owners = await users.find(
      { id: { $in: ownerIds } },
      { projection: { id: 1, name: 1, profileImageUrl: 1, bio: 1, location: 1 } },
    ).toArray();
    const ownerById = new Map(owners.map(owner => [owner.id, owner]));
    res.json({
      success: true,
      listings: all.flatMap(listing => {
        const owner = ownerById.get(listing.userId);
        if (!owner) return [];
        return [{
          ...listing,
          data: listingDataForOwner(listing.section, listing.data, listing.id, owner.name),
          sellerName: owner.name,
          owner: {
            id: owner.id,
            name: owner.name,
            profileImageUrl: owner.profileImageUrl,
            bio: owner.bio,
            location: owner.location,
          },
        }];
      }),
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/listings/mine', authMiddleware, async (req: any, res) => {
  try {
    const mine = await listings.find({ userId: req.user.userId }).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, listings: mine });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/listings', authMiddleware, async (req: any, res) => {
  const { section, data } = req.body;
  const supportedSections = ['marketplace', 'job', 'service', 'real-estate', 'transport', 'event'];
  if (!supportedSections.includes(section) || !data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ message: 'A supported section and listing data are required' });
  }
  if (!(await listingFeatureEnabled(section))) {
    return res.status(403).json({ message: 'Listing submissions are temporarily disabled for this category' });
  }
  const featureFlagName = listingFeatureName(section);
  const featureFlag = featureFlagName ? await featureFlags.findOne({ name: featureFlagName }) : null;
  if (featureFlag?.moderationRules?.maxDailySubmissions !== undefined) {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const todayListings = await listings.find({ userId: req.user.userId }).toArray();
    const submissionsToday = todayListings.filter(listing =>
      new Date(listing.createdAt).getTime() >= midnight.getTime(),
    ).length;
    if (submissionsToday >= featureFlag.moderationRules.maxDailySubmissions) {
      return res.status(429).json({ message: 'You have reached the daily listing submission limit' });
    }
  }
  const owner = await users.findOne({ id: req.user.userId }, {
    projection: { id: 1, name: 1, profileImageUrl: 1, bio: 1, location: 1 },
  });
  if (!owner) return res.status(401).json({ message: 'Sign in again to publish a listing' });
  const id = 'lst_' + uid();
  const listing: Listing = {
    id,
    section,
    data: listingDataForOwner(section, data, id, owner.name),
    userId: req.user.userId,
    status: featureFlag?.moderationEnabled || featureFlag?.moderationRules?.requiresApproval
      ? 'pending_review'
      : 'active',
    createdAt: new Date().toISOString(),
  };
  try {
    await listings.insertOne(listing);
    res.json({
      success: true,
      listing: {
        ...listing,
        sellerName: owner.name,
        owner: {
          id: owner.id,
          name: owner.name,
          profileImageUrl: owner.profileImageUrl,
          bio: owner.bio,
          location: owner.location,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/listings/:id', authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  const { data } = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ message: 'Listing data is required' });
  }
  const listing = await listings.findOne({ id });
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (listing.userId !== req.user.userId) return res.status(403).json({ message: 'Not your listing' });
  if (!(await listingFeatureEnabled(listing.section))) {
    return res.status(403).json({ message: 'Listing updates are temporarily disabled for this category' });
  }
  const owner = await users.findOne({ id: req.user.userId }, {
    projection: { id: 1, name: 1, profileImageUrl: 1, bio: 1, location: 1 },
  });
  if (!owner) return res.status(401).json({ message: 'Sign in again to update this listing' });
  const updatedData = listingDataForOwner(listing.section, data, id, owner.name);
  await listings.updateOne({ id }, { $set: { data: updatedData } });
  res.json({
    success: true,
    listing: {
      ...listing,
      data: updatedData,
      sellerName: owner.name,
      owner: {
        id: owner.id,
        name: owner.name,
        profileImageUrl: owner.profileImageUrl,
        bio: owner.bio,
        location: owner.location,
      },
    },
  });
});

app.patch('/api/listings/:id/status', authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'paused', 'sold'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const listing = await listings.findOne({ id });
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (listing.userId !== req.user.userId) return res.status(403).json({ message: 'Not your listing' });
  if (status === 'active' && !(await listingFeatureEnabled(listing.section))) {
    return res.status(403).json({ message: 'Listing activation is temporarily disabled for this category' });
  }
  await listings.updateOne({ id }, { $set: { status } });
  res.json({ success: true });
});

app.delete('/api/listings/:id', authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  const listing = await listings.findOne({ id });
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (listing.userId !== req.user.userId) return res.status(403).json({ message: 'Not your listing' });
  await listings.deleteOne({ id });
  res.json({ success: true });
});

// ── Job Applications API ──────────────────────────────────────

app.post('/api/jobs/:listingId/applications', authMiddleware, requireFeature('job_posting'), async (req: any, res) => {
  const coverLetter = typeof req.body.coverLetter === 'string' ? req.body.coverLetter.trim() : '';
  if (!coverLetter || coverLetter.length > 5000) {
    return res.status(400).json({ message: 'A cover letter between 1 and 5,000 characters is required' });
  }
  const listing = await listings.findOne({ id: req.params.listingId, section: 'job', status: 'active' });
  if (!listing) return res.status(404).json({ message: 'This job is no longer accepting applications' });
  if (listing.userId === req.user.userId) {
    return res.status(400).json({ message: 'You cannot apply to your own job posting' });
  }
  const applicant = await users.findOne({ id: req.user.userId }, {
    projection: { id: 1, name: 1, email: 1, profileImageUrl: 1, bio: 1, location: 1 },
  });
  if (!applicant) return res.status(401).json({ message: 'Sign in again to apply for this job' });

  const application: JobApplication = {
    id: uid(),
    listingId: listing.id,
    applicantId: applicant.id,
    coverLetter,
    status: 'submitted',
    createdAt: new Date().toISOString(),
  };
  try {
    await jobApplications.insertOne(application);
    res.status(201).json({
      success: true,
      application: {
        ...application,
        applicant: {
          id: applicant.id,
          name: applicant.name,
          email: applicant.email,
          profileImageUrl: applicant.profileImageUrl,
          bio: applicant.bio,
          location: applicant.location,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/jobs/:listingId/applications/mine', authMiddleware, async (req: any, res) => {
  const application = await jobApplications.findOne({
    listingId: req.params.listingId,
    applicantId: req.user.userId,
  });
  res.json({ success: true, application });
});

app.get('/api/jobs/:listingId/applications', authMiddleware, async (req: any, res) => {
  const listing = await listings.findOne({ id: req.params.listingId, section: 'job' });
  if (!listing) return res.status(404).json({ message: 'Job listing not found' });
  if (listing.userId !== req.user.userId) {
    return res.status(403).json({ message: 'Only the job poster can view applications' });
  }
  const applications = await jobApplications.find({ listingId: listing.id }).sort({ createdAt: -1 }).toArray();
  const applicantIds = [...new Set(applications.map(application => application.applicantId))];
  const applicants = await users.find(
    { id: { $in: applicantIds } },
    { projection: { id: 1, name: 1, email: 1, profileImageUrl: 1, bio: 1, location: 1 } },
  ).toArray();
  const applicantById = new Map(applicants.map(applicant => [applicant.id, applicant]));
  res.json({
    success: true,
    applications: applications.map(application => ({
      ...application,
      applicant: applicantById.get(application.applicantId) ?? null,
    })),
  });
});

// ── Contacts ──────────────────────────────────────────────────

app.get('/api/contacts', authMiddleware, async (req: any, res) => {
  try {
    const all = await users.find({ id: { $ne: req.user.userId } }).toArray();
    res.json({ success: true, contacts: all.map(safeUser) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Messages ──────────────────────────────────────────────────

app.get('/api/messages', authMiddleware, requireFeature('messaging'), async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const allMessages = await messages.find().sort({ timestamp: 1 }).toArray();
    const relevantMessages = allMessages.filter(message =>
      message.senderId === userId || message.recipientId === userId
    );
    const latestByPeer = new Map<string, Message>();
    const categoryByPeer = new Map<string, string>();
    for (const message of relevantMessages) {
      const peerId = message.senderId === userId ? message.recipientId : message.senderId;
      if (peerId) {
        latestByPeer.set(peerId, message);
        if (message.listing?.category) categoryByPeer.set(peerId, message.listing.category);
      }
    }
    const peerIds = [...latestByPeer.keys()];
    const peerUsers = await users.find({ id: { $in: peerIds } }).toArray();
    const usersById = new Map(peerUsers.map(peer => [peer.id, peer]));
    const conversations = peerIds
      .map(peerId => {
        const peer = usersById.get(peerId);
        const lastMessage = latestByPeer.get(peerId);
        if (!peer || !lastMessage) return null;
        return {
          peer: { id: peer.id, name: peer.name, profileImageUrl: peer.profileImageUrl },
          lastMessage,
          category: categoryByPeer.get(peerId) ?? 'Messages',
        };
      })
      .filter(Boolean)
      .reverse();
    res.json({ success: true, conversations });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/messages/:peerId', authMiddleware, requireFeature('messaging'), async (req: any, res) => {
  try {
    const { peerId } = req.params;
    const userId = req.user.userId;
    if (peerId === userId || !await users.findOne({ id: peerId })) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const chatId = directChatId(userId, peerId);
    const msgs = (await messages.find({ chatId }).sort({ timestamp: 1 }).toArray())
      .filter(message => message.senderId === userId || message.recipientId === userId);
    res.json({ success: true, messages: msgs });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/messages', authMiddleware, requireFeature('messaging'), async (req: any, res) => {
  try {
    const { recipientId, content, replyTo, listing, offerData } = req.body;
    const userId = req.user.userId;
    const hasContent = typeof content === 'string' && Boolean(content.trim());
    const validListing = listing && typeof listing.id === 'string' && typeof listing.title === 'string'
      && typeof listing.price === 'string' && typeof listing.category === 'string';
    const validOffer = offerData && typeof offerData.listingTitle === 'string'
      && Number.isFinite(offerData.askingPrice) && offerData.askingPrice >= 0
      && Number.isFinite(offerData.offerPrice) && offerData.offerPrice > 0
      && (offerData.askingPrice === 0 || offerData.offerPrice < offerData.askingPrice);
    if (typeof recipientId !== 'string' || !recipientId || (!hasContent && !validListing && !validOffer)) {
      return res.status(400).json({ message: 'recipientId and message content or a listing are required' });
    }
    if (offerData && !validOffer) return res.status(400).json({ message: 'Invalid offer details' });
    if (recipientId === userId) return res.status(400).json({ message: 'You cannot message yourself' });
    if (!await users.findOne({ id: recipientId })) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    if (hasContent && content.length > 5000) return res.status(400).json({ message: 'Message exceeds the 5000 character limit' });
    const msg: Message = {
      id: uid(),
      chatId: directChatId(userId, recipientId),
      senderId: userId,
      recipientId,
      content: hasContent ? content.trim() : '',
      timestamp: new Date().toISOString(),
      status: 'sent',
      ...(validListing && { listing }),
      ...(replyTo && { replyTo }),
      ...(validOffer && {
        type: 'offer' as const,
        offerData: {
          listingTitle: offerData.listingTitle,
          ...(typeof offerData.listingImage === 'string' && { listingImage: offerData.listingImage }),
          askingPrice: offerData.askingPrice,
          offerPrice: offerData.offerPrice,
          status: 'pending' as const,
          ...(offerData.isCounter === true && { isCounter: true }),
          ...(Number.isFinite(offerData.expiresAt) && { expiresAt: offerData.expiresAt }),
        },
      }),
    };
    await messages.insertOne(msg);
    res.json({ success: true, message: msg });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/messages/:id/offer', authMiddleware, requireFeature('messaging'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { action, offerPrice } = req.body;
    const message = await messages.findOne({ id });
    if (!message || message.type !== 'offer' || !message.offerData || message.recipientId !== req.user.userId) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    if (message.offerData.status !== 'pending') {
      return res.status(409).json({ message: 'This offer is no longer pending' });
    }
    if (action === 'accept' || action === 'decline') {
      const status = action === 'accept' ? 'accepted' : 'declined';
      await messages.updateOne({ id, chatId: message.chatId }, { $set: { 'offerData.status': status } });
      socketServer?.to(message.chatId).emit('offer-status', { messageId: id, status });
      return res.json({ success: true, status });
    }
    if (action !== 'counter' || !Number.isFinite(offerPrice) || offerPrice <= 0
      || (message.offerData.askingPrice > 0 && offerPrice >= message.offerData.askingPrice)) {
      return res.status(400).json({ message: 'Enter a valid counter-offer below the asking price' });
    }

    await messages.updateOne({ id, chatId: message.chatId }, { $set: { 'offerData.status': 'countered' } });
    socketServer?.to(message.chatId).emit('offer-status', { messageId: id, status: 'countered' });
    const counterMessage: Message = {
      id: uid(),
      chatId: message.chatId,
      senderId: req.user.userId,
      recipientId: message.senderId,
      content: '',
      timestamp: new Date().toISOString(),
      status: 'sent',
      type: 'offer',
      offerData: {
        listingTitle: message.offerData.listingTitle,
        ...(message.offerData.listingImage && { listingImage: message.offerData.listingImage }),
        askingPrice: message.offerData.askingPrice,
        offerPrice,
        status: 'pending',
        isCounter: true,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      },
      ...(message.listing && { listing: message.listing }),
    };
    await messages.insertOne(counterMessage);
    const sender = await users.findOne({ id: req.user.userId });
    socketServer?.to(message.chatId).emit('new-message', {
      ...counterMessage,
      senderName: sender?.name ?? 'Buzzer user',
      senderAvatar: sender?.profileImageUrl ?? '',
    });
    res.json({ success: true, message: counterMessage });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/messages/:id/status', authMiddleware, requireFeature('messaging'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['sent', 'delivered', 'read'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const message = await messages.findOne({ id });
    if (!message || (message.senderId !== req.user.userId && message.recipientId !== req.user.userId)) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (status === 'sent' && message.senderId !== req.user.userId) {
      return res.status(403).json({ message: 'Only the sender can set the sent status' });
    }
    if (status !== 'sent' && message.recipientId !== req.user.userId) {
      return res.status(403).json({ message: 'Only the recipient can update delivery status' });
    }
    await messages.updateOne({ id, chatId: message.chatId }, { $set: { status } });
    socketServer?.to(message.chatId).emit('message-status', {
      messageId: id,
      status,
      userId: req.user.userId,
    });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Groups ────────────────────────────────────────────────────

app.get('/api/groups', authMiddleware, async (req: any, res) => {
  try {
    const userGroups = await groups.find({ members: req.user.userId }).toArray();
    res.json({ success: true, groups: userGroups });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/groups', authMiddleware, requireFeature('group_creation'), async (req: any, res) => {
  try {
    const { name, members: memberList, avatar } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const group: Group = {
      id: uid(),
      name,
      members: [...new Set([req.user.userId, ...(memberList || [])])],
      createdBy: req.user.userId,
      createdAt: new Date().toISOString(),
      ...(avatar && { avatar }),
    };
    await groups.insertOne(group);
    res.json({ success: true, group });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/groups/:id/messages', authMiddleware, requireFeature('messaging'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const group = await groups.findOne({ id });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(req.user.userId)) return res.status(403).json({ message: 'Not a member' });
    const msgs = await groupMessages.find({ groupId: id }).sort({ timestamp: 1 }).toArray();
    res.json({ success: true, messages: msgs });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/groups/:id/messages', authMiddleware, requireFeature('messaging'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'content is required' });
    const group = await groups.findOne({ id });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(req.user.userId)) return res.status(403).json({ message: 'Not a member' });
    const msg: GroupMessage = {
      id: uid(),
      groupId: id,
      senderId: req.user.userId,
      content,
      timestamp: new Date().toISOString(),
    };
    await groupMessages.insertOne(msg);
    res.json({ success: true, message: msg });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Stories ───────────────────────────────────────────────────

app.get('/api/stories', authMiddleware, requireFeature('story_sharing'), async (_req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const activeStories = await stories.find({ timestamp: { $gte: oneDayAgo }, isExpired: false }).sort({ timestamp: -1 }).toArray();
    res.json({ success: true, stories: activeStories });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/stories', authMiddleware, requireFeature('story_sharing'), async (req: any, res) => {
  try {
    const user = await users.findOne({ id: req.user.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { media, content } = req.body;
    const story: Story = {
      id: uid(),
      userId: req.user.userId,
      userName: user.name,
      userAvatar: user.profileImageUrl || '',
      media: media || [],
      content,
      timestamp: new Date().toISOString(),
      viewers: [],
      isExpired: false,
    };
    await stories.insertOne(story);
    res.json({ success: true, story });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/stories/:id/view', authMiddleware, requireFeature('story_sharing'), async (req: any, res) => {
  try {
    await stories.updateOne({ id: req.params.id }, { $addToSet: { viewers: req.user.userId } } as any);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/stories/:id/expire', authMiddleware, requireFeature('story_sharing'), async (req: any, res) => {
  try {
    await stories.updateOne({ id: req.params.id }, { $set: { isExpired: true } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Support ───────────────────────────────────────────────────

app.get('/api/support/tickets', authMiddleware, async (req: any, res) => {
  try {
    const user = await users.findOne({ id: req.user.userId });
    const staffRole = req.user?.demoStaff === true && process.env.NODE_ENV !== 'production'
      ? req.user.staffRole
      : staffRoleForUser(user);
    const canManageTickets = staffRole && hasAdminPermission(staffRole, 'support:reply');
    const query = canManageTickets ? {} : { userId: req.user.userId };
    const tickets = await supportTickets.find(query).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, tickets });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/support/tickets', authMiddleware, async (req: any, res) => {
  try {
    const { subject, description, category } = req.body;
    if (!subject || !description) return res.status(400).json({ message: 'subject and description are required' });
    const now = new Date();
    const priority = ['low', 'medium', 'high', 'urgent'].includes(req.body.priority) ? req.body.priority : 'medium';
    const slaHours: Record<string, number> = { urgent: 4, high: 8, medium: 24, low: 72 };
    const ticket: SupportTicket = {
      ticketId: uid(),
      userId: req.user.userId,
      subject,
      description,
      priority,
      category: category || 'general',
      status: 'open',
      createdAt: now,
      updatedAt: now,
      slaDueAt: new Date(now.getTime() + slaHours[priority] * 60 * 60 * 1000),
    };
    await supportTickets.insertOne(ticket);
    res.json({ success: true, ticket });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/support/tickets/:id', adminMiddleware, requirePermission('support:reply'), async (req: any, res) => {
  try {
    const ticket = await supportTickets.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body.status !== undefined) {
      if (!['open', 'in_progress', 'resolved', 'closed'].includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid ticket status' });
      }
      updates.status = req.body.status;
    }
    if (req.body.priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(req.body.priority)) {
        return res.status(400).json({ message: 'Invalid ticket priority' });
      }
      updates.priority = req.body.priority;
      const slaHours: Record<string, number> = { urgent: 4, high: 8, medium: 24, low: 72 };
      updates.slaDueAt = new Date(Date.now() + slaHours[req.body.priority] * 60 * 60 * 1000);
    }
    if (req.body.assignedTo !== undefined) {
      if (req.body.assignedTo !== null) {
        const assignee = await users.findOne({ id: req.body.assignedTo });
        if (!assignee || !staffRoleForUser(assignee)) {
          return res.status(400).json({ message: 'Assignee must be an active staff account' });
        }
      }
      updates.assignedTo = req.body.assignedTo || null;
    }
    await supportTickets.updateOne({ ticketId: req.params.id }, { $set: updates });
    await adminLogs.insertOne({
      id: uid(),
      action: 'support_ticket_updated',
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { ticketId: req.params.id, updates },
    });
    res.json({ success: true, ticket: await supportTickets.findOne({ ticketId: req.params.id }) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/support/tickets/:id/replies', adminMiddleware, requirePermission('support:reply'), async (req: any, res) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 5000) {
      return res.status(400).json({ message: 'Reply must be between 1 and 5000 characters' });
    }
    const ticket = await supportTickets.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
    const response: SupportTicketResponse = {
      responseId: uid(),
      userId: req.user.userId,
      message,
      createdAt: new Date(),
    };
    await supportTickets.updateOne({ ticketId: req.params.id }, {
      $push: { responses: response },
      $set: { updatedAt: new Date() },
    });
    await adminLogs.insertOne({
      id: uid(),
      action: 'support_ticket_replied',
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { ticketId: req.params.id, responseId: response.responseId },
    });
    res.status(201).json({ success: true, response });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/support/tickets/:id/escalate', adminMiddleware, requirePermission('support:escalate'), async (req: any, res) => {
  try {
    const ticket = await supportTickets.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
    await supportTickets.updateOne({ ticketId: req.params.id }, {
      $set: {
        priority: 'urgent',
        escalatedAt: new Date(),
        slaDueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });
    await adminLogs.insertOne({
      id: uid(),
      action: 'support_ticket_escalated',
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { ticketId: req.params.id },
    });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Businesses & Advertisements ────────────────────────────────

app.get('/api/businesses', requireFeature('business_features'), async (req, res) => {
  try {
    const { type, category, search, sponsored } = req.query as Record<string, string>;
    let query: any = {};
    const cat = type || category;
    if (cat && cat !== 'All Categories' && cat !== 'All') {
      query.category = cat;
    }
    if (sponsored === 'true') {
      query.isSponsored = true;
    }
    let list = await businesses.find(query).toArray();
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((b: any) =>
        b.name?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q)
      );
    }
    res.json({ success: true, businesses: list, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/advertisements', requireFeature('business_features'), async (_req, res) => {
  try {
    const ads = await businesses.find({ isSponsored: true }).toArray();
    res.json({ success: true, advertisements: ads, data: ads });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/businesses/:id', requireFeature('business_features'), async (req, res) => {
  try {
    const business = await businesses.findOne({ id: req.params.id });
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    res.json({ success: true, business, data: business });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/businesses', authMiddleware, requireFeature('business_features'), async (req: any, res) => {
  try {
    const { name, category, description, phone, email, website, location, image, hours, isSponsored, adHeadline, adTag } = req.body;
    if (!name || !category || !description) {
      return res.status(400).json({ success: false, message: 'Name, category, and description are required' });
    }
    const userDoc = await users.findOne({ id: req.user.userId });
    const staffRole = staffRoleForUser(userDoc);
    const canManageAds = staffRole && hasAdminPermission(staffRole, 'ads:manage');
    const sponsored = Boolean(canManageAds && isSponsored);
    const newBiz: Business = {
      id: `biz_${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      rating: 5.0,
      reviews: 1,
      location: location?.trim() || userDoc?.location || 'Downtown Center',
      distance: '0.4 miles',
      image: image?.trim() || 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop',
      description: description.trim(),
      phone: phone?.trim() || userDoc?.contactPhone || '+1 (555) 010-0000',
      email: email?.trim() || userDoc?.email || 'contact@buzzer.com',
      website: website?.trim() || '',
      hours: hours?.trim() || 'Mon-Fri: 9AM-6PM',
      verified: true,
      isSponsored: sponsored,
      adHeadline: sponsored ? (adHeadline?.trim() || 'Featured Community Advertisement') : undefined,
      adTag: sponsored ? (adTag?.trim() || 'Sponsored Partner') : undefined,
      ownerId: req.user.userId,
      ownerName: userDoc?.name || 'Community Business Owner',
      createdAt: new Date().toISOString(),
    };
    await businesses.insertOne(newBiz);
    res.status(201).json({ success: true, message: 'Business listed successfully', business: newBiz, data: newBiz });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/businesses/:id', authMiddleware, requireFeature('business_features'), async (req: any, res) => {
  try {
    const biz = await businesses.findOne({ id: req.params.id });
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });
    const userDoc = await users.findOne({ id: req.user.userId });
    const staffRole = staffRoleForUser(userDoc);
    const canManageAds = staffRole && hasAdminPermission(staffRole, 'ads:manage');
    const isOwner = biz.ownerId === req.user.userId;
    if (!isOwner && !canManageAds) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this business' });
    }
    const allowed = ['name', 'category', 'description', 'phone', 'email', 'website', 'location', 'image', 'hours'];
    if (canManageAds) allowed.push('isSponsored', 'adHeadline', 'adTag');
    const update: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    await businesses.updateOne({ id: req.params.id }, { $set: update });
    const updated = await businesses.findOne({ id: req.params.id });
    res.json({ success: true, business: updated, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/businesses/:id/sponsor', authMiddleware, requireFeature('business_features'), async (req: any, res) => {
  try {
    const userDoc = await users.findOne({ id: req.user.userId });
    const staffRole = staffRoleForUser(userDoc);
    if (!staffRole || !hasAdminPermission(staffRole, 'ads:manage')) {
      return res.status(403).json({ success: false, message: 'Business advertising access required' });
    }
    const biz = await businesses.findOne({ id: req.params.id });
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });
    const newSponsored = !biz.isSponsored;
    await businesses.updateOne({ id: req.params.id }, {
      $set: {
        isSponsored: newSponsored,
        adTag: newSponsored ? (req.body.adTag || 'Sponsored Partner') : undefined,
        adHeadline: newSponsored ? (req.body.adHeadline || 'Featured Community Advertisement') : undefined,
      }
    });
    res.json({ success: true, isSponsored: newSponsored, message: `Business is now ${newSponsored ? 'sponsored' : 'standard'}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/businesses/:id', authMiddleware, requireFeature('business_features'), async (req: any, res) => {
  try {
    const biz = await businesses.findOne({ id: req.params.id });
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });
    const userDoc = await users.findOne({ id: req.user.userId });
    const staffRole = staffRoleForUser(userDoc);
    const canManageAds = staffRole && hasAdminPermission(staffRole, 'ads:manage');
    if (biz.ownerId !== req.user.userId && !canManageAds) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this business' });
    }
    await businesses.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Business deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin ─────────────────────────────────────────────────────

app.get('/api/admin/stats', adminMiddleware, requirePermission('overview:read'), async (_req, res) => {
  try {
    const [totalUsers, totalMessages, totalGroups, totalListings] = await Promise.all([
      users.countDocuments(),
      messages.countDocuments(),
      groups.countDocuments(),
      listings.countDocuments({ status: 'active' }),
    ]);
    res.json({ success: true, data: { totalUsers, totalMessages, totalGroups, totalListings, lastUpdated: new Date() } });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/messages', adminMiddleware, requirePermission('messaging:audit'), async (_req, res) => {
  try {
    const [recentMessages, totalMessages, sentMessages, readMessages] = await Promise.all([
      messages.find().sort({ timestamp: -1 }).limit(100).toArray(),
      messages.countDocuments(),
      messages.countDocuments({ status: 'sent' }),
      messages.countDocuments({ status: 'read' }),
    ]);
    const senderIds = [...new Set(recentMessages.map(message => message.senderId))];
    const senders = await users.find(
      { id: { $in: senderIds } },
      { projection: { id: 1, name: 1 } },
    ).toArray();
    const senderNames = new Map(senders.map(sender => [sender.id, sender.name]));
    res.json({
      success: true,
      messages: recentMessages.map(message => ({
        ...message,
        senderName: senderNames.get(message.senderId) ?? 'Deleted user',
      })),
      stats: { totalMessages, sentMessages, readMessages },
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/groups', adminMiddleware, requirePermission('messaging:audit'), async (_req, res) => {
  try {
    const allGroups = await groups.find().sort({ createdAt: -1 }).toArray();
    const creatorIds = [...new Set(allGroups.map(group => group.createdBy))];
    const creators = await users.find(
      { id: { $in: creatorIds } },
      { projection: { id: 1, name: 1 } },
    ).toArray();
    const creatorNames = new Map(creators.map(creator => [creator.id, creator.name]));
    res.json({
      success: true,
      groups: allGroups.map(group => ({
        id: group.id,
        name: group.name,
        memberCount: group.members.length,
        createdBy: creatorNames.get(group.createdBy) ?? 'Deleted user',
        createdAt: group.createdAt,
      })),
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/db-stats', adminMiddleware, requirePermission('system:audit_logs'), async (_req, res) => {
  try {
    const [usersCount, messagesCount, groupsCount, listingsCount, storiesCount, ticketsCount] = await Promise.all([
      users.countDocuments(),
      messages.countDocuments(),
      groups.countDocuments(),
      listings.countDocuments(),
      stories.countDocuments(),
      supportTickets.countDocuments(),
    ]);
    res.json({ success: true, stats: { users: usersCount, messages: messagesCount, groups: groupsCount, listings: listingsCount, stories: storiesCount, support_tickets: ticketsCount } });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/users', adminMiddleware, requirePermission('users:read'), async (req: any, res) => {
  try {
    const allUsers = await users.find().sort({ createdAt: -1 }).toArray();
    const revealPii = req.query.unmask === 'true' && hasAdminPermission(req.staffRole, 'users:pii');
    const data = allUsers.map(user => {
      const safe = safeUser(user);
      if (revealPii) return safe;
      return {
        ...safe,
        email: safe.email ? safe.email.replace(/^(.).+(@.*)$/, '$1••••$2') : safe.email,
        phoneNumber: safe.phoneNumber ? `${safe.phoneNumber.slice(0, 3)}••••••` : safe.phoneNumber,
        contactPhone: safe.contactPhone ? `${safe.contactPhone.slice(0, 3)}••••••` : safe.contactPhone,
      };
    });
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/search', adminMiddleware, requirePermission('users:read'), async (req: any, res) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    if (query.length < 2) return res.json({ success: true, results: [] });
    const needle = query.toLocaleLowerCase();
    const [allUsers, allListings, allBusinesses, allTickets] = await Promise.all([
      users.find().toArray(),
      listings.find().toArray(),
      businesses.find().toArray(),
      supportTickets.find().toArray(),
    ]);
    const includes = (value: unknown) => typeof value === 'string' && value.toLocaleLowerCase().includes(needle);
    const maskEmail = (email?: string) => email?.replace(/^(.).+(@.*)$/, '$1••••$2');
    const results = [
      ...allUsers.filter(user => includes(user.name) || includes(user.email) || includes(user.id)).slice(0, 8)
        .map(user => ({ type: 'user', id: user.id, label: user.name, detail: maskEmail(user.email), href: `/admin?tab=users&user=${encodeURIComponent(user.id)}` })),
      ...allListings.filter(listing => includes(listing.id) || includes(listing.section) ||
        includes(listing.data?.title) || includes(listing.data?.name)).slice(0, 8)
        .map(listing => ({ type: 'listing', id: listing.id, label: listing.data?.title || listing.data?.name || 'Untitled listing', detail: listing.section, href: `/admin?tab=moderation` })),
      ...allBusinesses.filter(business => includes(business.name) || includes(business.category) || includes(business.id)).slice(0, 8)
        .map(business => ({ type: 'business', id: business.id, label: business.name, detail: business.category, href: `/admin?tab=merchants` })),
      ...allTickets.filter(ticket => includes(ticket.ticketId) || includes(ticket.subject) || includes(ticket.category)).slice(0, 8)
        .map(ticket => ({ type: 'ticket', id: ticket.ticketId, label: ticket.subject, detail: ticket.status, href: `/admin?tab=support` })),
    ].slice(0, 32);
    res.json({ success: true, results });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/users/:id/timeline', adminMiddleware, requirePermission('users:read'), async (req: any, res) => {
  try {
    const target = await users.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ message: 'User not found' });
    const [userListings, restrictions, tickets, verifications, logs] = await Promise.all([
      listings.find({ userId: req.params.id }).toArray(),
      userRestrictions.find({ userId: req.params.id }).toArray(),
      supportTickets.find({ userId: req.params.id }).toArray(),
      verificationRequests.find({ userId: req.params.id }).toArray(),
      adminLogs.find().sort({ timestamp: -1 }).limit(2000).toArray(),
    ]);
    const events = [
      ...userListings.map(listing => ({
        id: `listing-${listing.id}`,
        type: 'listing',
        timestamp: new Date(listing.createdAt),
        summary: `Listing created: ${listing.data?.title || listing.data?.name || listing.section}`,
        status: listing.status,
      })),
      ...restrictions.map(restriction => ({
        id: `restriction-${restriction.id}`,
        type: 'restriction',
        timestamp: new Date(restriction.createdAt),
        summary: `${restriction.type} restriction: ${restriction.reason}`,
        status: restriction.status,
      })),
      ...tickets.map(ticket => ({
        id: `ticket-${ticket.ticketId}`,
        type: 'support',
        timestamp: new Date(ticket.createdAt),
        summary: `Support ticket: ${ticket.subject}`,
        status: ticket.status,
      })),
      ...verifications.map(request => ({
        id: `verification-${request.id}`,
        type: 'verification',
        timestamp: new Date(request.submittedAt),
        summary: `Verification submitted: ${request.badgeTitle}`,
        status: request.status,
      })),
      ...logs.filter(log => {
        const details = log.details || {};
        return details.userId === req.params.id || details.targetUserId === req.params.id ||
          details.applicantId === req.params.id;
      }).map(log => ({
        id: `audit-${log.id}`,
        type: 'staff action',
        timestamp: new Date(log.timestamp),
        summary: log.action,
        status: 'recorded',
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 200);
    const safeAccount = safeUser(target);
    res.json({
      success: true,
      account: {
        id: safeAccount.id,
        name: safeAccount.name,
        email: safeAccount.email?.replace(/^(.).+(@.*)$/, '$1••••$2'),
        role: safeAccount.staffRole || safeAccount.role,
        createdAt: safeAccount.createdAt,
      },
      timeline: events,
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/admin/users/:id/role', adminMiddleware, requirePermission('users:write'), async (req: any, res) => {
  try {
    const { role } = req.body;
    if (role !== 'user' && !isStaffRole(role)) return res.status(400).json({ message: 'Invalid staff role' });
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot change your own staff access' });
    }
    const target = await users.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.email?.toLowerCase() === 'admin@buzzer.com' && role !== 'superadmin') {
      return res.status(400).json({ message: 'The primary platform owner must retain Super Admin access' });
    }
    if (role === 'user') {
      await users.updateOne({ id: req.params.id }, { $set: { role: 'user' }, $unset: { staffRole: 1 } });
    } else {
      await users.updateOne({ id: req.params.id }, { $set: { role: 'admin', staffRole: role } });
    }
    await adminLogs.insertOne({ id: uid(), action: 'update_user_role', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id, role } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/admin/users/:id', adminMiddleware, requirePermission('users:write'), async (req: any, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const target = await users.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.email?.toLowerCase() === 'admin@buzzer.com') {
      return res.status(400).json({ message: 'The primary platform owner account cannot be deleted' });
    }
    await users.deleteOne({ id: req.params.id });
    await adminLogs.insertOne({ id: uid(), action: 'delete_user', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/users/:id/restrict', adminMiddleware, requirePermission('users:ban'), async (req: any, res) => {
  try {
    const target = await users.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot restrict your own account' });
    }
    if (target.email?.toLowerCase() === 'admin@buzzer.com') {
      return res.status(400).json({ message: 'The primary platform owner account cannot be restricted' });
    }
    const { type, reason, endDate } = req.body;
    if (!['ban', 'suspend', 'restrict'].includes(type)) {
      return res.status(400).json({ message: 'Invalid restriction type' });
    }
    if (typeof reason !== 'string' || reason.trim().length < 10 || reason.length > 2000) {
      return res.status(400).json({ message: 'Reason must be between 10 and 2000 characters' });
    }
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    if (endDate && (!parsedEndDate || Number.isNaN(parsedEndDate.getTime()) || parsedEndDate <= new Date())) {
      return res.status(400).json({ message: 'End date must be a valid future date' });
    }
    if (type !== 'ban' && !parsedEndDate) {
      return res.status(400).json({ message: 'Temporary restrictions require an end date' });
    }
    const restriction: UserRestriction = {
      id: uid(),
      userId: req.params.id,
      type,
      reason: reason.trim(),
      status: 'active',
      createdBy: req.user.userId,
      startDate: new Date(),
      ...(parsedEndDate ? { endDate: parsedEndDate } : {}),
      createdAt: new Date(),
    };
    await userRestrictions.insertOne(restriction);
    await adminLogs.insertOne({ id: uid(), action: 'restrict_user', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id, restriction } });
    res.json({ success: true, restriction });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/restrictions', adminMiddleware, requirePermission('users:ban'), async (_req, res) => {
  try {
    const records = await userRestrictions.find().sort({ createdAt: -1 }).toArray();
    const now = Date.now();
    const active = records.filter(restriction =>
      restriction.status === 'active' &&
      (!restriction.endDate || new Date(restriction.endDate).getTime() > now),
    );
    const expired = records.filter(restriction =>
      restriction.status === 'active' &&
      restriction.endDate &&
      new Date(restriction.endDate).getTime() <= now,
    );
    await Promise.all(expired.map(restriction =>
      userRestrictions.updateOne({ id: restriction.id }, { $set: { status: 'lifted' } }),
    ));
    const userIds = [...new Set(active.map(restriction => restriction.userId))];
    const affectedUsers = await users.find({ id: { $in: userIds } }, {
      projection: { id: 1, name: 1 },
    }).toArray();
    const names = new Map(affectedUsers.map(user => [user.id, user.name]));
    res.json({
      success: true,
      restrictions: active.map(restriction => ({ ...restriction, userName: names.get(restriction.userId) || 'Deleted user' })),
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/admin/restrictions/:id/lift', adminMiddleware, requirePermission('users:ban'), async (req: any, res) => {
  try {
    const restriction = await userRestrictions.findOne({ id: req.params.id });
    if (!restriction) return res.status(404).json({ message: 'Restriction not found' });
    if (restriction.status !== 'active') return res.status(409).json({ message: 'Restriction is no longer active' });
    await userRestrictions.updateOne({ id: req.params.id }, {
      $set: { status: 'lifted', liftedBy: req.user.userId, liftedAt: new Date() },
    });
    await adminLogs.insertOne({
      id: uid(),
      action: 'lift_user_restriction',
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { restrictionId: req.params.id, targetUserId: restriction.userId },
    });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/users/:id/restrictions', adminMiddleware, requirePermission('users:read'), async (req: any, res) => {
  try {
    const restrictions = await userRestrictions.find({ userId: req.params.id, status: 'active' }).toArray();
    res.json({ success: true, restrictions });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/logs', adminMiddleware, requirePermission('system:audit_logs'), async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await adminLogs.find().sort({ timestamp: -1 }).limit(limit).toArray();
    res.json({ success: true, logs });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/logs', adminMiddleware, requirePermission('system:audit_logs'), async (req: any, res) => {
  try {
    const action = typeof req.body.action === 'string' ? req.body.action.trim() : '';
    const details = req.body.details && typeof req.body.details === 'object' && !Array.isArray(req.body.details)
      ? req.body.details
      : {};
    if (!action || action.length > 120 || JSON.stringify(details).length > 10000) {
      return res.status(400).json({ message: 'Valid action and bounded details are required' });
    }
    const log: AdminLog = {
      id: uid(),
      action,
      performedBy: req.user.userId,
      timestamp: new Date(),
      details,
    };
    await adminLogs.insertOne(log);
    res.status(201).json({ success: true, log });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/activity', adminMiddleware, requirePermission('system:audit_logs'), async (req: any, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit as string, 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const allLogs = await adminLogs.find().sort({ timestamp: -1 }).limit(2000).toArray();
    const records = allLogs.filter(log => {
      if (!userId) return true;
      const details = log.details || {};
      return log.performedBy === userId ||
        details.userId === userId ||
        details.targetUserId === userId ||
        details.applicantId === userId;
    }).slice(0, limit);
    const actorIds = [...new Set(records.map(log => log.performedBy))];
    const actors = await users.find({ id: { $in: actorIds } }, {
      projection: { id: 1, name: 1 },
    }).toArray();
    const actorNames = new Map(actors.map(actor => [actor.id, actor.name]));
    res.json({
      success: true,
      activities: records.map(log => ({
        ...log,
        actorName: actorNames.get(log.performedBy) || 'Deleted staff account',
      })),
    });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/features', adminMiddleware, requirePermission('system:flags'), async (_req, res) => {
  try {
    const flags = await featureFlags.find().toArray();
    res.json({ success: true, features: flags });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/features/:name', adminMiddleware, requirePermission('system:flags'), async (req: any, res) => {
  try {
    const { name } = req.params;
    const { enabled, scope, targetUsers, moderationEnabled, moderationRules } = req.body;
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be a boolean' });
    }
    if (scope !== undefined && !['global', 'user'].includes(scope)) {
      return res.status(400).json({ message: 'Invalid feature scope' });
    }
    if (targetUsers !== undefined && (!Array.isArray(targetUsers) || targetUsers.some((id: unknown) => typeof id !== 'string'))) {
      return res.status(400).json({ message: 'targetUsers must be an array of user IDs' });
    }
    if (moderationEnabled !== undefined && typeof moderationEnabled !== 'boolean') {
      return res.status(400).json({ message: 'moderationEnabled must be a boolean' });
    }
    if (moderationRules !== undefined) {
      if (typeof moderationRules !== 'object' || moderationRules === null) {
        return res.status(400).json({ message: 'Invalid moderation rules' });
      }
      const max = moderationRules.maxDailySubmissions;
      if (max !== undefined && (!Number.isInteger(max) || max < 0 || max > 100000)) {
        return res.status(400).json({ message: 'Invalid moderation rules' });
      }
    }
    const set: Record<string, unknown> = {
      name,
      lastModified: new Date(),
      modifiedBy: req.user.userId,
    };
    if (enabled !== undefined) set.enabled = enabled;
    if (scope !== undefined) set.scope = scope;
    if (targetUsers !== undefined) set.targetUsers = targetUsers;
    if (moderationEnabled !== undefined) set.moderationEnabled = moderationEnabled;
    if (moderationRules !== undefined) set.moderationRules = moderationRules;
    await featureFlags.updateOne(
      { name },
      { $set: set, $setOnInsert: { enabled: false, scope: 'global', targetUsers: [] } },
      { upsert: true }
    );
    await adminLogs.insertOne({ id: uid(), action: 'toggle_feature', performedBy: req.user.userId, timestamp: new Date(), details: { name, enabled } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Moderation Triage Queue (OLX-style) ─────────────────────────

app.get('/api/admin/moderation/queue', adminMiddleware, requirePermission('listings:review'), async (req: any, res) => {
  try {
    const filterStatus = req.query.status as string; // 'all', 'pending', 'flagged'
    let query: any = {};
    if (filterStatus === 'pending') {
      query = { status: 'pending_review' };
    } else if (filterStatus === 'flagged') {
      query = { status: 'flagged' };
    } else if (filterStatus === 'reviewed') {
      query = { status: { $in: ['active', 'rejected'] } };
    } else {
      query = { status: { $in: ['pending_review', 'flagged', 'active'] } };
    }

    const queueItems = await listings.find(query).sort({ createdAt: -1 }).toArray();
    const ownerIds = [...new Set(queueItems.map(l => l.userId))];
    const owners = await users.find({ id: { $in: ownerIds } }, {
      projection: { id: 1, name: 1, profileImageUrl: 1 }
    }).toArray();
    const ownerMap = new Map(owners.map(o => [o.id, o]));
    const activeRestrictions = (await userRestrictions.find({ status: 'active' }).toArray()).filter(restriction =>
      !restriction.endDate || new Date(restriction.endDate).getTime() > Date.now(),
    );
    const restrictionCounts = new Map<string, number>();
    for (const restriction of activeRestrictions) {
      restrictionCounts.set(restriction.userId, (restrictionCounts.get(restriction.userId) || 0) + 1);
    }

    const enriched = queueItems.map(item => {
      const owner = ownerMap.get(item.userId);
      return {
        ...item,
        seller: owner?.name || 'Local Member',
        sellerAvatar: owner?.profileImageUrl,
        activeRestrictionCount: restrictionCounts.get(item.userId) || 0,
        riskScore: item.riskScore ?? null,
        riskFlags: item.riskFlags ?? [],
        riskSummary: item.riskSummary ?? 'No automated risk assessment recorded',
      };
    });

    res.json({ success: true, items: enriched, total: enriched.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/moderation/decide', adminMiddleware, requirePermission('listings:review'), async (req: any, res) => {
  try {
    const { listingId, decision, reason } = req.body;
    if (typeof listingId !== 'string' || !['approve', 'reject', 'flag', 'escalate'].includes(decision)) {
      return res.status(400).json({ message: 'Valid listingId and decision (approve/reject/flag/escalate) required' });
    }

    const listing = await listings.findOne({ id: listingId });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (!['pending_review', 'flagged'].includes(listing.status)) {
      return res.status(409).json({ message: 'Listing is no longer awaiting moderation' });
    }
    const newStatus = decision === 'approve' ? 'active' : decision === 'reject' ? 'rejected' : 'flagged';
    await listings.updateOne({ id: listingId }, {
      $set: {
        status: newStatus,
        moderatedBy: req.user.userId,
        moderatedAt: new Date().toISOString(),
        moderationReason: reason || (decision === 'approve' ? 'Meets marketplace trust standards' : 'Rejected by moderation policy'),
      }
    });

    await adminLogs.insertOne({
      id: uid(),
      action: `listing_${decision}`,
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { listingId, decision, reason: reason || 'Moderation decision recorded' }
    });

    res.json({ success: true, status: newStatus, message: `Listing marked as ${newStatus}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/moderation/bulk-decide', adminMiddleware, requirePermission('listings:review'), async (req: any, res) => {
  try {
    const { listingIds, decision, reason } = req.body;
    if (!Array.isArray(listingIds) || listingIds.length === 0 || listingIds.length > 100 ||
        listingIds.some(id => typeof id !== 'string') ||
        !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Provide 1 to 100 listing IDs and a valid approve/reject decision' });
    }
    const uniqueIds = [...new Set(listingIds)];
    const newStatus = decision === 'approve' ? 'active' : 'rejected';
    const modifiedIds: string[] = [];
    const failedIds: string[] = [];
    for (const id of uniqueIds) {
      const listing = await listings.findOne({ id });
      if (!listing || !['pending_review', 'flagged'].includes(listing.status)) {
        failedIds.push(id);
        continue;
      }
      const result = await listings.updateOne({ id, status: listing.status }, {
        $set: {
          status: newStatus,
          moderatedBy: req.user.userId,
          moderatedAt: new Date().toISOString(),
          moderationReason: reason || `Bulk ${decision}`,
        }
      });
      if (result.modifiedCount > 0) modifiedIds.push(id);
      else failedIds.push(id);
    }

    if (modifiedIds.length) {
      await adminLogs.insertOne({
        id: uid(),
        action: `listing_bulk_${decision}`,
        performedBy: req.user.userId,
        timestamp: new Date(),
        details: { listingIds: modifiedIds, decision }
      });
    }

    res.json({
      success: true,
      modifiedCount: modifiedIds.length,
      modifiedIds,
      failedIds,
      message: `Processed ${modifiedIds.length} listings; ${failedIds.length} were skipped because they were missing or no longer awaiting moderation`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Trust & Verification Desk (Rieltor.ua-style) ───────────────

app.get('/api/admin/verifications', adminMiddleware, requirePermission('verification:review'), async (_req, res) => {
  try {
    const requests = await verificationRequests.find().sort({ submittedAt: -1 }).toArray();
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/verifications/decide', adminMiddleware, requirePermission('verification:review'), async (req: any, res) => {
  try {
    const { requestId, decision, notes } = req.body;
    if (!requestId || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Valid requestId and decision required' });
    }

    const reqDoc = await verificationRequests.findOne({ id: requestId });
    if (!reqDoc) return res.status(404).json({ message: 'Verification request not found' });

    await verificationRequests.updateOne({ id: requestId }, {
      $set: {
        status: decision,
        reviewedBy: req.user.userId,
        reviewedAt: new Date().toISOString(),
        reviewNotes: notes || (decision === 'approved' ? 'Official accreditation confirmed' : 'Insufficient credential proof'),
      }
    });

    if (decision === 'approved') {
      // Award verified badge on user profile and their listings
      await users.updateOne({ id: reqDoc.userId }, { $set: { verified: true, verifiedBadge: reqDoc.badgeTitle } });
      await listings.updateOne({ userId: reqDoc.userId }, { $set: { 'data.verified': true } });
    }

    await adminLogs.insertOne({
      id: uid(),
      action: `verification_${decision}`,
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { requestId, userId: reqDoc.userId, vertical: reqDoc.vertical, decision }
    });

    res.json({ success: true, message: `Verification request ${decision}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Executive Cockpit KPIs & CRM Overview ──────────────────────

app.get('/api/admin/crm/overview', adminMiddleware, requirePermission('overview:read'), async (_req, res) => {
  try {
    const [
      totalUsersCount,
      activeListingsCount,
      pendingQueueCount,
      verificationsCount,
      openTicketsCount,
      activeBusinessesCount,
      logsCount
    ] = await Promise.all([
      users.countDocuments(),
      listings.countDocuments({ status: 'active' }),
      listings.countDocuments({ status: 'pending_review' }),
      verificationRequests.countDocuments({ status: 'pending' }),
      supportTickets.countDocuments({ status: 'open' }),
      businesses.countDocuments({ isSponsored: true }),
      adminLogs.countDocuments(),
    ]);

    res.json({
      success: true,
      kpis: {
        totalUsers: totalUsersCount,
        activeListings: activeListingsCount,
        pendingModeration: pendingQueueCount,
        pendingVerifications: verificationsCount,
        openTickets: openTicketsCount,
        sponsoredBusinesses: activeBusinessesCount,
        totalAuditLogs: logsCount,
        uptime: '99.98%',
        engine: 'InMemory + Local JSON persistence',
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── B2B Merchant Ad Extranet API ──────────────────────────────

app.get('/api/admin/crm/merchants', adminMiddleware, requirePermission('ads:manage'), async (_req, res) => {
  try {
    const allBiz = await businesses.find().toArray();
    const enriched = allBiz.map(b => ({
      ...b,
      impressions: null,
      clicks: null,
      ctr: null,
      leadsGenerated: null,
      tier: b.isSponsored ? 'Premium Partner' : 'Standard Merchant',
    }));
    res.json({ success: true, merchants: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Staff Role Impersonation (For Live Demo of all 4 RBAC Tiers) 

app.post('/api/admin/auth/staff-token', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Development staff sessions are unavailable' });
    }

    const { role } = req.body;
    const staffProfiles: Record<StaffRole, { name: string; email: string; title: string }> = {
      superadmin: { name: 'Alex Vance', email: 'admin@buzzer.com', title: 'Platform Director & Superadmin' },
      operations: { name: 'Elena Rostova', email: 'elena.ops@buzzer.com', title: 'Commercial Operations & Partner CRM' },
      moderator: { name: 'David Chen', email: 'david.mod@buzzer.com', title: 'Trust & Safety Lead Moderator' },
      support: { name: 'Sarah Miller', email: 'sarah.support@buzzer.com', title: 'Customer Experience & Help Desk' },
    };
    if (!isStaffRole(role)) return res.status(400).json({ message: 'Invalid staff role' });
    const profile = staffProfiles[role];
    let adminUser = await users.findOne({ email: staffProfiles.superadmin.email });
    if (!adminUser) {
      adminUser = {
        ...SEED_USERS.find(user => user.id === 'u_admin')!,
        role: 'admin',
      };
      await users.insertOne(adminUser);
    } else if (adminUser.role !== 'admin') {
      await users.updateOne({ id: adminUser.id }, { $set: { role: 'admin' } });
      adminUser = { ...adminUser, role: 'admin' };
    }

    const token = generateToken(adminUser.id, profile.email, { staffRole: role, demoStaff: true });
    res.json({
      success: true,
      token,
      user: {
        ...safeUser(adminUser),
        name: profile.name,
        email: profile.email,
        staffRole: role,
        demoStaff: true,
        staffTitle: profile.title,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── User profile update ───────────────────────────────────────

app.get('/api/users/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await users.findOne({ id: req.user.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user: safeUser(user) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/users/me', authMiddleware, async (req: any, res) => {
  try {
    const allowed = ['name', 'bio', 'location', 'profileImageUrl', 'contactPhone',
      'whatsapp', 'viber', 'telegram', 'signal', 'messenger'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'No valid fields to update' });
    await users.updateOne({ id: req.user.userId }, { $set: updates });
    const updated = await users.findOne({ id: req.user.userId });
    res.json({ success: true, user: safeUser(updated!) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Change password ───────────────────────────────────────────

app.post('/api/users/me/change-password', authMiddleware, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'New password is required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await users.findOne({ id: req.user.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.passwordHash) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await users.updateOne({ id: req.user.userId }, { $set: { passwordHash } });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/users/add-admin', adminMiddleware, requirePermission('users:write'), async (req: any, res) => {
  try {
    const { email, staffRole } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!isStaffRole(staffRole)) return res.status(400).json({ message: 'Invalid staff role' });
    const target = await users.findOne({ email: email.toLowerCase() });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot change your own staff access' });
    }
    if (target.email?.toLowerCase() === 'admin@buzzer.com' && staffRole !== 'superadmin') {
      return res.status(400).json({ message: 'The primary platform owner must retain Super Admin access' });
    }
    await users.updateOne({ email: email.toLowerCase() }, { $set: { role: 'admin', staffRole } });
    await adminLogs.insertOne({
      id: uid(),
      action: 'assign_staff_role',
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { targetUserId: target.id, staffRole },
    });
    res.json({ success: true, message: `${email} was assigned ${staffRole} access` });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Analytics ─────────────────────────────────────────────────

app.get('/api/admin/analytics', adminMiddleware, requirePermission('system:audit_logs'), async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const records = await analytics.find().sort({ date: -1 }).limit(limit).toArray();
    res.json({ success: true, analytics: records });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/analytics/pageview', async (req, res) => {
  try {
    const { page } = req.body;
    const today = new Date().toISOString().split('T')[0];
    await analytics.updateOne(
      { date: today },
      { $inc: { [`pageViews.${page}`]: 1 }, $setOnInsert: { date: today, metrics: { activeUsers: 0, newUsers: 0, messagesSent: 0, avgResponseTime: 0, errorRate: 0 }, userActions: {} } } as any,
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/analytics/action', async (req, res) => {
  try {
    const { action } = req.body;
    const today = new Date().toISOString().split('T')[0];
    await analytics.updateOne(
      { date: today },
      { $inc: { [`userActions.${action}`]: 1 }, $setOnInsert: { date: today, metrics: { activeUsers: 0, newUsers: 0, messagesSent: 0, avgResponseTime: 0, errorRate: 0 }, pageViews: {} } } as any,
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Health & Database Status Endpoints ─────────────────────────

app.get('/health', async (_req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

app.get('/api/database/status', async (_req, res) => {
  try {
    const userCount = await users.countDocuments();
    const listingCount = await listings.countDocuments();
    const allUsers = await users.find({}).toArray();
    res.json({
      success: true,
      database: {
        status: 'online',
        storage: 'Persistent File-Backed Store (MongoDB-compatible)',
        filePath: path.relative(__dirname, DATABASE_FILE_PATH),
        totalUsers: userCount,
        totalListings: listingCount,
        sections: {
          marketplace: 5,
          'real-estate': 5,
          jobs: 5,
          services: 5,
          transport: 5,
          events: 5,
          admin: 1,
        },
        users: allUsers.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          location: u.location,
          bio: u.bio,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Start Server & Mount Vite ─────────────────────────────────

const PORT = Number(process.env.PORT || 3000);

async function start() {
  await initializeDatabase();
  setupSocketIO();

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'registropolis-main/dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', ws: { server } },
      appType: 'spa',
      root: path.resolve(__dirname, 'registropolis-main'),
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Buzzer full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
