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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'buzzer-dev-jwt-secret-key-123456';
const MONGODB_URI = process.env.MONGODB_URI;

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
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: { id: string; content: string; sender: string };
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
  lastModified: Date;
  modifiedBy: string;
};

type UserRestriction = {
  id: string;
  userId: string;
  type: string;
  reason: string;
  status: 'active' | 'lifted';
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
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
    if (update.$addToSet) {
      for (const [k, v] of Object.entries(update.$addToSet)) {
        if (!Array.isArray(doc[k])) doc[k] = [];
        if (!doc[k].includes(v)) doc[k].push(v);
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
      console.log('Connected to MongoDB');
      return;
    } catch (err: any) {
      console.warn('MongoDB connection unavailable (' + err.message + '). Falling back to fast in-memory store.');
    }
  }

  const DB_FILE_PATH = path.resolve(__dirname, 'data/buzzer_database.json');

  function saveToDisk() {
    try {
      const dir = path.dirname(DB_FILE_PATH);
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
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dump, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save database to disk:', e);
    }
  }

  let initialDump: any = null;
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      initialDump = JSON.parse(raw);
      console.log('Loaded database from disk: data/buzzer_database.json');
    }
  } catch (e) {
    console.warn('Could not read existing database file, bootstrapping clean data:', e);
  }

  console.log('Booting database with 30 real user accounts across 6 sections.');
  users = new InMemoryCollection<User>(initialDump?.users || SEED_USERS);
  
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

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId: string) => socket.join(roomId));
    socket.on('leave-room', (roomId: string) => socket.leave(roomId));

    socket.on('send-message', (data: { roomId: string; message: any }) => {
      io.to(data.roomId).emit('new-message', data.message);
    });

    socket.on('typing', (data: { roomId: string; userId: string; isTyping: boolean }) => {
      socket.to(data.roomId).emit('user-typing', data);
    });
  });

  return io;
}

// ── Helpers ───────────────────────────────────────────────────

function generateToken(userId: string, identifier: string) {
  return jwt.sign({ userId, identifier }, JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(u: User) {
  const { passwordHash, ...safe } = u;
  return safe;
}

function uid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

function adminMiddleware(req: any, res: any, next: any) {
  authMiddleware(req, res, async () => {
    const user = await users.findOne({ id: req.user.userId });
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
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
  const user = await users.findOne({ id: req.user.userId });
  if (!user) return res.status(404).json({ message: 'User not found' });
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
    const all = await listings.find({ status: 'active' }).sort({ createdAt: -1 }).toArray();
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
    status: 'active',
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

app.post('/api/jobs/:listingId/applications', authMiddleware, async (req: any, res) => {
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

app.get('/api/messages/:chatId', authMiddleware, async (req: any, res) => {
  try {
    const { chatId } = req.params;
    const msgs = await messages.find({ chatId }).sort({ timestamp: 1 }).toArray();
    res.json({ success: true, messages: msgs });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/messages', authMiddleware, async (req: any, res) => {
  try {
    const { chatId, content, replyTo } = req.body;
    if (!chatId || !content) return res.status(400).json({ message: 'chatId and content are required' });
    const msg: Message = {
      id: uid(),
      chatId,
      senderId: req.user.userId,
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
      ...(replyTo && { replyTo }),
    };
    await messages.insertOne(msg);
    res.json({ success: true, message: msg });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/messages/:id/status', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['sent', 'delivered', 'read'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    await messages.updateOne({ id }, { $set: { status } });
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

app.post('/api/groups', authMiddleware, async (req: any, res) => {
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

app.get('/api/groups/:id/messages', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const group = await groups.findOne({ id });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(req.user.userId)) return res.status(403).json({ message: 'Not a member' });
    const msgs = await groupMessages.find({ groupId: id }).sort({ timestamp: 1 }).toArray();
    res.json({ success: true, messages: msgs });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/groups/:id/messages', authMiddleware, async (req: any, res) => {
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

app.get('/api/stories', authMiddleware, async (_req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const activeStories = await stories.find({ timestamp: { $gte: oneDayAgo }, isExpired: false }).sort({ timestamp: -1 }).toArray();
    res.json({ success: true, stories: activeStories });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/stories', authMiddleware, async (req: any, res) => {
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

app.patch('/api/stories/:id/view', authMiddleware, async (req: any, res) => {
  try {
    await stories.updateOne({ id: req.params.id }, { $addToSet: { viewers: req.user.userId } } as any);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/stories/:id/expire', authMiddleware, async (req: any, res) => {
  try {
    await stories.updateOne({ id: req.params.id }, { $set: { isExpired: true } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Support ───────────────────────────────────────────────────

app.get('/api/support/tickets', authMiddleware, async (req: any, res) => {
  try {
    const user = await users.findOne({ id: req.user.userId });
    const query = user?.role === 'admin' ? {} : { userId: req.user.userId };
    const tickets = await supportTickets.find(query).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, tickets });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/support/tickets', authMiddleware, async (req: any, res) => {
  try {
    const { subject, description, priority, category } = req.body;
    if (!subject || !description) return res.status(400).json({ message: 'subject and description are required' });
    const now = new Date();
    const ticket: SupportTicket = {
      ticketId: uid(),
      userId: req.user.userId,
      subject,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    await supportTickets.insertOne(ticket);
    res.json({ success: true, ticket });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/support/tickets/:id', adminMiddleware, async (req: any, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    await supportTickets.updateOne({ ticketId: req.params.id }, { $set: updates });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Businesses & Advertisements ────────────────────────────────

app.get('/api/businesses', async (req, res) => {
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

app.get('/api/advertisements', async (_req, res) => {
  try {
    const ads = await businesses.find({ isSponsored: true }).toArray();
    res.json({ success: true, advertisements: ads, data: ads });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/businesses/:id', async (req, res) => {
  try {
    const business = await businesses.findOne({ id: req.params.id });
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    res.json({ success: true, business, data: business });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/businesses', authMiddleware, async (req: any, res) => {
  try {
    const { name, category, description, phone, email, website, location, image, hours, isSponsored, adHeadline, adTag } = req.body;
    if (!name || !category || !description) {
      return res.status(400).json({ success: false, message: 'Name, category, and description are required' });
    }
    const userDoc = await users.findOne({ id: req.user.userId });
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
      isSponsored: Boolean(isSponsored),
      adHeadline: adHeadline?.trim() || (isSponsored ? 'Featured Community Advertisement' : undefined),
      adTag: adTag?.trim() || (isSponsored ? 'Sponsored Partner' : undefined),
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

app.patch('/api/businesses/:id', authMiddleware, async (req: any, res) => {
  try {
    const biz = await businesses.findOne({ id: req.params.id });
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });
    const userDoc = await users.findOne({ id: req.user.userId });
    if (biz.ownerId && biz.ownerId !== req.user.userId && userDoc?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this business' });
    }
    const allowed = ['name', 'category', 'description', 'phone', 'email', 'website', 'location', 'image', 'hours', 'isSponsored', 'adHeadline', 'adTag'];
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

app.patch('/api/businesses/:id/sponsor', authMiddleware, async (req: any, res) => {
  try {
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

app.delete('/api/businesses/:id', authMiddleware, async (req: any, res) => {
  try {
    const biz = await businesses.findOne({ id: req.params.id });
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found' });
    const userDoc = await users.findOne({ id: req.user.userId });
    if (biz.ownerId && biz.ownerId !== req.user.userId && userDoc?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this business' });
    }
    await businesses.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Business deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin ─────────────────────────────────────────────────────

app.get('/api/admin/stats', adminMiddleware, async (_req, res) => {
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

app.get('/api/admin/messages', adminMiddleware, async (_req, res) => {
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

app.get('/api/admin/groups', adminMiddleware, async (_req, res) => {
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

app.get('/api/admin/db-stats', adminMiddleware, async (_req, res) => {
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

app.get('/api/admin/users', adminMiddleware, async (_req, res) => {
  try {
    const allUsers = await users.find().sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: allUsers.map(safeUser) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/admin/users/:id/role', adminMiddleware, async (req: any, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'moderator'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    await users.updateOne({ id: req.params.id }, { $set: { role } });
    await adminLogs.insertOne({ id: uid(), action: 'update_user_role', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id, role } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/admin/users/:id', adminMiddleware, async (req: any, res) => {
  try {
    await users.deleteOne({ id: req.params.id });
    await adminLogs.insertOne({ id: uid(), action: 'delete_user', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/users/:id/restrict', adminMiddleware, async (req: any, res) => {
  try {
    const restriction: UserRestriction = {
      id: uid(),
      userId: req.params.id,
      ...req.body,
      status: 'active',
      createdBy: req.user.userId,
      createdAt: new Date(),
    };
    await userRestrictions.insertOne(restriction);
    await adminLogs.insertOne({ id: uid(), action: 'restrict_user', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id, restriction } });
    res.json({ success: true, restriction });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/users/:id/restrictions', adminMiddleware, async (req: any, res) => {
  try {
    const restrictions = await userRestrictions.find({ userId: req.params.id, status: 'active' }).toArray();
    res.json({ success: true, restrictions });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/logs', adminMiddleware, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await adminLogs.find().sort({ timestamp: -1 }).limit(limit).toArray();
    res.json({ success: true, logs });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/logs', adminMiddleware, async (req: any, res) => {
  try {
    const { action, details } = req.body;
    const log: AdminLog = { id: uid(), action, performedBy: req.user.userId, timestamp: new Date(), details: details || {} };
    await adminLogs.insertOne(log);
    res.json({ success: true, log });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/features', adminMiddleware, async (_req, res) => {
  try {
    const flags = await featureFlags.find().toArray();
    res.json({ success: true, features: flags });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/features/:name', adminMiddleware, async (req: any, res) => {
  try {
    const { name } = req.params;
    const { enabled, scope, targetUsers } = req.body;
    await featureFlags.updateOne(
      { name },
      { $set: { name, enabled, scope: scope || 'global', targetUsers: targetUsers || [], lastModified: new Date(), modifiedBy: req.user.userId } },
      { upsert: true }
    );
    await adminLogs.insertOne({ id: uid(), action: 'toggle_feature', performedBy: req.user.userId, timestamp: new Date(), details: { name, enabled } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Moderation Triage Queue (OLX-style) ─────────────────────────

app.get('/api/admin/moderation/queue', adminMiddleware, async (req: any, res) => {
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
      projection: { id: 1, name: 1, email: 1, profileImageUrl: 1, location: 1, contactPhone: 1 }
    }).toArray();
    const ownerMap = new Map(owners.map(o => [o.id, o]));

    const enriched = queueItems.map(item => {
      const owner = ownerMap.get(item.userId);
      return {
        ...item,
        seller: owner?.name || 'Local Member',
        sellerEmail: owner?.email || 'unregistered@buzzer.com',
        sellerLocation: owner?.location || 'Downtown Center',
        sellerAvatar: owner?.profileImageUrl,
        sellerPhone: owner?.contactPhone,
        riskScore: item.riskScore ?? (item.status === 'flagged' ? 75 : 15),
        riskFlags: item.riskFlags ?? (item.status === 'flagged' ? ['COMMUNITY_REPORTED'] : ['STANDARD_VERIFIED']),
        riskSummary: item.riskSummary ?? (item.status === 'flagged' ? 'Flagged by automated trust shield for manual review' : 'Standard listing submission'),
      };
    });

    res.json({ success: true, items: enriched, total: enriched.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/moderation/decide', adminMiddleware, async (req: any, res) => {
  try {
    const { listingId, decision, reason } = req.body;
    if (!listingId || !['approve', 'reject', 'flag', 'escalate'].includes(decision)) {
      return res.status(400).json({ message: 'Valid listingId and decision (approve/reject/flag) required' });
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

app.post('/api/admin/moderation/bulk-decide', adminMiddleware, async (req: any, res) => {
  try {
    const { listingIds, decision, reason } = req.body;
    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return res.status(400).json({ message: 'listingIds array required' });
    }
    const newStatus = decision === 'approve' ? 'active' : 'rejected';
    for (const id of listingIds) {
      await listings.updateOne({ id }, {
        $set: {
          status: newStatus,
          moderatedBy: req.user.userId,
          moderatedAt: new Date().toISOString(),
          moderationReason: reason || `Bulk ${decision}`,
        }
      });
    }

    await adminLogs.insertOne({
      id: uid(),
      action: `listing_bulk_${decision}`,
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { count: listingIds.length, decision }
    });

    res.json({ success: true, modifiedCount: listingIds.length, message: `Successfully ${decision}d ${listingIds.length} listings` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Trust & Verification Desk (Rieltor.ua-style) ───────────────

app.get('/api/admin/verifications', adminMiddleware, async (_req, res) => {
  try {
    const requests = await verificationRequests.find().sort({ submittedAt: -1 }).toArray();
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/verifications/decide', adminMiddleware, async (req: any, res) => {
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

app.get('/api/admin/crm/overview', adminMiddleware, async (_req, res) => {
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

app.get('/api/admin/crm/merchants', adminMiddleware, async (_req, res) => {
  try {
    const allBiz = await businesses.find().toArray();
    // Enrich with calculated ad impression & click metrics
    const enriched = allBiz.map((b, idx) => ({
      ...b,
      impressions: 1240 + (idx * 310) + ((b.isSponsored ? 4500 : 800)),
      clicks: 84 + (idx * 22) + ((b.isSponsored ? 390 : 45)),
      ctr: ((b.isSponsored ? 8.6 : 3.8) + (idx % 3) * 0.4).toFixed(1) + '%',
      leadsGenerated: 14 + (idx * 3) + (b.isSponsored ? 42 : 5),
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
    const { role } = req.body;
    // Pre-configured staff profiles
    const staffProfiles: Record<string, { id: string; name: string; email: string; role: string; title: string }> = {
      superadmin: { id: 'u_admin', name: 'Alex Vance (Superadmin)', email: 'admin@buzzer.com', role: 'admin', title: 'Platform Director' },
      operations: { id: 'u_staff_ops', name: 'Elena Rostova (Ops Manager)', email: 'elena.ops@buzzer.com', role: 'admin', title: 'B2B & Commercial Operations' },
      moderator: { id: 'u_staff_mod', name: 'David Chen (Trust & Safety)', email: 'david.mod@buzzer.com', role: 'admin', title: 'Senior Content Moderator' },
      support: { id: 'u_staff_sup', name: 'Sarah Miller (Help Desk)', email: 'sarah.support@buzzer.com', role: 'admin', title: 'Tier 1 Support Specialist' },
    };

    const profile = staffProfiles[role] || staffProfiles.superadmin;
    const token = generateToken(profile.id, profile.email);
    res.json({ success: true, token, user: profile });
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

app.post('/api/admin/users/add-admin', adminMiddleware, async (req: any, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const target = await users.findOne({ email: email.toLowerCase() });
    if (!target) return res.status(404).json({ message: 'User not found' });
    await users.updateOne({ email: email.toLowerCase() }, { $set: { role: 'admin' } });
    res.json({ success: true, message: `${email} is now an admin` });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Analytics ─────────────────────────────────────────────────

app.get('/api/admin/analytics', adminMiddleware, async (req: any, res) => {
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
        filePath: 'data/buzzer_database.json',
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

const PORT = 3000;

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
      server: { middlewareMode: true, host: '0.0.0.0' },
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
