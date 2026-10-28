import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { SEED_USERS as ACCOUNTS_DATA, SEED_LISTINGS as LISTINGS_DATA, SEED_BUSINESSES as BUSINESSES_DATA, SeedBusiness } from './registropolis-main/src/data/seedAccounts';
import { SupabaseCollection, type RecordCollection } from './supabaseStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

// ── Types ─────────────────────────────────────────────────────

type User = {
  id: string;
  phoneNumber?: string;
  email?: string;
  name: string;
  profileImageUrl?: string;
  role: string;
  staffRole?: 'superadmin' | 'operations' | 'moderator' | 'support';
  staffTitle?: string;
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
  createdAt: string;
  riskScore?: number;
  riskFlags?: string[];
  riskSummary?: string;
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
  status: 'active' | 'expired' | 'lifted';
  createdBy: string;
  createdAt: Date;
  startDate?: Date;
  endDate?: Date;
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
  responses?: Array<{
    responseId: string;
    responderId: string;
    message: string;
    createdAt: Date;
    isAdminResponse: boolean;
  }>;
};

type AnalyticsRecord = {
  date: string;
  metrics: { activeUsers: number; newUsers: number; messagesSent: number; avgResponseTime: number; errorRate: number };
  pageViews: Record<string, number>;
  userActions: Record<string, number>;
};

type VerificationRequest = {
  id: string;
  userId: string;
  vertical: string;
  badgeTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
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

    const doc = this.docs[idx] as any;
    if (update.$set) this.applySet(doc, update.$set);
    if (update.$inc) this.applyInc(doc, update.$inc);
    if (update.$unset) this.applyUnset(doc, update.$unset);
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

  private applyUnset(target: any, fields: Record<string, unknown>) {
    for (const path of Object.keys(fields)) {
      const parts = path.split('.');
      let current = target;
      for (const part of parts.slice(0, -1)) {
        if (!current[part] || typeof current[part] !== 'object') {
          current = undefined;
          break;
        }
        current = current[part];
      }
      if (current) delete current[parts[parts.length - 1]];
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

let users: RecordCollection<User>;
let listings: RecordCollection<Listing>;
let businesses: RecordCollection<Business>;
let jobApplications: RecordCollection<JobApplication>;
let messages: RecordCollection<Message>;
let groups: RecordCollection<Group>;
let groupMessages: RecordCollection<GroupMessage>;
let adminLogs: RecordCollection<AdminLog>;
let featureFlags: RecordCollection<FeatureFlag>;
let userRestrictions: RecordCollection<UserRestriction>;
let stories: RecordCollection<Story>;
let supportTickets: RecordCollection<SupportTicket>;
let analytics: RecordCollection<AnalyticsRecord>;
let verificationRequests: RecordCollection<VerificationRequest>;
let databaseProvider: 'supabase' | 'local' = 'local';

const SEED_USERS: User[] = [
  // Superadmin account preserved for system health and administration
  {
    id: 'u_admin',
    email: 'admin@buzzer.com',
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
  const hasSupabaseConfig = Boolean(SUPABASE_URL || SUPABASE_SERVICE_ROLE_KEY);
  if (hasSupabaseConfig) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable Supabase persistence.');
    }

    console.log('Connecting to Supabase...');
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabaseAdmin.from('app_records').select('id').limit(1);
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}. Apply the SQL migration in supabase/migrations first.`);
    }

    users = new SupabaseCollection<User>(supabaseAdmin, 'users');
    listings = new SupabaseCollection<Listing>(supabaseAdmin, 'listings');
    businesses = new SupabaseCollection<Business>(supabaseAdmin, 'businesses');
    jobApplications = new SupabaseCollection<JobApplication>(supabaseAdmin, 'job_applications');
    messages = new SupabaseCollection<Message>(supabaseAdmin, 'messages');
    groups = new SupabaseCollection<Group>(supabaseAdmin, 'groups');
    groupMessages = new SupabaseCollection<GroupMessage>(supabaseAdmin, 'group_messages');
    adminLogs = new SupabaseCollection<AdminLog>(supabaseAdmin, 'admin_logs');
    featureFlags = new SupabaseCollection<FeatureFlag>(supabaseAdmin, 'feature_flags');
    userRestrictions = new SupabaseCollection<UserRestriction>(supabaseAdmin, 'user_restrictions');
    stories = new SupabaseCollection<Story>(supabaseAdmin, 'stories');
    supportTickets = new SupabaseCollection<SupportTicket>(supabaseAdmin, 'support_tickets');
    analytics = new SupabaseCollection<AnalyticsRecord>(supabaseAdmin, 'analytics');
    verificationRequests = new SupabaseCollection<VerificationRequest>(supabaseAdmin, 'verification_requests');

    const seedMissingRecords = async <T extends Record<string, any>>(
      collection: RecordCollection<T>,
      records: T[],
    ) => {
      const existingIds = new Set((await collection.find().toArray()).map(record => String(record.id ?? record.name ?? record.date ?? record.ticketId ?? record.token)));
      for (const record of records) {
        const key = String(record.id ?? record.name ?? record.date ?? record.ticketId ?? record.token);
        if (!existingIds.has(key)) await collection.insertOne(record);
      }
    };

    const initialAnalytics: AnalyticsRecord[] = [{
      date: new Date().toISOString().split('T')[0],
      metrics: { activeUsers: 31, newUsers: 30, messagesSent: 12, avgResponseTime: 45, errorRate: 0 },
      pageViews: { home: 34, marketplace: 22, messages: 18, jobs: 12, services: 9 },
      userActions: { login: 6, view_listing: 28, send_message: 8 },
    }];

    await Promise.all([
      seedMissingRecords(users, SEED_USERS),
      seedMissingRecords(listings, SEED_LISTINGS),
      seedMissingRecords(businesses, BUSINESSES_DATA),
      seedMissingRecords(groups, SEED_GROUPS),
      seedMissingRecords(groupMessages, SEED_GROUP_MESSAGES),
      seedMissingRecords(stories, SEED_STORIES),
      seedMissingRecords(featureFlags, [
        { name: 'instant_chat', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
        { name: 'reels_feed', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
      ]),
      seedMissingRecords(supportTickets, [{
        ticketId: 'tck_101',
        userId: 'u_jordan',
        subject: 'Feature Suggestion: Category Filter Tags',
        description: 'Would love to filter marketplace listings by multiple tags.',
        priority: 'low',
        category: 'feature_request',
        status: 'open',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
      }]),
      seedMissingRecords(analytics, initialAnalytics),
    ]);

    databaseProvider = 'supabase';
    onDatabaseChange = null;
    console.log('Connected to Supabase Postgres');
    return;
  }

  databaseProvider = 'local';
  console.warn('Supabase is not configured. Using the local development data store; authentication and persistence require Supabase.');
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
  listings = new InMemoryCollection<Listing>(initialDump?.listings || SEED_LISTINGS);
  businesses = new InMemoryCollection<Business>(initialDump?.businesses || BUSINESSES_DATA);
  jobApplications = new InMemoryCollection<JobApplication>(initialDump?.jobApplications || []);
  messages = new InMemoryCollection<Message>(initialDump?.messages || []);
  groups = new InMemoryCollection<Group>(initialDump?.groups || SEED_GROUPS);
  groupMessages = new InMemoryCollection<GroupMessage>(initialDump?.groupMessages || SEED_GROUP_MESSAGES);
  adminLogs = new InMemoryCollection<AdminLog>(initialDump?.adminLogs || []);
  featureFlags = new InMemoryCollection<FeatureFlag>(initialDump?.featureFlags || [
    { name: 'instant_chat', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
    { name: 'reels_feed', enabled: true, scope: 'global', lastModified: new Date(), modifiedBy: 'u_admin' },
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
  ]);
  analytics = new InMemoryCollection<AnalyticsRecord>(initialDump?.analytics || [
    {
      date: new Date().toISOString().split('T')[0],
      metrics: { activeUsers: 31, newUsers: 30, messagesSent: 12, avgResponseTime: 45, errorRate: 0 },
      pageViews: { home: 34, marketplace: 22, messages: 18, jobs: 12, services: 9 },
      userActions: { login: 6, view_listing: 28, send_message: 8 },
    },
  ]);
  verificationRequests = new InMemoryCollection<VerificationRequest>(initialDump?.verificationRequests || []);

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

function safeUser(u: User) {
  const safe = { ...u } as User & { passwordHash?: string };
  delete safe.passwordHash;
  return safe;
}

async function getOrCreateAuthProfile(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<User> {
  const email = authUser.email?.trim().toLowerCase();
  const profileById = await users.findOne({ id: authUser.id });
  const profileByEmail = email
    ? (await users.find().toArray()).find(
      user => user.email?.trim().toLowerCase() === email,
    ) ?? null
    : null;

  if (profileById) {
    if (profileByEmail && profileByEmail.id !== authUser.id) {
      const linkedProfile: User = {
        ...profileByEmail,
        ...profileById,
        id: authUser.id,
        email: email ?? profileById.email,
        name: profileByEmail.name || profileById.name,
        role: profileByEmail.role === 'admin' ? 'admin' : profileById.role,
        ...(profileByEmail.role === 'admin' ? {
          staffRole: profileByEmail.staffRole ?? 'superadmin',
          staffTitle: profileByEmail.staffTitle,
        } : {}),
      };
      const { id: _id, ...profileFields } = linkedProfile;
      await users.updateOne({ id: authUser.id }, { $set: profileFields });
      await users.deleteOne({ id: profileByEmail.id });
      return linkedProfile;
    }
    return profileById;
  }

  if (profileByEmail) {
    const linkedProfile = { ...profileByEmail, id: authUser.id, email: email ?? profileByEmail.email };
    if (databaseProvider === 'supabase') {
      await users.insertOne(linkedProfile);
      await users.deleteOne({ id: profileByEmail.id });
    } else {
      await users.updateOne({ id: profileByEmail.id }, { $set: { id: authUser.id, email } });
    }
    return linkedProfile;
  }

  const metadataName = authUser.user_metadata?.name;
  const createdProfile: User = {
    id: authUser.id,
    email,
    name: typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim()
      : email?.split('@')[0] ?? 'Buzzer user',
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  await users.insertOne(createdProfile);
  return createdProfile;
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

async function authenticateRequest(req: any, res: any): Promise<boolean> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }
  if (!supabaseAdmin) {
    res.status(503).json({ message: 'Supabase Auth is not configured on the server' });
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(header.slice('Bearer '.length));
    if (error || !data.user) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return false;
    }

    req.user = {
      userId: data.user.id,
      identifier: data.user.email ?? '',
    };
    req.authUser = data.user;
    return true;
  } catch (error) {
    console.error('Supabase token verification failed:', error);
    res.status(503).json({ message: 'Unable to verify the Supabase session' });
    return false;
  }
}

async function authMiddleware(req: any, res: any, next: any) {
  if (await authenticateRequest(req, res)) next();
}

async function adminMiddleware(req: any, res: any, next: any) {
  if (!(await authenticateRequest(req, res))) return;
  try {
    const user = await users.findOne({ id: req.user.userId });
    const staffRole = user?.role === 'admin'
      ? user.staffRole ?? 'superadmin'
      : user?.role === 'moderator' ? 'moderator' : undefined;
    const validRoles: AdminStaffRole[] = ['superadmin', 'operations', 'moderator', 'support'];
    if (!user || !staffRole || !validRoles.includes(staffRole)) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.staffRole = staffRole;
    next();
  } catch (error) {
    console.error('Admin authorization lookup failed:', error);
    res.status(500).json({ message: 'Unable to verify admin access' });
  }
}

type AdminStaffRole = 'superadmin' | 'operations' | 'moderator' | 'support';
type AdminPermission =
  | 'overview:read' | 'users:read' | 'users:write' | 'users:ban' | 'users:pii'
  | 'listings:review' | 'listings:delete' | 'verification:review' | 'ads:manage'
  | 'ads:pricing' | 'support:reply' | 'support:escalate' | 'system:flags'
  | 'system:audit_logs' | 'system:export' | 'messaging:audit';

const STAFF_PERMISSIONS: Record<AdminStaffRole, ReadonlySet<AdminPermission>> = {
  superadmin: new Set(['overview:read', 'users:read', 'users:write', 'users:ban', 'users:pii', 'listings:review', 'listings:delete', 'verification:review', 'ads:manage', 'ads:pricing', 'support:reply', 'support:escalate', 'system:flags', 'system:audit_logs', 'system:export', 'messaging:audit']),
  operations: new Set(['overview:read', 'users:read', 'ads:manage', 'ads:pricing', 'system:export']),
  moderator: new Set(['overview:read', 'users:read', 'users:ban', 'listings:review', 'listings:delete', 'verification:review']),
  support: new Set(['overview:read', 'users:read', 'support:reply', 'support:escalate']),
} as const;

function requirePermission(permission: AdminPermission) {
  return (req: any, res: any, next: any) => {
    const role = req.staffRole as AdminStaffRole | undefined;
    if (!role || !STAFF_PERMISSIONS[role].has(permission)) {
      return res.status(403).json({ message: `Permission required: ${permission}` });
    }
    next();
  };
}

async function isFeatureEnabled(name: string) {
  const flag = await featureFlags.findOne({ name });
  return flag?.enabled !== false;
}

function requireFeature(name: string) {
  return async (_req: any, res: any, next: any) => {
    try {
      if (!(await isFeatureEnabled(name))) {
        return res.status(403).json({ success: false, message: `The ${name} feature is currently disabled` });
      }
      next();
    } catch (error) {
      console.error(`Feature flag lookup failed for ${name}:`, error);
      res.status(500).json({ success: false, message: 'Could not verify feature availability' });
    }
  };
}

// ── Auth API Routes ───────────────────────────────────────────

app.get('/api/auth/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await getOrCreateAuthProfile(req.authUser);
    res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    console.error('Authenticated user profile lookup failed:', error);
    res.status(500).json({ message: 'Could not load the authenticated user profile' });
  }
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
  const sectionFeature: Record<string, string> = {
    marketplace: 'marketplace',
    job: 'job_posting',
    service: 'business_features',
    'real-estate': 'real_estate',
    transport: 'taxi_service',
    event: 'event_creation',
  };
  if (!(await isFeatureEnabled(sectionFeature[section]))) {
    return res.status(403).json({ success: false, message: `New ${section} listings are currently disabled` });
  }
  const moderationEnabled = await isFeatureEnabled('content_moderation');
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
    status: moderationEnabled ? 'pending_review' : 'active',
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
  const moderationEnabled = await isFeatureEnabled('content_moderation');
  const updatedStatus = moderationEnabled && ['active', 'flagged', 'rejected'].includes(listing.status)
    ? 'pending_review'
    : listing.status;
  await listings.updateOne({ id }, { $set: { data: updatedData, status: updatedStatus } });
  res.json({
    success: true,
    listing: {
      ...listing,
      data: updatedData,
      status: updatedStatus,
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
  const isAwaitingReview = ['pending_review', 'flagged', 'rejected'].includes(listing.status);
  const canPublishWithoutReview = isAwaitingReview && status === 'active' &&
    !(await isFeatureEnabled('content_moderation'));
  if (isAwaitingReview && !canPublishWithoutReview) {
    return res.status(409).json({ message: 'This listing must be approved by moderation before it can be published or changed' });
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

app.get('/api/messages/:chatId', authMiddleware, async (req: any, res) => {
  try {
    const { chatId } = req.params;
    const msgs = await messages.find({ chatId }).sort({ timestamp: 1 }).toArray();
    res.json({ success: true, messages: msgs });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/messages', authMiddleware, requireFeature('messaging'), async (req: any, res) => {
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

app.post('/api/groups/:id/messages', authMiddleware, requireFeature('group_creation'), async (req: any, res) => {
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
    const staffRole = user?.role === 'admin'
      ? user.staffRole ?? 'superadmin'
      : user?.role === 'moderator' ? 'moderator' : undefined;
    const validRoles: AdminStaffRole[] = ['superadmin', 'operations', 'moderator', 'support'];
    const mayReadAllTickets = !!staffRole && validRoles.includes(staffRole) &&
      STAFF_PERMISSIONS[staffRole].has('support:reply');
    const query = mayReadAllTickets ? {} : { userId: req.user.userId };
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

app.patch('/api/support/tickets/:id', adminMiddleware, requirePermission('support:reply'), async (req: any, res) => {
  try {
    const ticket = await supportTickets.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Support ticket not found' });

    const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid support ticket status' });
      }
      updates.status = req.body.status;
    }
    if (req.body.assignedTo !== undefined) {
      if (typeof req.body.assignedTo !== 'string') {
        return res.status(400).json({ success: false, message: 'Assigned staff ID must be a string' });
      }
      updates.assignedTo = req.body.assignedTo;
    }
    if (req.body.resolution !== undefined) {
      if (typeof req.body.resolution !== 'string') {
        return res.status(400).json({ success: false, message: 'Resolution must be text' });
      }
      updates.resolution = req.body.resolution.slice(0, 4000);
    }
    if (req.body.userWarned !== undefined) {
      if (typeof req.body.userWarned !== 'boolean') {
        return res.status(400).json({ success: false, message: 'userWarned must be a boolean' });
      }
      updates.userWarned = req.body.userWarned;
    }
    if (Object.keys(updates).length === 1) {
      return res.status(400).json({ success: false, message: 'No support ticket updates provided' });
    }

    await supportTickets.updateOne({ ticketId: req.params.id }, { $set: updates });
    await adminLogs.insertOne({
      id: uid(),
      action: 'update_support_ticket',
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { ticketId: req.params.id, updates },
    });
    res.json({ success: true, ticket: { ...ticket, ...updates } });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/support/tickets/:id/responses', adminMiddleware, requirePermission('support:reply'), async (req: any, res) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 4000) {
      return res.status(400).json({ success: false, message: 'A response of 1 to 4000 characters is required' });
    }
    const ticket = await supportTickets.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ success: false, message: 'Support ticket not found' });

    const response = {
      responseId: uid(),
      responderId: req.user.userId,
      message,
      createdAt: new Date(),
      isAdminResponse: true,
    };
    await supportTickets.updateOne(
      { ticketId: req.params.id },
      { $set: { responses: [...(ticket.responses ?? []), response], updatedAt: new Date() } },
    );
    await adminLogs.insertOne({
      id: uid(),
      action: 'reply_support_ticket',
      performedBy: req.user.userId,
      timestamp: new Date(),
      details: { ticketId: req.params.id, responseId: response.responseId },
    });
    res.status(201).json({ success: true, response });
  } catch (error) {
    console.error('Support ticket reply failed:', error);
    res.status(500).json({ success: false, message: 'Could not send support response' });
  }
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

app.post('/api/businesses', authMiddleware, requireFeature('business_features'), async (req: any, res) => {
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
    const user = await users.findOne({ id: req.user.userId });
    const staffRole = user?.role === 'admin'
      ? user.staffRole ?? 'superadmin'
      : user?.role === 'moderator' ? 'moderator' : undefined;
    const validRoles: AdminStaffRole[] = ['superadmin', 'operations', 'moderator', 'support'];
    const mayManageAds = !!staffRole && validRoles.includes(staffRole) &&
      STAFF_PERMISSIONS[staffRole].has('ads:manage');
    if (biz.ownerId !== req.user.userId && !mayManageAds) {
      return res.status(403).json({ success: false, message: 'Only the business owner or authorized operations staff may change sponsorship' });
    }
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

app.get('/api/admin/crm/overview', adminMiddleware, requirePermission('overview:read'), async (_req, res) => {
  try {
    const [totalUsers, activeListings, pendingModeration, pendingVerifications, openTickets, sponsoredBusinesses, totalAuditLogs] = await Promise.all([
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
      kpis: { totalUsers, activeListings, pendingModeration, pendingVerifications, openTickets, sponsoredBusinesses, totalAuditLogs, uptime: 'Available', engine: 'Supabase Postgres' },
    });
  } catch (error) {
    console.error('CRM overview lookup failed:', error);
    res.status(500).json({ success: false, message: 'Could not load CRM overview' });
  }
});

app.get('/api/admin/search', adminMiddleware, requirePermission('users:read'), async (req: any, res) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80).toLocaleLowerCase() : '';
    if (query.length < 2) return res.json({ success: true, results: [] });
    const [allUsers, allListings, allBusinesses, allTickets] = await Promise.all([
      users.find().toArray(), listings.find().toArray(), businesses.find().toArray(), supportTickets.find().toArray(),
    ]);
    const includes = (value: unknown) => typeof value === 'string' && value.toLocaleLowerCase().includes(query);
    const maskEmail = (email?: string) => email?.replace(/^(.).+(@.*)$/, '$1••••$2');
    const results = [
      ...allUsers.filter(user => includes(user.name) || includes(user.email) || includes(user.id)).slice(0, 8)
        .map(user => ({ type: 'user', id: user.id, label: user.name, detail: maskEmail(user.email), href: `/admin?tab=users&user=${encodeURIComponent(user.id)}` })),
      ...allListings.filter(listing => includes(listing.id) || includes(listing.section) || includes(listing.data?.title) || includes(listing.data?.name)).slice(0, 8)
        .map(listing => ({ type: 'listing', id: listing.id, label: listing.data?.title || listing.data?.name || 'Untitled listing', detail: listing.section, href: '/admin?tab=moderation' })),
      ...allBusinesses.filter(business => includes(business.name) || includes(business.category) || includes(business.id)).slice(0, 8)
        .map(business => ({ type: 'business', id: business.id, label: business.name, detail: business.category, href: '/admin?tab=merchants' })),
      ...allTickets.filter(ticket => includes(ticket.ticketId) || includes(ticket.subject) || includes(ticket.category)).slice(0, 8)
        .map(ticket => ({ type: 'ticket', id: ticket.ticketId, label: ticket.subject, detail: ticket.status, href: '/admin?tab=support' })),
    ].slice(0, 32);
    res.json({ success: true, results });
  } catch (error) {
    console.error('CRM search failed:', error);
    res.status(500).json({ success: false, message: 'Could not search CRM records' });
  }
});

app.get('/api/admin/crm/merchants', adminMiddleware, requirePermission('ads:manage'), async (_req, res) => {
  try {
    const merchants = await businesses.find().toArray();
    res.json({
      success: true,
      merchants: merchants.map(business => ({
        ...business,
        impressions: null,
        clicks: null,
        ctr: null,
        leadsGenerated: null,
        tier: business.isSponsored ? 'Premium Partner' : 'Standard Merchant',
      })),
    });
  } catch (error) {
    console.error('CRM merchant lookup failed:', error);
    res.status(500).json({ success: false, message: 'Could not load business partners' });
  }
});

app.get('/api/admin/moderation/queue', adminMiddleware, requirePermission('listings:review'), async (req: any, res) => {
  try {
    const requestedStatus = typeof req.query.status === 'string' ? req.query.status : 'all';
    const allowedStatuses: Record<string, string[]> = {
      pending: ['pending_review'],
      flagged: ['flagged'],
      reviewed: ['active', 'rejected'],
      all: ['pending_review', 'flagged'],
    };
    const statuses = allowedStatuses[requestedStatus];
    if (!statuses) return res.status(400).json({ success: false, message: 'Invalid moderation status filter' });
    const queueItems = await listings.find({ status: { $in: statuses } }).sort({ createdAt: -1 }).toArray();
    const ownerIds = [...new Set(queueItems.map(listing => listing.userId))];
    const owners = await users.find({ id: { $in: ownerIds } }, {
      projection: { id: 1, name: 1, profileImageUrl: 1 },
    }).toArray();
    const ownerMap = new Map(owners.map(owner => [owner.id, owner]));
    const restrictions = await userRestrictions.find({ status: 'active' }).toArray();
    const restrictionCounts = new Map<string, number>();
    for (const restriction of restrictions) {
      const expiration = restriction.endDate ?? restriction.expiresAt;
      if (expiration && new Date(expiration).getTime() <= Date.now()) continue;
      restrictionCounts.set(restriction.userId, (restrictionCounts.get(restriction.userId) ?? 0) + 1);
    }
    const items = queueItems.map(listing => ({
      ...listing,
      seller: ownerMap.get(listing.userId)?.name ?? 'Community member',
      sellerAvatar: ownerMap.get(listing.userId)?.profileImageUrl,
      activeRestrictionCount: restrictionCounts.get(listing.userId) ?? 0,
      riskScore: listing.riskScore ?? null,
      riskFlags: listing.riskFlags ?? [],
      riskSummary: listing.riskSummary ?? 'No automated risk assessment recorded',
    }));
    res.json({ success: true, items, total: items.length });
  } catch (error) {
    console.error('Moderation queue lookup failed:', error);
    res.status(500).json({ success: false, message: 'Could not load moderation queue' });
  }
});

app.post('/api/admin/moderation/decide', adminMiddleware, requirePermission('listings:review'), async (req: any, res) => {
  try {
    const { listingId, decision, reason } = req.body;
    if (typeof listingId !== 'string' || !['approve', 'reject', 'flag', 'escalate'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Provide a listing and valid moderation decision' });
    }
    const listing = await listings.findOne({ id: listingId });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (!['pending_review', 'flagged'].includes(listing.status)) {
      return res.status(409).json({ success: false, message: 'Listing is no longer awaiting moderation' });
    }
    const status = decision === 'approve' ? 'active' : decision === 'reject' ? 'rejected' : 'flagged';
    await listings.updateOne({ id: listingId }, { $set: {
      status,
      moderatedBy: req.user.userId,
      moderatedAt: new Date().toISOString(),
      moderationReason: typeof reason === 'string' ? reason.slice(0, 500) : 'Moderation decision recorded',
    } });
    await adminLogs.insertOne({
      id: uid(), action: `listing_${decision}`, performedBy: req.user.userId, timestamp: new Date(),
      details: { listingId, decision, reason: typeof reason === 'string' ? reason.slice(0, 500) : '' },
    });
    res.json({ success: true, status, message: `Listing marked as ${status}` });
  } catch (error) {
    console.error('Moderation decision failed:', error);
    res.status(500).json({ success: false, message: 'Could not record moderation decision' });
  }
});

app.post('/api/admin/moderation/bulk-decide', adminMiddleware, requirePermission('listings:review'), async (req: any, res) => {
  try {
    const { listingIds, decision, reason } = req.body;
    if (!Array.isArray(listingIds) || listingIds.length === 0 || listingIds.length > 100 ||
        listingIds.some((id: unknown) => typeof id !== 'string') || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Provide 1 to 100 listing IDs and an approve/reject decision' });
    }
    const modifiedIds: string[] = [];
    const failedIds: string[] = [];
    const status = decision === 'approve' ? 'active' : 'rejected';
    for (const id of [...new Set(listingIds as string[])]) {
      const listing = await listings.findOne({ id });
      if (!listing || !['pending_review', 'flagged'].includes(listing.status)) {
        failedIds.push(id);
        continue;
      }
      await listings.updateOne({ id }, { $set: {
        status,
        moderatedBy: req.user.userId,
        moderatedAt: new Date().toISOString(),
        moderationReason: typeof reason === 'string' ? reason.slice(0, 500) : 'Bulk moderation decision',
      } });
      modifiedIds.push(id);
    }
    await adminLogs.insertOne({
      id: uid(), action: `bulk_listing_${decision}`, performedBy: req.user.userId, timestamp: new Date(),
      details: { modifiedIds, failedIds },
    });
    res.json({ success: true, modifiedIds, failedIds, message: `Processed ${modifiedIds.length} listings; ${failedIds.length} were skipped` });
  } catch (error) {
    console.error('Bulk moderation decision failed:', error);
    res.status(500).json({ success: false, message: 'Could not process moderation decisions' });
  }
});

app.get('/api/admin/verifications', adminMiddleware, requirePermission('verification:review'), async (_req, res) => {
  try {
    const requests = await verificationRequests.find().sort({ submittedAt: -1 }).toArray();
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Verification queue lookup failed:', error);
    res.status(500).json({ success: false, message: 'Could not load verification requests' });
  }
});

app.post('/api/admin/verifications/decide', adminMiddleware, requirePermission('verification:review'), async (req: any, res) => {
  try {
    const { requestId, decision, notes } = req.body;
    if (typeof requestId !== 'string' || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Provide a verification request and valid decision' });
    }
    const request = await verificationRequests.findOne({ id: requestId });
    if (!request) return res.status(404).json({ success: false, message: 'Verification request not found' });
    if (request.status !== 'pending') return res.status(409).json({ success: false, message: 'Request has already been reviewed' });
    await verificationRequests.updateOne({ id: requestId }, { $set: {
      status: decision,
      reviewedBy: req.user.userId,
      reviewedAt: new Date().toISOString(),
      reviewNotes: typeof notes === 'string' ? notes.slice(0, 1000) : '',
    } });
    if (decision === 'approved') {
      await users.updateOne({ id: request.userId }, { $set: { verified: true, verifiedBadge: request.badgeTitle } });
      for (const listing of await listings.find({ userId: request.userId }).toArray()) {
        await listings.updateOne({ id: listing.id }, { $set: { 'data.verified': true } });
      }
    }
    await adminLogs.insertOne({
      id: uid(), action: `verification_${decision}`, performedBy: req.user.userId, timestamp: new Date(),
      details: { requestId, userId: request.userId, vertical: request.vertical, decision },
    });
    res.json({ success: true, message: `Verification request ${decision}` });
  } catch (error) {
    console.error('Verification decision failed:', error);
    res.status(500).json({ success: false, message: 'Could not record verification decision' });
  }
});

app.get('/api/admin/users/:id/timeline', adminMiddleware, requirePermission('users:read'), async (req: any, res) => {
  try {
    const target = await users.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    const [userListings, restrictions, tickets, verifications, logs] = await Promise.all([
      listings.find({ userId: req.params.id }).toArray(),
      userRestrictions.find({ userId: req.params.id }).toArray(),
      supportTickets.find({ userId: req.params.id }).toArray(),
      verificationRequests.find({ userId: req.params.id }).toArray(),
      adminLogs.find().sort({ timestamp: -1 }).limit(2000).toArray(),
    ]);
    const timeline = [
      ...userListings.map(listing => ({ id: `listing-${listing.id}`, type: 'listing', timestamp: listing.createdAt, summary: `Listing created: ${listing.data?.title || listing.data?.name || listing.section}`, status: listing.status })),
      ...restrictions.map(restriction => ({ id: `restriction-${restriction.id}`, type: 'restriction', timestamp: restriction.createdAt, summary: `${restriction.type} restriction: ${restriction.reason}`, status: restriction.status })),
      ...tickets.map(ticket => ({ id: `ticket-${ticket.ticketId}`, type: 'support', timestamp: ticket.createdAt, summary: `Support ticket: ${ticket.subject}`, status: ticket.status })),
      ...verifications.map(request => ({ id: `verification-${request.id}`, type: 'verification', timestamp: request.submittedAt, summary: `Verification submitted: ${request.badgeTitle}`, status: request.status })),
      ...logs.filter(log => log.details?.userId === req.params.id || log.details?.targetUserId === req.params.id)
        .map(log => ({ id: `audit-${log.id}`, type: 'staff action', timestamp: log.timestamp, summary: log.action, status: 'recorded' })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 200);
    res.json({
      success: true,
      account: { id: target.id, name: target.name, email: target.email?.replace(/^(.).+(@.*)$/, '$1••••$2'), role: target.staffRole ?? target.role, createdAt: target.createdAt },
      timeline,
    });
  } catch (error) {
    console.error('User CRM timeline lookup failed:', error);
    res.status(500).json({ success: false, message: 'Could not load user activity' });
  }
});

app.get('/api/admin/activity', adminMiddleware, requirePermission('system:audit_logs'), async (req: any, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit as string, 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 200;
    const requestedUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const logs = await adminLogs.find().sort({ timestamp: -1 }).limit(limit).toArray();
    const activities = logs
      .filter(log => !requestedUserId ||
        log.details?.targetUserId === requestedUserId ||
        log.details?.userId === requestedUserId ||
        log.performedBy === requestedUserId)
      .map(log => ({
        userId: log.details?.targetUserId ?? log.details?.userId ?? log.performedBy,
        action: log.action,
        timestamp: log.timestamp,
        details: log.details ?? {},
      }));
    res.json({ success: true, activities });
  } catch (error) {
    console.error('Admin activity lookup failed:', error);
    res.status(500).json({ success: false, message: 'Could not load admin activity' });
  }
});

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

app.get('/api/admin/groups', adminMiddleware, requirePermission('overview:read'), async (_req, res) => {
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

app.get('/api/admin/db-stats', adminMiddleware, requirePermission('overview:read'), async (_req, res) => {
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
    const mayViewPii = STAFF_PERMISSIONS[req.staffRole as AdminStaffRole].has('users:pii');
    res.json({ success: true, data: allUsers.map(user => {
      const safe = safeUser(user);
      if (mayViewPii) return safe;
      const { email: _email, phoneNumber: _phoneNumber, ...masked } = safe;
      return { ...masked, email: user.email ? `${user.email.slice(0, 1)}***@${user.email.split('@')[1] ?? ''}` : undefined, phoneNumber: user.phoneNumber ? '••••••' : undefined };
    }) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/admin/users/:id/role', adminMiddleware, requirePermission('users:write'), async (req: any, res) => {
  try {
    const target = await users.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.id === req.user.userId) return res.status(400).json({ message: 'You cannot change your own access level' });

    const { role, staffRole } = req.body;
    const validStaffRoles: AdminStaffRole[] = ['superadmin', 'operations', 'moderator', 'support'];
    if (role === 'user') {
      if (target.staffRole === 'superadmin' || (target.role === 'admin' && !target.staffRole)) {
        return res.status(400).json({ message: 'Superadmin access cannot be removed through this action' });
      }
      await users.updateOne({ id: target.id }, { $set: { role: 'user' }, $unset: { staffRole: '' } });
    } else {
      const nextStaffRole = staffRole ?? (validStaffRoles.includes(role) ? role : undefined);
      if (!nextStaffRole || !validStaffRoles.includes(nextStaffRole)) return res.status(400).json({ message: 'Invalid staff role' });
      if (target.staffRole === 'superadmin' && req.staffRole !== 'superadmin') {
        return res.status(403).json({ message: 'Only a superadmin can change superadmin access' });
      }
      await users.updateOne({ id: target.id }, { $set: { role: 'admin', staffRole: nextStaffRole } });
    }
    await adminLogs.insertOne({ id: uid(), action: 'update_user_role', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id, role, staffRole: staffRole ?? null } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/admin/users/:id', adminMiddleware, requirePermission('users:write'), async (req: any, res) => {
  try {
    const target = await users.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.id === req.user.userId) return res.status(400).json({ message: 'You cannot delete your own account' });
    if (target.staffRole === 'superadmin' || (target.role === 'admin' && !target.staffRole)) {
      return res.status(400).json({ message: 'Superadmin accounts cannot be deleted through this action' });
    }
    if (databaseProvider === 'supabase') {
      if (!supabaseAdmin) return res.status(503).json({ message: 'Supabase admin client is unavailable' });
      const { error } = await supabaseAdmin.auth.admin.deleteUser(target.id);
      if (error) {
        console.error('Supabase auth user deletion failed:', error);
        return res.status(502).json({ message: 'Could not delete the user authentication account' });
      }
    }
    await users.deleteOne({ id: target.id });
    await adminLogs.insertOne({ id: uid(), action: 'delete_user', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/users/:id/restrict', adminMiddleware, requirePermission('users:ban'), async (req: any, res) => {
  try {
    const { type, reason, endDate } = req.body;
    if (!['ban', 'suspend', 'restrict'].includes(type) || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({ message: 'Provide a valid restriction type and a reason of at least 10 characters' });
    }
    const target = await users.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ message: 'User not found' });
    let expiration: Date | undefined;
    if (type !== 'ban') {
      expiration = new Date(endDate);
      if (!endDate || Number.isNaN(expiration.getTime()) || expiration <= new Date()) {
        return res.status(400).json({ message: 'A future end date is required for temporary restrictions' });
      }
    }
    const restriction: UserRestriction = {
      id: uid(),
      userId: target.id,
      type,
      reason: reason.trim().slice(0, 1000),
      status: 'active',
      createdBy: req.user.userId,
      createdAt: new Date(),
      startDate: new Date(),
      ...(expiration ? { endDate: expiration, expiresAt: expiration } : {}),
    };
    await userRestrictions.insertOne(restriction);
    await adminLogs.insertOne({ id: uid(), action: 'restrict_user', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: req.params.id, restriction } });
    res.json({ success: true, restriction });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/users/:id/restrictions', adminMiddleware, requirePermission('users:ban'), async (req: any, res) => {
  try {
    const restrictions = await userRestrictions.find({ userId: req.params.id }).toArray();
    const presentRestrictions = restrictions.map(restriction => {
      const endDate = restriction.endDate ?? restriction.expiresAt;
      const isExpired = restriction.status === 'active' && endDate && new Date(endDate).getTime() <= Date.now();
      return { ...restriction, endDate, status: isExpired ? 'expired' : restriction.status };
    });
    res.json({ success: true, restrictions: presentRestrictions });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/restrictions', adminMiddleware, requirePermission('users:ban'), async (_req: any, res) => {
  try {
    const restrictions = await userRestrictions.find().sort({ createdAt: -1 }).toArray();
    const userIds = [...new Set(restrictions.map(restriction => restriction.userId))];
    const restrictedUsers = await users.find({ id: { $in: userIds } }, { projection: { id: 1, name: 1 } }).toArray();
    const names = new Map(restrictedUsers.map(user => [user.id, user.name]));
    res.json({ success: true, restrictions: restrictions.map(restriction => {
      const endDate = restriction.endDate ?? restriction.expiresAt;
      const isExpired = restriction.status === 'active' && endDate && new Date(endDate).getTime() <= Date.now();
      return { ...restriction, endDate, status: isExpired ? 'expired' : restriction.status, userName: names.get(restriction.userId) ?? 'Deleted user' };
    }) });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/admin/restrictions/:id/lift', adminMiddleware, requirePermission('users:ban'), async (req: any, res) => {
  try {
    const restriction = await userRestrictions.findOne({ id: req.params.id });
    if (!restriction) return res.status(404).json({ message: 'Restriction not found' });
    await userRestrictions.updateOne({ id: req.params.id }, { $set: { status: 'lifted', liftedAt: new Date(), liftedBy: req.user.userId } });
    await adminLogs.insertOne({ id: uid(), action: 'lift_restriction', performedBy: req.user.userId, timestamp: new Date(), details: { restrictionId: req.params.id, userId: restriction.userId } });
    res.json({ success: true });
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
    const { action, details } = req.body;
    const log: AdminLog = { id: uid(), action, performedBy: req.user.userId, timestamp: new Date(), details: details || {} };
    await adminLogs.insertOne(log);
    res.json({ success: true, log });
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
    const { enabled, scope, targetUsers } = req.body;
    if (!name || typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Feature name and boolean enabled value are required' });
    }
    if (scope !== undefined && !['global', 'user'].includes(scope)) {
      return res.status(400).json({ success: false, message: 'Feature scope must be global or user' });
    }
    if (targetUsers !== undefined && (!Array.isArray(targetUsers) || targetUsers.some((id: unknown) => typeof id !== 'string'))) {
      return res.status(400).json({ success: false, message: 'targetUsers must be an array of user IDs' });
    }
    await featureFlags.updateOne(
      { name },
      { $set: { name, enabled, scope: scope || 'global', targetUsers: targetUsers || [], lastModified: new Date(), modifiedBy: req.user.userId } },
      { upsert: true }
    );
    await adminLogs.insertOne({ id: uid(), action: 'toggle_feature', performedBy: req.user.userId, timestamp: new Date(), details: { name, enabled } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
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

app.post('/api/admin/users/add-admin', adminMiddleware, requirePermission('users:write'), async (req: any, res) => {
  try {
    const { email, staffRole = 'operations' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const target = await users.findOne({ email: email.toLowerCase() });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (!['superadmin', 'operations', 'moderator', 'support'].includes(staffRole)) return res.status(400).json({ message: 'Invalid staff role' });
    if (staffRole === 'superadmin' && req.staffRole !== 'superadmin') return res.status(403).json({ message: 'Only a superadmin can grant superadmin access' });
    await users.updateOne({ id: target.id }, { $set: { role: 'admin', staffRole } });
    await adminLogs.insertOne({ id: uid(), action: 'grant_staff_access', performedBy: req.user.userId, timestamp: new Date(), details: { targetUserId: target.id, staffRole } });
    res.json({ success: true, message: `${email} is now ${staffRole}` });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ── Analytics ─────────────────────────────────────────────────

app.get('/api/admin/analytics', adminMiddleware, requirePermission('overview:read'), async (req: any, res) => {
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
  res.json({
    status: 'ok',
    database: databaseProvider === 'supabase' ? 'supabase' : 'local-development',
    auth: supabaseAdmin ? 'supabase' : 'unconfigured',
  });
});

app.get('/api/database/status', async (_req, res) => {
  try {
    const userCount = await users.countDocuments();
    const listingCount = await listings.countDocuments();
    const allUsers = await users.find({}).toArray();
    res.json({
      success: true,
      database: {
        status: databaseProvider === 'supabase' ? 'online' : 'local-development',
        storage: databaseProvider === 'supabase' ? 'Supabase Postgres' : 'Local JSON development store',
        ...(databaseProvider === 'local' ? { filePath: 'data/buzzer_database.json' } : {}),
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

const PORT = Number(process.env.PORT) || 3000;

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
