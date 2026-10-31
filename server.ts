import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lead, DripConfig, LandingPageSite } from './src/types/lead';
import { AppUser, INITIAL_SEED_USERS } from './src/types/user';
import { INITIAL_SEED_LEADS, INITIAL_SEED_QUEUE } from './src/data/initialLeads';
import { LANDING_PAGE_DOMAINS, getDomainForResort } from './src/data/landingPages';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'leads_db.json');
const USERS_FILE = path.resolve(DATA_DIR, 'users_db.json');
const SRC_USERS_FILE = path.resolve(__dirname, 'src/data/persistentUsers.json');
const MASTER_QUEUE_FILE = path.resolve(DATA_DIR, 'master_queue.json');
const SRC_MASTER_QUEUE_FILE = path.resolve(__dirname, 'src/data/persistentMasterQueue.json');

interface AppDatabase {
  leads: Lead[];
  claimedLeads: Lead[];
  queue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[];
  masterQueue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[];
  currentDripIndex: number;
  landingPages: LandingPageSite[];
  dripConfig: DripConfig;
  droppedCount: number;
  users: AppUser[];
}

// In-memory state
let db: AppDatabase = {
  leads: [],
  claimedLeads: [],
  queue: [],
  masterQueue: [],
  currentDripIndex: 0,
  landingPages: LANDING_PAGE_DOMAINS,
  dripConfig: {
    isEnabled: true,
    intervalSeconds: 8,
    enableJitter: false, // Jitter off by default so drip strictly follows speed settings
    soundEnabled: true,
    soundVolume: 0.7,
    autoClaimNew: false,
    showToasts: true,
  },
  droppedCount: 0,
  users: [...INITIAL_SEED_USERS],
};

// Track cleared/deleted claimed lead IDs so syncing never resurrects them
let deletedClaimedIds = new Set<string>();

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Atomic file writer to prevent corruption during writes.
// Uses compact formatting for large datasets (e.g. 13,000 leads) for high I/O speed.
function safeWriteJson(filePath: string, data: unknown, pretty = false): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFile = `${filePath}.tmp.${Date.now()}`;
    const payload = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    fs.writeFileSync(tempFile, payload, 'utf-8');
    fs.renameSync(tempFile, filePath);
  } catch (err) {
    try {
      const payload = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      fs.writeFileSync(filePath, payload, 'utf-8');
    } catch (fallbackErr) {
      console.error(`[Storage Error] Failed to write ${filePath}:`, fallbackErr);
    }
  }
}

// Helper to extract unique identity key for a lead to strictly prevent duplicates
function getLeadDedupeKey(lead: any): string {
  if (!lead) return '';
  if (lead.id) return `id:${lead.id}`;
  const phone = String(lead.phone || '').replace(/\D/g, '');
  const email = String(lead.email || '').trim().toLowerCase();
  const name = String(lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`).trim().toLowerCase();
  
  return `key:${name}:${phone}:${email}`;
}

// Helper to detect and reject synthetic or automated test leads
function isTestLead(lead: any): boolean {
  if (!lead) return false;
  const name = String(lead.fullName || lead.name || '').trim().toLowerCase();
  const email = String(lead.email || '').trim().toLowerCase();
  const phone = String(lead.phone || '').trim();
  const notes = String(lead.notes || '').trim().toLowerCase();
  return (
    name.includes('excel lead') ||
    name.includes('test lead') ||
    name.includes('owner lead') ||
    name.includes('client lead') ||
    /\(\d+\)$/.test(String(lead.fullName || lead.name || '').trim()) ||
    email.includes('realexitclient.com') ||
    email.includes('testleads.com') ||
    email.includes('timeshare-exit.com') ||
    email.includes('example.com') ||
    phone.includes('(407) 800-') ||
    phone.includes('(555) 777-') ||
    phone.includes('(555) 000-') ||
    notes.includes('imported from timeshare exit spreadsheet row') ||
    notes.includes('spreadsheet row') ||
    notes.includes('test lead') ||
    notes.includes('excel lead')
  );
}

// Helper to deduplicate array of leads
function deduplicateLeads<T>(leads: T[]): T[] {
  if (!Array.isArray(leads)) return [];
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const l of leads) {
    const key = getLeadDedupeKey(l);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(l);
    }
  }
  return unique;
}

// Fisher-Yates array shuffle for uniform random cycling
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

// Helper to read JSON safely
function safeReadJson<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`[Storage Error] Failed to read ${filePath}:`, err);
  }
  return null;
}

// Load users with permanent double-layer disk persistence across server restarts
function loadUsers(): AppUser[] {
  const mergedMap = new Map<string, AppUser>();

  // 1. Load from default seeds
  for (const seed of INITIAL_SEED_USERS) {
    mergedMap.set(seed.username.trim().toLowerCase(), seed);
  }

  // 2. Load from src/data/persistentUsers.json (source persistence)
  const srcUsers = safeReadJson<AppUser[]>(SRC_USERS_FILE);
  if (Array.isArray(srcUsers)) {
    for (const u of srcUsers) {
      if (u && u.username) mergedMap.set(u.username.trim().toLowerCase(), u);
    }
  }

  // 3. Load from data/users_db.json (runtime persistence)
  const dataUsers = safeReadJson<AppUser[]>(USERS_FILE);
  if (Array.isArray(dataUsers)) {
    for (const u of dataUsers) {
      if (u && u.username) mergedMap.set(u.username.trim().toLowerCase(), u);
    }
  }

  // 4. Load from DB_FILE if present
  const dbData = safeReadJson<AppDatabase>(DB_FILE);
  if (dbData && Array.isArray(dbData.users)) {
    for (const u of dbData.users) {
      if (u && u.username) mergedMap.set(u.username.trim().toLowerCase(), u);
    }
  }

  const loadedUsers = Array.from(mergedMap.values());

  // Save back to both disk locations immediately to ensure synchronization
  safeWriteJson(USERS_FILE, loadedUsers);
  safeWriteJson(SRC_USERS_FILE, loadedUsers);

  return loadedUsers;
}

function saveUsers(): void {
  safeWriteJson(USERS_FILE, db.users);
  safeWriteJson(SRC_USERS_FILE, db.users);
}

// Load or initialize DB with continuous master queue retention and thorough deduplication
function loadDb(): void {
  const parsed = safeReadJson<AppDatabase & { deletedClaimedIds?: string[] }>(DB_FILE);

  // Load master queue from dedicated file or parsed db
  let loadedMasterQueue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[] = [];
  const fileMasterQueue = safeReadJson<typeof loadedMasterQueue>(MASTER_QUEUE_FILE);
  const srcMasterQueue = safeReadJson<typeof loadedMasterQueue>(SRC_MASTER_QUEUE_FILE);

  if (Array.isArray(fileMasterQueue) && fileMasterQueue.length > 0) {
    loadedMasterQueue = fileMasterQueue;
  } else if (Array.isArray(srcMasterQueue) && srcMasterQueue.length > 0) {
    loadedMasterQueue = srcMasterQueue;
  } else if (parsed && Array.isArray(parsed.masterQueue) && parsed.masterQueue.length > 0) {
    loadedMasterQueue = parsed.masterQueue;
  } else if (parsed && Array.isArray(parsed.queue) && parsed.queue.length > 0) {
    loadedMasterQueue = [...parsed.queue];
  }

  // Strictly filter out any synthetic test leads from master queue
  loadedMasterQueue = loadedMasterQueue.filter((l) => !isTestLead(l));

  // Sanitize and filter loaded live leads
  let initialLeads: Lead[] = [];
  if (parsed && Array.isArray(parsed.leads) && parsed.leads.length > 0) {
    initialLeads = parsed.leads.filter((l) => l && !isTestLead(l));
  }

  // Load active queue without dropping any records and strictly filtering test leads
  let activeQueue: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[] = [];
  if (parsed && Array.isArray(parsed.queue) && parsed.queue.length > 0) {
    activeQueue = parsed.queue.filter((l) => !isTestLead(l));
  }
  if (activeQueue.length === 0 && loadedMasterQueue.length > 0) {
    activeQueue = [...loadedMasterQueue];
  }

  db = {
    leads: initialLeads,
    claimedLeads:
      parsed && Array.isArray(parsed.claimedLeads)
        ? parsed.claimedLeads
            .filter((l: any) => !isTestLead(l))
            .map((l: any) => ({
              ...l,
              claimedBy:
                typeof l.claimedBy === 'object' && l.claimedBy !== null
                  ? (l.claimedBy.username || l.claimedBy.name || 'Current Closer')
                  : String(l.claimedBy || 'Current Closer'),
            }))
        : [],
    queue: activeQueue,
    masterQueue: loadedMasterQueue,
    currentDripIndex: typeof parsed?.currentDripIndex === 'number' ? parsed.currentDripIndex : 0,
    landingPages:
      parsed && Array.isArray(parsed.landingPages) && parsed.landingPages.length >= LANDING_PAGE_DOMAINS.length
        ? parsed.landingPages
        : LANDING_PAGE_DOMAINS,
    dripConfig: parsed?.dripConfig || db.dripConfig,
    droppedCount: typeof parsed?.droppedCount === 'number' ? parsed.droppedCount : 0,
    users: loadUsers(),
  };

  if (parsed && Array.isArray(parsed.deletedClaimedIds)) {
    deletedClaimedIds = new Set(parsed.deletedClaimedIds.map(String));
  }

  // Ensure queue is populated from masterQueue if empty (in exact order, never shuffled)
  if (db.queue.length === 0 && db.masterQueue.length > 0) {
    db.queue = [...db.masterQueue];
  }

  saveDb();
}

function saveDb(full = false): void {
  try {
    saveUsers();
    if (full || !fs.existsSync(MASTER_QUEUE_FILE)) {
      safeWriteJson(MASTER_QUEUE_FILE, db.masterQueue, false);
      if (db.masterQueue.length > 0) {
        safeWriteJson(SRC_MASTER_QUEUE_FILE, db.masterQueue.slice(0, 500), false);
      }
    }
    safeWriteJson(
      DB_FILE,
      {
        ...db,
        queue: db.queue.slice(0, 500),
        deletedClaimedIds: Array.from(deletedClaimedIds),
      },
      false
    );
  } catch (err) {
    console.error('Error writing db file:', err);
  }
}

// Generate lightweight public state payload (sends next 50 preview leads and real counts)
// This keeps SSE fast, prevents browser socket buffer freezing, and avoids 5MB localStorage quota limits!
function getPublicState() {
  return {
    ...db,
    leads: deduplicateLeads(db.leads),
    queue: db.queue.slice(0, 50),
    queueCount: db.queue.length,
    masterQueueCount: db.masterQueue.length,
  };
}

// SSE Clients for real-time synchronization across all tabs and sessions
const sseClients = new Set<Response>();

function broadcastState(): void {
  const payload = JSON.stringify({ type: 'SYNC', state: getPublicState() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Background Server Drip Engine (runs automatically 24/7 with infinite looping)
let dripTimer: NodeJS.Timeout | null = null;

// Configurable drip interval variable at the top
const DRIP_INTERVAL_SECONDS = 8;
const MAX_FEED_DISPLAY = 500;

function dripWorker(): void {
  if (dripTimer) {
    clearTimeout(dripTimer);
    dripTimer = null;
  }

  if (!db.dripConfig.isEnabled) {
    return;
  }

  // Exact interval in seconds strictly according to speed settings
  const intervalSec = Math.max(1, Math.min(300, Number(db.dripConfig.intervalSeconds) || DRIP_INTERVAL_SECONDS));
  let delayMs = intervalSec * 1000;

  // Only apply natural organic variance if jitter is explicitly enabled by admin
  if (db.dripConfig.enableJitter) {
    const jitterRange = Math.min(3000, delayMs * 0.15);
    const variance = (Math.random() * 2 - 1) * jitterRange;
    delayMs = Math.max(1000, Math.round(delayMs + variance));
  }

  dripTimer = setTimeout(() => {
    tickDripWorker();
    dripWorker();
  }, delayMs);
}

function tickDripWorker(): void {
  // Purge test leads
  db.leads = db.leads.filter((l) => !isTestLead(l));
  db.masterQueue = db.masterQueue.filter((l) => !isTestLead(l));

  if (!db.masterQueue || db.masterQueue.length === 0) {
    if (db.queue && db.queue.length > 0) {
      db.masterQueue = [...db.queue];
    } else {
      return;
    }
  }

  // 3. LIVE FEED CAP LOGIC:
  // Count the number of unclaimed leads in live_feed BEFORE each drip.
  const unclaimedLeads = db.leads.filter((l) => l.status !== 'CLAIMED');
  const claimedLeads = db.leads.filter((l) => l.status === 'CLAIMED');

  // IF unclaimed count >= 500:
  // THEN: CLEAR / DELETE all unclaimed leads from live_feed (set live_feed to empty of unclaimed), but KEEP the drip pointer in master queue. Then CONTINUE dripping.
  if (unclaimedLeads.length >= MAX_FEED_DISPLAY) {
    console.log(`[Drip Worker] Unclaimed lead count (${unclaimedLeads.length}) >= 500. Clearing unclaimed leads from live feed.`);
    db.leads = [...claimedLeads];
  }

  // 2. Take ONE lead at a time from master_leads_queue at currentDripIndex
  if (typeof db.currentDripIndex !== 'number' || db.currentDripIndex < 0 || db.currentDripIndex >= db.masterQueue.length) {
    db.currentDripIndex = 0;
  }

  const rawLead = db.masterQueue[db.currentDripIndex];
  if (!rawLead || isTestLead(rawLead)) {
    db.currentDripIndex = (db.currentDripIndex + 1) % db.masterQueue.length;
    return;
  }

  const newId = `TS-${Math.floor(849000 + Math.random() * 9999)}`;
  const now = new Date();
  const newLead: Lead = {
    ...rawLead,
    id: newId,
    timestamp: now.toISOString(),
    receivedAgo: 'Just now',
    isNewArrival: true,
    sourceDomain: rawLead.sourceDomain || getDomainForResort(rawLead.resortDeveloper),
    status: 'NEW',
  };

  // Add to global live feed (top/front)
  db.leads = [newLead, ...db.leads.map((l) => ({ ...l, isNewArrival: false }))];
  db.droppedCount += 1;

  // Advance waiting queue
  if (db.queue.length > 0) {
    db.queue = db.queue.slice(1);
  }
  if (db.queue.length === 0 && db.masterQueue.length > 0) {
    db.queue = [...db.masterQueue];
  }

  // 4. INFINITE LOOP LOGIC:
  // After you drip the LAST lead, reset currentDripIndex = 0 and start over from the beginning automatically.
  db.currentDripIndex = (db.currentDripIndex + 1) % db.masterQueue.length;

  saveDb(false);
  broadcastState();
}

async function startServer() {
  loadDb();
  dripWorker();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  // 1. Get full centralized state (Called by every new tab/incognito session on load)
  app.get('/api/state', (_req: Request, res: Response) => {
    res.json({
      success: true,
      state: getPublicState(),
    });
  });

  // 2. Server-Sent Events stream for real-time live synchronization
  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot immediately
    res.write(`data: ${JSON.stringify({ type: 'INIT', state: getPublicState() })}\n\n`);

    sseClients.add(res);

    // Heartbeat ping every 15s to keep connection alive
    const pingInterval = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(pingInterval);
        sseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      sseClients.delete(res);
    });
  });

  // General authentication verification endpoint for main site access
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check against authorized users in database
    const matched = db.users.find(
      (u) => u.username.trim().toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (matched) {
      if (matched.status === 'suspended') {
        res.status(403).json({
          success: false,
          message: 'Account suspended. Please contact the administrator.',
        });
        return;
      }
      matched.lastLoginAt = new Date().toISOString();
      broadcastState();
      res.json({
        success: true,
        role: matched.role,
        user: {
          id: matched.id,
          username: matched.username,
          name: matched.name,
          role: matched.role,
        },
      });
      return;
    }

    // Default master admin fallback
    if (cleanUser === 'salesleads777@gmail.com' && cleanPass === 'Mafioso2356$') {
      res.json({
        success: true,
        role: 'admin',
        user: {
          id: 'user-admin-master',
          username: 'salesleads777@gmail.com',
          name: 'Master Administrator',
          role: 'admin',
        },
      });
      return;
    }

    // Default closer fallback
    if (cleanUser === '1clickleads' && cleanPass === '1clickadmin') {
      res.json({
        success: true,
        role: 'buyer',
        user: {
          id: 'user-closer-default',
          username: '1clickleads',
          name: 'Executive Closer',
          role: 'buyer',
        },
      });
      return;
    }

    res.status(401).json({ success: false, message: 'Invalid username or password. Please try again.' });
  });

  // Admin authentication verification endpoint
  app.post('/api/auth/admin', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'Username and password required' });
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const matchedAdmin = db.users.find(
      (u) =>
        u.username.trim().toLowerCase() === cleanUser &&
        u.password === cleanPass &&
        u.role === 'admin' &&
        u.status === 'active'
    );

    if (matchedAdmin || (cleanUser === 'salesleads777@gmail.com' && cleanPass === 'Mafioso2356$')) {
      res.json({ success: true, role: 'admin', user: cleanUser });
    } else {
      res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
  });

  // User Management Endpoints
  // 1. Get all authorized users
  app.get('/api/users', (_req: Request, res: Response) => {
    res.json({ success: true, users: db.users });
  });

  // 2. Add new authorized user
  app.post('/api/users', (req: Request, res: Response) => {
    const { username, password, role = 'buyer', name, notes } = req.body;

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (cleanUser.length < 3) {
      res.status(400).json({ success: false, message: 'Username must be at least 3 characters long' });
      return;
    }

    if (cleanPass.length < 4) {
      res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
      return;
    }

    // Check for duplicate username
    const duplicate = db.users.some(
      (u) => u.username.trim().toLowerCase() === cleanUser.toLowerCase()
    );
    if (duplicate) {
      res.status(409).json({ success: false, message: `Username "${cleanUser}" already exists` });
      return;
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      username: cleanUser,
      password: cleanPass,
      role: role === 'admin' ? 'admin' : 'buyer',
      name: (name && typeof name === 'string' && name.trim()) || cleanUser,
      status: 'active',
      createdAt: new Date().toISOString(),
      notes: (notes && typeof notes === 'string' && notes.trim()) || undefined,
    };

    db.users = [newUser, ...db.users];
    broadcastState();
    res.json({ success: true, user: newUser, users: db.users });
  });

  // 3. Update existing user (credentials, status, role, notes)
  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, password, role, name, status, notes } = req.body;

    const userIndex = db.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const current = db.users[userIndex];

    if (username && typeof username === 'string') {
      const cleanUser = username.trim();
      const collision = db.users.some(
        (u) => u.id !== id && u.username.trim().toLowerCase() === cleanUser.toLowerCase()
      );
      if (collision) {
        res.status(409).json({ success: false, message: `Username "${cleanUser}" already in use` });
        return;
      }
      current.username = cleanUser;
    }

    if (password && typeof password === 'string' && password.trim().length >= 4) {
      current.password = password.trim();
    }

    if (role === 'admin' || role === 'buyer') {
      current.role = role;
    }

    if (typeof name === 'string') {
      current.name = name.trim();
    }

    if (status === 'active' || status === 'suspended') {
      current.status = status;
    }

    if (typeof notes === 'string') {
      current.notes = notes.trim();
    }

    db.users[userIndex] = current;
    broadcastState();
    res.json({ success: true, user: current, users: db.users });
  });

  // 4. Delete user
  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const target = db.users.find((u) => u.id === id);

    if (!target) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Protect master admin or only admin
    if (
      target.username.toLowerCase() === 'salesleads777@gmail.com' ||
      (target.role === 'admin' && db.users.filter((u) => u.role === 'admin').length <= 1)
    ) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete the master administrator account',
      });
      return;
    }

    db.users = db.users.filter((u) => u.id !== id);
    broadcastState();
    res.json({ success: true, users: db.users });
  });

  // 3. Claim Lead(s) - removes permanently from live leads database and moves to claimed vault
  app.post('/api/leads/claim', (req: Request, res: Response) => {
    const { leadId, leadIds, claimedBy = 'Current Closer', notes } = req.body;
    const cleanClaimedBy =
      typeof claimedBy === 'object' && claimedBy !== null
        ? ((claimedBy as any).username || (claimedBy as any).name || 'Current Closer')
        : String(claimedBy || 'Current Closer');
    const idsToClaim = new Set<string>();

    if (leadId) idsToClaim.add(String(leadId));
    if (Array.isArray(leadIds)) {
      leadIds.forEach((id: string) => idsToClaim.add(String(id)));
    }

    if (idsToClaim.size === 0) {
      res.status(400).json({ error: 'No lead IDs provided to claim' });
      return;
    }

    const now = new Date().toISOString();
    const newlyClaimed: Lead[] = [];

    // Find in active live leads
    const remainingLeads: Lead[] = [];
    for (const lead of db.leads) {
      if (idsToClaim.has(lead.id)) {
        newlyClaimed.push({
          ...lead,
          status: 'CLAIMED',
          claimedBy: cleanClaimedBy,
          claimedAt: now,
          notes: notes || lead.notes || `Claimed on ${new Date().toLocaleDateString()}`,
          isNewArrival: false,
        });
      } else {
        remainingLeads.push(lead);
      }
    }

    db.leads = remainingLeads;

    // Filter out duplicates if already in claimedLeads, then prepend
    const existingClaimedIds = new Set(newlyClaimed.map((l) => l.id));
    db.claimedLeads = [
      ...newlyClaimed,
      ...db.claimedLeads.filter((l) => !existingClaimedIds.has(l.id)),
    ];

    broadcastState();
    res.json({
      success: true,
      claimedCount: newlyClaimed.length,
      claimedLeads: newlyClaimed,
      remainingLiveCount: db.leads.length,
    });
  });

  // 4. Release Lead back to live database pool
  app.post('/api/leads/release', (req: Request, res: Response) => {
    const { leadId } = req.body;
    if (!leadId) {
      res.status(400).json({ error: 'leadId is required' });
      return;
    }

    const target = db.claimedLeads.find((l) => l.id === leadId);
    if (!target) {
      res.status(404).json({ error: 'Lead not found in claimed vault' });
      return;
    }

    db.claimedLeads = db.claimedLeads.filter((l) => l.id !== leadId);

    const restored: Lead = {
      ...target,
      status: 'NEW',
      claimedBy: undefined,
      claimedAt: undefined,
      isNewArrival: true,
    };

    db.leads = [restored, ...db.leads.filter((l) => l.id !== leadId)];

    broadcastState();
    res.json({ success: true, restoredLead: restored });
  });

  // 5. Delete or Clear claimed lead(s) from vault
  app.post('/api/leads/delete', (req: Request, res: Response) => {
    const { leadId, leadIds, clearAll, username } = req.body;
    const idsToDelete = new Set<string>();
    if (leadId) idsToDelete.add(String(leadId));
    if (Array.isArray(leadIds)) {
      leadIds.forEach((id: string) => idsToDelete.add(String(id)));
    }

    if (clearAll) {
      if (username) {
        const u = String(username).toLowerCase();
        db.claimedLeads.filter((l) => {
          const owner = typeof l.claimedBy === 'object' && l.claimedBy !== null
            ? ((l.claimedBy as any).username || (l.claimedBy as any).name)
            : String(l.claimedBy || '');
          return owner.toLowerCase() === u;
        }).forEach((l) => deletedClaimedIds.add(l.id));

        db.claimedLeads = db.claimedLeads.filter((l) => {
          const owner = typeof l.claimedBy === 'object' && l.claimedBy !== null
            ? ((l.claimedBy as any).username || (l.claimedBy as any).name)
            : String(l.claimedBy || '');
          return owner.toLowerCase() !== u;
        });
      } else {
        db.claimedLeads.forEach((l) => deletedClaimedIds.add(l.id));
        db.claimedLeads = [];
      }
    } else if (idsToDelete.size > 0) {
      idsToDelete.forEach((id) => deletedClaimedIds.add(id));
      db.claimedLeads = db.claimedLeads.filter((l) => !idsToDelete.has(l.id));
    } else {
      res.status(400).json({ error: 'leadId, leadIds, or clearAll is required' });
      return;
    }

    broadcastState();
    res.json({ success: true, remainingClaimedCount: db.claimedLeads.length });
  });

  // Dedicated endpoint to clear claimed vault portfolio
  app.post('/api/leads/clear-claimed', (req: Request, res: Response) => {
    const { username, leadIds } = req.body;
    if (Array.isArray(leadIds) && leadIds.length > 0) {
      const ids = new Set(leadIds.map(String));
      ids.forEach((id) => deletedClaimedIds.add(id));
      db.claimedLeads = db.claimedLeads.filter((l) => !ids.has(l.id));
    } else if (username) {
      const u = String(username).toLowerCase();
      db.claimedLeads.filter((l) => {
        const owner = typeof l.claimedBy === 'object' && l.claimedBy !== null
          ? ((l.claimedBy as any).username || (l.claimedBy as any).name)
          : String(l.claimedBy || '');
        return owner.toLowerCase() === u;
      }).forEach((l) => deletedClaimedIds.add(l.id));

      db.claimedLeads = db.claimedLeads.filter((l) => {
        const owner = typeof l.claimedBy === 'object' && l.claimedBy !== null
          ? ((l.claimedBy as any).username || (l.claimedBy as any).name)
          : String(l.claimedBy || '');
        return owner.toLowerCase() !== u;
      });
    } else {
      db.claimedLeads.forEach((l) => deletedClaimedIds.add(l.id));
      db.claimedLeads = [];
    }

    broadcastState();
    res.json({ success: true, remainingClaimedCount: db.claimedLeads.length });
  });

  // 6. Update lead status
  app.post('/api/leads/status', (req: Request, res: Response) => {
    const { leadId, status, notes, username } = req.body;
    if (!leadId || !status) {
      res.status(400).json({ error: 'leadId and status are required' });
      return;
    }

    // If changing to CLAIMED, handle as claim
    if (status === 'CLAIMED') {
      const targetLive = db.leads.find((l) => l.id === leadId);
      if (targetLive) {
        db.leads = db.leads.filter((l) => l.id !== leadId);
        const claimed: Lead = {
          ...targetLive,
          status: 'CLAIMED',
          claimedBy: username || 'Current Closer',
          claimedAt: new Date().toISOString(),
          notes: notes || targetLive.notes,
        };
        db.claimedLeads = [claimed, ...db.claimedLeads.filter((l) => l.id !== leadId)];
        broadcastState();
        res.json({ success: true, lead: claimed });
        return;
      }
    }

    db.leads = db.leads.map((l) => (l.id === leadId ? { ...l, status, notes: notes ?? l.notes } : l));
    db.claimedLeads = db.claimedLeads.map((l) =>
      l.id === leadId ? { ...l, status, notes: notes ?? l.notes } : l
    );

    broadcastState();
    res.json({ success: true });
  });

  // 7. Instant Drop Next Lead from Queue
  app.post('/api/leads/drop-next', (_req: Request, res: Response) => {
    tickDripWorker();
    const droppedLead = db.leads[0];
    if (!droppedLead) {
      res.status(400).json({ error: 'Queue is empty' });
      return;
    }
    dripWorker();
    res.json({ success: true, lead: droppedLead });
  });

  // 8. Upload / Add leads to Live Feed and/or Queue with 24/7 infinite looping support
  app.post('/api/leads/upload', (req: Request, res: Response) => {
    const {
      leads: incomingLeads = [],
      queue: incomingQueue = [],
      masterQueue: incomingMasterQueue = [],
    } = req.body;
    
    console.log(`[Upload] Incoming leads: ${incomingLeads.length}, queue: ${incomingQueue.length}, masterQueue: ${incomingMasterQueue.length}`);

    const cleanMaster = Array.isArray(incomingMasterQueue) && incomingMasterQueue.length > 0
      ? incomingMasterQueue.filter((l) => !isTestLead(l))
      : (Array.isArray(incomingQueue) && incomingQueue.length > 0
          ? incomingQueue.filter((l) => !isTestLead(l))
          : (Array.isArray(incomingLeads) ? incomingLeads.filter((l) => !isTestLead(l)) : []));

    // FLUSH / DELETE all old data from master_leads_queue and live_feed so we start fresh
    db.masterQueue = cleanMaster;
    
    // Populate active queue
    if (Array.isArray(incomingQueue) && incomingQueue.length > 0) {
      db.queue = incomingQueue.filter((l: any) => !isTestLead(l));
    } else {
      db.queue = [...cleanMaster];
    }

    // 1. FLUSH / DELETE all old data from master_leads_queue and live_feed so we start fresh
    db.masterQueue = cleanMaster;
    db.queue = [...cleanMaster];
    db.leads = [];
    db.currentDripIndex = 0;
    db.droppedCount = 0;

    // 2. Drip ONE lead at a time starting with lead #1 from original spreadsheet order
    if (db.masterQueue.length > 0) {
      const firstRaw = db.masterQueue[0];
      const newLead: Lead = {
        ...firstRaw,
        id: `TS-${Math.floor(849000 + Math.random() * 9999)}`,
        timestamp: new Date().toISOString(),
        receivedAgo: 'Just now',
        isNewArrival: true,
        sourceDomain: firstRaw.sourceDomain || getDomainForResort(firstRaw.resortDeveloper),
        status: 'NEW',
      };
      db.leads = [newLead];
      db.currentDripIndex = 1 % db.masterQueue.length;
      db.droppedCount = 1;
      if (db.queue.length > 0) {
        db.queue = db.queue.slice(1);
      }
    }

    db.dripConfig.isEnabled = true;
    saveDb(true);

    // Restart dripWorker for continuous 24/7 infinite looping one-by-one drip
    if (dripTimer) {
      clearTimeout(dripTimer);
      dripTimer = null;
    }
    dripWorker();
    broadcastState();

    res.json({
      success: true,
      liveCount: db.leads.length,
      queueCount: db.queue.length,
      masterQueueCount: db.masterQueue.length,
      currentDripIndex: db.currentDripIndex,
    });
  });

  // Dedicated endpoint to thoroughly purge any test leads
  app.post('/api/leads/purge-test-leads', (_req: Request, res: Response) => {
    db.leads = db.leads.filter((l) => !isTestLead(l));
    db.queue = db.queue.filter((l) => !isTestLead(l));
    db.masterQueue = db.masterQueue.filter((l) => !isTestLead(l));
    db.claimedLeads = db.claimedLeads.filter((l) => !isTestLead(l));
    safeWriteJson(MASTER_QUEUE_FILE, db.masterQueue, false);
    safeWriteJson(SRC_MASTER_QUEUE_FILE, db.masterQueue, false);
    saveDb();
    broadcastState();
    res.json({
      success: true,
      liveCount: db.leads.length,
      queueCount: db.queue.length,
      masterQueueCount: db.masterQueue.length,
    });
  });

  // 8b. Shuffle Queue disabled
  app.post('/api/leads/shuffle-queue', (_req: Request, res: Response) => {
    res.json({ success: false, message: 'Shuffling disabled for strict ordered drip.' });
  });

  // Dedicated endpoint to sync authorized users and prevent deletion
  app.post('/api/users/sync', (req: Request, res: Response) => {
    const { clientUsers = [] } = req.body;
    let added = false;
    if (Array.isArray(clientUsers) && clientUsers.length > 0) {
      const existingUsernames = new Set(db.users.map((u) => u.username.trim().toLowerCase()));
      for (const u of clientUsers) {
        if (u && u.username && !existingUsernames.has(u.username.trim().toLowerCase())) {
          db.users.push(u);
          existingUsernames.add(u.username.trim().toLowerCase());
          added = true;
        }
      }
    }
    if (added) {
      saveUsers();
      saveDb();
      broadcastState();
    }
    res.json({ success: true, users: db.users });
  });

  // 9. Clear Feeder Queue
  app.post('/api/leads/clear-queue', (_req: Request, res: Response) => {
    db.queue = [];
    db.masterQueue = [];
    db.currentDripIndex = 0;
    if (dripTimer) {
      clearTimeout(dripTimer);
      dripTimer = null;
    }
    broadcastState();
    res.json({ success: true });
  });

  // 9c. Flush Master Data / Clear Database (Queue, Master Queue, Live Feed, Claimed Vault, Pointer)
  app.post('/api/leads/clear-all-lists', (_req: Request, res: Response) => {
    db.queue = [];
    db.masterQueue = [];
    db.leads = [];
    db.claimedLeads = [];
    db.currentDripIndex = 0;
    db.droppedCount = 0;
    deletedClaimedIds.clear();
    if (dripTimer) {
      clearTimeout(dripTimer);
      dripTimer = null;
    }
    safeWriteJson(SRC_MASTER_QUEUE_FILE, [], false);
    safeWriteJson(MASTER_QUEUE_FILE, [], false);
    saveDb();
    broadcastState();
    res.json({ success: true });
  });

  // 9b. Clear All Leads From Live Feed
  app.post('/api/leads/clear-feed', (_req: Request, res: Response) => {
    const clearedCount = db.leads.length;
    db.leads = [];
    broadcastState();
    res.json({ success: true, clearedCount, liveCount: 0 });
  });

  // 10. Update Drip Configuration & Start/Stop Worker
  app.post('/api/drip/config', (req: Request, res: Response) => {
    const newConfig: Partial<DripConfig> = req.body;
    db.dripConfig = { ...db.dripConfig, ...newConfig };
    dripWorker();
    saveDb();
    broadcastState();
    res.json({ success: true, config: db.dripConfig });
  });

  // 11. Sync endpoint - merges any client leads into server database without loss
  app.post('/api/leads/sync', (req: Request, res: Response) => {
    const { clientLeads = [], clientClaimed = [], clientQueue = [], clientUsers = [] } = req.body;

    let changes = false;
    const currentLeadIds = new Set(db.leads.map((l) => l.id));
    const currentClaimedIds = new Set(db.claimedLeads.map((l) => l.id));

    if (Array.isArray(clientLeads)) {
      const existingContactKeys = new Set(db.leads.map(getLeadDedupeKey));
      for (const lead of clientLeads) {
        if (isTestLead(lead)) continue;
        const contactKey = getLeadDedupeKey(lead);
        if (!currentLeadIds.has(lead.id) && !currentClaimedIds.has(lead.id) && !existingContactKeys.has(contactKey)) {
          db.leads.push(lead);
          currentLeadIds.add(lead.id);
          existingContactKeys.add(contactKey);
          changes = true;
        }
      }
      if (changes) {
        const uniqueLeads = deduplicateLeads(db.leads).filter((l) => !isTestLead(l));
        const unclaimed = uniqueLeads.filter((l) => l.status !== 'CLAIMED');
        const claimed = uniqueLeads.filter((l) => l.status === 'CLAIMED');
        db.leads = [...unclaimed.slice(0, MAX_FEED_DISPLAY), ...claimed];
      }
    }

    if (Array.isArray(clientClaimed)) {
      for (const lead of clientClaimed) {
        if (isTestLead(lead)) continue;
        if (!currentClaimedIds.has(lead.id) && !deletedClaimedIds.has(lead.id)) {
          // If in live leads, remove it
          db.leads = db.leads.filter((l) => l.id !== lead.id);
          db.claimedLeads.push(lead);
          currentClaimedIds.add(lead.id);
          changes = true;
        }
      }
    }

    if (Array.isArray(clientQueue) && clientQueue.length > 0) {
      const existingQueueKeys = new Set(db.queue.map(getLeadDedupeKey));
      let queueAdded = false;
      for (const item of clientQueue) {
        if (isTestLead(item)) continue;
        const key = getLeadDedupeKey(item);
        if (!existingQueueKeys.has(key)) {
          db.queue.push(item);
          existingQueueKeys.add(key);
          queueAdded = true;
        }
      }
      if (queueAdded) {
        changes = true;
        dripWorker();
      }
    }

    if (Array.isArray(clientUsers) && clientUsers.length > 0) {
      const existingUserIds = new Set(db.users.map((u) => u.id));
      const existingUsernames = new Set(db.users.map((u) => u.username.toLowerCase()));
      for (const u of clientUsers) {
        if (!existingUserIds.has(u.id) && !existingUsernames.has(u.username.toLowerCase())) {
          db.users.push(u);
          existingUserIds.add(u.id);
          existingUsernames.add(u.username.toLowerCase());
          changes = true;
        }
      }
      if (changes) {
        saveUsers();
      }
    }

    if (changes) {
      broadcastState();
    }

    res.json({ success: true, state: getPublicState() });
  });

  // Setup Vite in Dev or Static files in Production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }



  app.listen(PORT, '0.0.0.0', () => {
    console.log(`1ClickLeads Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
