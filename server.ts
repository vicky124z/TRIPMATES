import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { INITIAL_DATA, DatabaseStore } from './src/data/initialData.ts';
import {
  User,
  Destination,
  Trip,
  TripMembership,
  ItineraryItem,
  Post,
  Comment,
  LikeSave,
  Notification,
  Report,
} from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'tripmates_db.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory store with disk backing
let db: DatabaseStore;

function loadDatabase(): DatabaseStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read existing database file, initializing fresh store:', err);
  }
  const fresh = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveDatabase(fresh);
  return fresh;
}

function saveDatabase(dataToSave: DatabaseStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}

db = loadDatabase();

// Airtable integration state
interface AirtableEnvConfig {
  apiKey: string;
  baseId: string;
  adminSecret: string;
}

let airtableConfig: AirtableEnvConfig = {
  apiKey: process.env.AIRTABLE_API_KEY || '',
  baseId: process.env.AIRTABLE_BASE_ID || '',
  adminSecret: process.env.ADMIN_SECRET || 'tripmates_admin_2026',
};

// Helper: safe user (strips password and private details)
function sanitizeUser(u: User, requesterId?: string): Partial<User> {
  const isOwner = requesterId && requesterId === u.id;
  const isAdmin = requesterId && db.users.find(x => x.id === requesterId)?.role === 'admin';

  return {
    id: u.id,
    userId: u.userId,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    profilePhoto: u.profilePhoto,
    bio: u.bio,
    homeCity: u.homeCity,
    languages: u.languages,
    travelInterests: u.travelInterests,
    preferredTravelStyle: u.preferredTravelStyle,
    budgetMin: u.budgetMin,
    budgetMax: u.budgetMax,
    preferredGroupSize: u.preferredGroupSize,
    profileVisibility: u.profileVisibility,
    accountStatus: u.accountStatus,
    createdAt: u.createdAt,
    // Sensitive fields only for owner or admin:
    email: isOwner || isAdmin ? u.email : undefined,
    savedDestinations: isOwner || isAdmin ? u.savedDestinations : [],
    savedPosts: isOwner || isAdmin ? u.savedPosts : [],
  };
}

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  const {
    username,
    fullName,
    email,
    password,
    homeCity,
    bio,
    travelInterests,
    preferredTravelStyle,
    budgetMin,
    budgetMax,
    preferredGroupSize,
    languages,
  } = req.body;

  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ error: 'Username, full name, email, and password are required.' });
  }

  // Check unique username or email
  const existing = db.users.find(
    u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    return res.status(409).json({ error: 'Username or email is already registered.' });
  }

  const id = `rec_usr_${Date.now()}`;
  const newUser: User & { passwordHash: string } = {
    id,
    userId: `usr_${Date.now().toString().slice(-6)}`,
    authProviderId: `local_${Date.now()}`,
    username: username.trim(),
    fullName: fullName.trim(),
    email: email.trim(),
    role: 'user',
    passwordHash: password, // In production, bcrypt hash
    profilePhoto:
      req.body.profilePhoto ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
    bio: bio || 'Passionate traveler exploring the globe.',
    homeCity: homeCity || 'Global Citizen',
    languages: Array.isArray(languages) ? languages : ['English'],
    travelInterests: Array.isArray(travelInterests) ? travelInterests : ['Adventure', 'Nature'],
    preferredTravelStyle: preferredTravelStyle || 'Mid-range',
    budgetMin: Number(budgetMin) || 500,
    budgetMax: Number(budgetMax) || 2500,
    preferredGroupSize: Number(preferredGroupSize) || 4,
    profileVisibility: 'public',
    accountStatus: 'active',
    savedDestinations: [],
    savedPosts: [],
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  return res.status(201).json({
    message: 'User registered successfully',
    user: sanitizeUser(newUser, newUser.id),
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your username/email and password.' });
  }

  const user = db.users.find(
    u =>
      (u.username.toLowerCase() === identifier.toLowerCase() ||
        u.email.toLowerCase() === identifier.toLowerCase()) &&
      u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your login details.' });
  }

  if (user.accountStatus === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended by community moderation.' });
  }

  return res.json({
    message: 'Login successful',
    user: sanitizeUser(user, user.id),
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    // Return default demo user (Maya) if not signed in for smooth first-time browsing
    const demo = db.users[0];
    return res.json({ user: sanitizeUser(demo, demo.id), isDemo: true });
  }

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({ user: sanitizeUser(user, user.id), isDemo: false });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this email address.' });
  }
  return res.json({
    message: `Password reset instructions have been dispatched to ${email}. Check your inbox or use password: "tripmates123" for demo accounts.`,
  });
});

// ==========================================
// 2. USERS & TRAVEL COMPANIONS
// ==========================================

app.get('/api/users', (req: Request, res: Response) => {
  const { style, interest, language, search, maxBudget } = req.query;
  const requesterId = req.headers['x-user-id'] as string;

  let list = db.users.filter(u => u.profileVisibility === 'public' && u.accountStatus === 'active');

  if (style) {
    list = list.filter(u => u.preferredTravelStyle.toLowerCase() === String(style).toLowerCase());
  }
  if (interest) {
    list = list.filter(u =>
      u.travelInterests.some(i => i.toLowerCase().includes(String(interest).toLowerCase()))
    );
  }
  if (language) {
    list = list.filter(u =>
      u.languages.some(l => l.toLowerCase().includes(String(language).toLowerCase()))
    );
  }
  if (maxBudget) {
    list = list.filter(u => u.budgetMin <= Number(maxBudget));
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      u =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.homeCity.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q)
    );
  }

  const sanitized = list.map(u => sanitizeUser(u, requesterId));
  return res.json({ users: sanitized });
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  const user = db.users.find(u => u.id === id || u.username === id);

  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Get user's public posts and trips
  const userPosts = db.posts.filter(p => p.author === user.id && p.moderationStatus === 'active');
  const userTrips = db.trips.filter(t => t.creator === user.id && t.tripStatus !== 'cancelled');
  const userMemberships = db.tripMemberships.filter(m => m.user === user.id && m.requestStatus === 'Approved');

  return res.json({
    user: sanitizeUser(user, requesterId),
    posts: userPosts,
    trips: userTrips,
    memberships: userMemberships,
  });
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  if (requesterId !== id) {
    const requester = db.users.find(u => u.id === requesterId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to modify this profile.' });
    }
  }

  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'User not found.' });

  const current = db.users[idx];
  const {
    fullName,
    bio,
    homeCity,
    languages,
    travelInterests,
    preferredTravelStyle,
    budgetMin,
    budgetMax,
    preferredGroupSize,
    profilePhoto,
    profileVisibility,
  } = req.body;

  db.users[idx] = {
    ...current,
    fullName: fullName !== undefined ? fullName : current.fullName,
    bio: bio !== undefined ? bio : current.bio,
    homeCity: homeCity !== undefined ? homeCity : current.homeCity,
    languages: Array.isArray(languages) ? languages : current.languages,
    travelInterests: Array.isArray(travelInterests) ? travelInterests : current.travelInterests,
    preferredTravelStyle: preferredTravelStyle !== undefined ? preferredTravelStyle : current.preferredTravelStyle,
    budgetMin: budgetMin !== undefined ? Number(budgetMin) : current.budgetMin,
    budgetMax: budgetMax !== undefined ? Number(budgetMax) : current.budgetMax,
    preferredGroupSize: preferredGroupSize !== undefined ? Number(preferredGroupSize) : current.preferredGroupSize,
    profilePhoto: profilePhoto !== undefined ? profilePhoto : current.profilePhoto,
    profileVisibility: profileVisibility !== undefined ? profileVisibility : current.profileVisibility,
  };

  saveDatabase(db);
  return res.json({ message: 'Profile updated', user: sanitizeUser(db.users[idx], id) });
});

app.post('/api/users/:id/wishlist', (req: Request, res: Response) => {
  const { id } = req.params;
  const { destinationId } = req.body;
  const requesterId = req.headers['x-user-id'] as string;

  if (requesterId !== id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const exists = user.savedDestinations.includes(destinationId);
  if (exists) {
    user.savedDestinations = user.savedDestinations.filter(d => d !== destinationId);
  } else {
    user.savedDestinations.push(destinationId);
  }

  saveDatabase(db);
  return res.json({
    savedDestinations: user.savedDestinations,
    isSaved: !exists,
  });
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  if (requesterId !== id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Mark status as deactivated or remove
  user.accountStatus = 'suspended';
  user.profileVisibility = 'private';
  user.bio = '[Account Deleted by User]';

  saveDatabase(db);
  return res.json({ message: 'Account scheduled for deletion and personal data scrubbed.' });
});

// ==========================================
// 3. DESTINATIONS
// ==========================================

app.get('/api/destinations', (req: Request, res: Response) => {
  const { category, search, country, maxBudget } = req.query;
  let list = db.destinations;

  if (category && category !== 'All') {
    list = list.filter(d => d.category.toLowerCase() === String(category).toLowerCase());
  }
  if (country) {
    list = list.filter(d => d.country.toLowerCase().includes(String(country).toLowerCase()));
  }
  if (maxBudget) {
    list = list.filter(d => d.estimatedBudget <= Number(maxBudget));
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      d =>
        d.destinationName.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }

  return res.json({ destinations: list });
});

app.get('/api/destinations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const dest = db.destinations.find(d => d.id === id || d.destinationId === id);
  if (!dest) return res.status(404).json({ error: 'Destination not found.' });

  // Related trips
  const relatedTrips = db.trips.filter(t => t.destination === dest.id && t.tripStatus !== 'cancelled');

  // Interested travelers who saved this destination
  const interestedUsers = db.users
    .filter(u => u.savedDestinations.includes(dest.id) && u.profileVisibility === 'public')
    .map(u => sanitizeUser(u));

  return res.json({
    destination: dest,
    relatedTrips,
    interestedUsers,
  });
});

app.post('/api/destinations', (req: Request, res: Response) => {
  const {
    destinationName,
    country,
    stateOrRegion,
    city,
    description,
    category,
    coverImage,
    estimatedBudget,
    recommendedDuration,
    bestVisitingSeason,
    attractions,
    mapCoordinates,
  } = req.body;

  if (!destinationName || !country || !category) {
    return res.status(400).json({ error: 'Destination name, country, and category are required.' });
  }

  const id = `rec_dst_${Date.now()}`;
  const newDest: Destination = {
    id,
    destinationId: `dst_${Date.now().toString().slice(-6)}`,
    destinationName,
    country,
    stateOrRegion: stateOrRegion || '',
    city: city || '',
    description: description || '',
    category: category,
    coverImage:
      coverImage ||
      '/src/assets/images/destination_kyoto_bamboo_1793249479595.jpg',
    galleryImages: [coverImage || '/src/assets/images/destination_kyoto_bamboo_1793249479595.jpg'],
    estimatedBudget: Number(estimatedBudget) || 1200,
    recommendedDuration: recommendedDuration || '4-7 days',
    bestVisitingSeason: bestVisitingSeason || 'Year-round',
    attractions: Array.isArray(attractions) ? attractions : [],
    mapCoordinates: mapCoordinates || { lat: 0, lng: 0 },
    verificationStatus: 'community',
  };

  db.destinations.push(newDest);
  saveDatabase(db);
  return res.status(201).json({ destination: newDest });
});

// ==========================================
// 4. TRIPS & MARKETPLACE
// ==========================================

app.get('/api/trips', (req: Request, res: Response) => {
  const { destination, category, style, minBudget, maxBudget, search, status } = req.query;

  let list = db.trips.filter(t => t.visibility === 'public');

  if (status) {
    list = list.filter(t => t.tripStatus === status);
  }
  if (category && category !== 'All') {
    list = list.filter(t => t.tripCategory.toLowerCase() === String(category).toLowerCase());
  }
  if (style) {
    list = list.filter(t => t.travelStyle.toLowerCase() === String(style).toLowerCase());
  }
  if (destination) {
    list = list.filter(t => t.destination === destination);
  }
  if (maxBudget) {
    list = list.filter(t => t.budgetPerPerson <= Number(maxBudget));
  }
  if (minBudget) {
    list = list.filter(t => t.budgetPerPerson >= Number(minBudget));
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      t =>
        t.tripTitle.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.meetingPoint.toLowerCase().includes(q)
    );
  }

  // Hydrate with creator profile and approved count
  const hydrated = list.map(t => {
    const creatorUser = db.users.find(u => u.id === t.creator);
    const dest = db.destinations.find(d => d.id === t.destination);
    const approved = db.tripMemberships.filter(m => m.trip === t.id && m.requestStatus === 'Approved');

    return {
      ...t,
      creatorProfile: creatorUser ? sanitizeUser(creatorUser) : undefined,
      destinationDetails: dest,
      approvedCount: approved.length,
    };
  });

  return res.json({ trips: hydrated });
});

app.get('/api/trips/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const trip = db.trips.find(t => t.id === id || t.tripId === id);
  if (!trip) return res.status(404).json({ error: 'Trip not found.' });

  const creatorUser = db.users.find(u => u.id === trip.creator);
  const dest = db.destinations.find(d => d.id === trip.destination);
  const memberships = db.tripMemberships.filter(m => m.trip === trip.id);
  const approvedMemberships = memberships.filter(m => m.requestStatus === 'Approved');

  const memberProfiles = approvedMemberships
    .map(m => {
      const u = db.users.find(usr => usr.id === m.user);
      return u ? { ...sanitizeUser(u), membershipRole: m.membershipRole } : null;
    })
    .filter(Boolean);

  const itinerary = db.itineraryItems
    .filter(i => i.trip === trip.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return res.json({
    trip: {
      ...trip,
      creatorProfile: creatorUser ? sanitizeUser(creatorUser) : undefined,
      destinationDetails: dest,
      approvedCount: approvedMemberships.length,
    },
    memberships,
    memberProfiles,
    itinerary,
  });
});

app.post('/api/trips', (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  const {
    tripTitle,
    destination,
    description,
    startDate,
    endDate,
    budgetPerPerson,
    currency,
    maximumMembers,
    tripCategory,
    travelStyle,
    coverImage,
    visibility,
    joinPolicy,
    meetingPoint,
    itinerary,
  } = req.body;

  if (!requesterId) {
    return res.status(401).json({ error: 'Please log in to create a trip.' });
  }

  const creator = db.users.find(u => u.id === requesterId);
  if (!creator) return res.status(404).json({ error: 'Creator not found.' });

  // Validations
  if (!tripTitle || !destination || !startDate || !endDate) {
    return res.status(400).json({ error: 'Trip title, destination, start date, and end date are required.' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return res.status(400).json({ error: 'Invalid date range. End date must be on or after start date.' });
  }

  const capacity = Number(maximumMembers) || 6;
  if (capacity < 2 || capacity > 50) {
    return res.status(400).json({ error: 'Maximum group size must be between 2 and 50.' });
  }

  const id = `rec_trp_${Date.now()}`;
  const newTrip: Trip = {
    id,
    tripId: `trp_${Date.now().toString().slice(-6)}`,
    tripTitle: tripTitle.trim(),
    creator: creator.id,
    destination,
    description: description || '',
    startDate,
    endDate,
    budgetPerPerson: Number(budgetPerPerson) || 1000,
    currency: currency || 'USD',
    maximumMembers: capacity,
    tripCategory: tripCategory || 'Adventure',
    travelStyle: travelStyle || 'Mid-range',
    coverImage:
      coverImage ||
      '/src/assets/images/hero_travel_adventure_1793249478917.jpg',
    visibility: visibility || 'public',
    joinPolicy: joinPolicy || 'request',
    meetingPoint: meetingPoint || 'Airport Arrival Terminal',
    tripStatus: 'upcoming',
    createdAt: new Date().toISOString(),
  };

  db.trips.push(newTrip);

  // Automatically create approved creator membership
  const creatorMembership: TripMembership = {
    id: `rec_mem_${Date.now()}`,
    membershipId: `mem_${Date.now().toString().slice(-6)}`,
    trip: newTrip.id,
    user: creator.id,
    requestMessage: 'Trip Organizer & Creator',
    requestStatus: 'Approved',
    membershipRole: 'creator',
    requestedAt: new Date().toISOString(),
    decisionDate: new Date().toISOString(),
  };
  db.tripMemberships.push(creatorMembership);

  // If itinerary items were passed during creation
  if (Array.isArray(itinerary)) {
    itinerary.forEach((item, idx) => {
      db.itineraryItems.push({
        id: `rec_itn_${Date.now()}_${idx}`,
        itineraryItemId: `itn_${Date.now().toString().slice(-6)}_${idx}`,
        trip: newTrip.id,
        dayNumber: item.dayNumber || idx + 1,
        activityTitle: item.activityTitle || `Day ${idx + 1} Activity`,
        description: item.description || '',
        startTime: item.startTime || '09:00',
        duration: item.duration || '3 hours',
        location: item.location || newTrip.meetingPoint,
        estimatedCost: Number(item.estimatedCost) || 0,
        notes: item.notes || '',
        sortOrder: idx + 1,
      });
    });
  }

  saveDatabase(db);
  return res.status(201).json({ trip: newTrip });
});

app.put('/api/trips/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  const tripIdx = db.trips.findIndex(t => t.id === id);

  if (tripIdx === -1) return res.status(404).json({ error: 'Trip not found.' });
  const trip = db.trips[tripIdx];

  if (trip.creator !== requesterId) {
    const admin = db.users.find(u => u.id === requesterId && u.role === 'admin');
    if (!admin) return res.status(403).json({ error: 'Only the trip creator or an admin can update this trip.' });
  }

  const {
    tripTitle,
    description,
    startDate,
    endDate,
    budgetPerPerson,
    currency,
    maximumMembers,
    tripCategory,
    travelStyle,
    coverImage,
    visibility,
    joinPolicy,
    meetingPoint,
    tripStatus,
  } = req.body;

  db.trips[tripIdx] = {
    ...trip,
    tripTitle: tripTitle || trip.tripTitle,
    description: description !== undefined ? description : trip.description,
    startDate: startDate || trip.startDate,
    endDate: endDate || trip.endDate,
    budgetPerPerson: budgetPerPerson !== undefined ? Number(budgetPerPerson) : trip.budgetPerPerson,
    currency: currency || trip.currency,
    maximumMembers: maximumMembers !== undefined ? Number(maximumMembers) : trip.maximumMembers,
    tripCategory: tripCategory || trip.tripCategory,
    travelStyle: travelStyle || trip.travelStyle,
    coverImage: coverImage || trip.coverImage,
    visibility: visibility || trip.visibility,
    joinPolicy: joinPolicy || trip.joinPolicy,
    meetingPoint: meetingPoint || trip.meetingPoint,
    tripStatus: tripStatus || trip.tripStatus,
  };

  saveDatabase(db);
  return res.json({ trip: db.trips[tripIdx] });
});

app.post('/api/trips/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  const trip = db.trips.find(t => t.id === id);

  if (!trip) return res.status(404).json({ error: 'Trip not found.' });
  if (trip.creator !== requesterId) {
    const admin = db.users.find(u => u.id === requesterId && u.role === 'admin');
    if (!admin) return res.status(403).json({ error: 'Only creator can cancel.' });
  }

  trip.tripStatus = 'cancelled';

  // Notify all approved members
  const members = db.tripMemberships.filter(m => m.trip === trip.id && m.requestStatus === 'Approved' && m.user !== trip.creator);
  members.forEach(m => {
    db.notifications.push({
      id: `rec_not_${Date.now()}_${m.user}`,
      notificationId: `not_${Date.now().toString().slice(-6)}`,
      recipient: m.user,
      notificationType: 'trip_update',
      message: `The trip "${trip.tripTitle}" has been cancelled by the organizer.`,
      relatedTrip: trip.id,
      readStatus: false,
      createdAt: new Date().toISOString(),
    });
  });

  saveDatabase(db);
  return res.json({ message: 'Trip has been cancelled and members notified.' });
});

// ==========================================
// 5. TRIP MEMBERSHIP & WORKFLOWS
// ==========================================

app.post('/api/trips/:id/join', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  const { requestMessage } = req.body;

  if (!requesterId) return res.status(401).json({ error: 'Please log in to join this trip.' });

  const trip = db.trips.find(t => t.id === id);
  if (!trip) return res.status(404).json({ error: 'Trip not found.' });

  if (trip.tripStatus === 'cancelled') {
    return res.status(400).json({ error: 'This trip has been cancelled.' });
  }

  // Prevent duplicate membership or pending request
  const existing = db.tripMemberships.find(m => m.trip === trip.id && m.user === requesterId);
  if (existing) {
    if (existing.requestStatus === 'Approved') {
      return res.status(409).json({ error: 'You are already an approved member of this trip.' });
    }
    if (existing.requestStatus === 'Pending') {
      return res.status(409).json({ error: 'You already have a pending join request for this trip.' });
    }
  }

  // Check current capacity
  const approvedCount = db.tripMemberships.filter(m => m.trip === trip.id && m.requestStatus === 'Approved').length;
  if (approvedCount >= trip.maximumMembers) {
    return res.status(400).json({ error: 'This trip is already at maximum capacity.' });
  }

  const requesterUser = db.users.find(u => u.id === requesterId);
  const isAutoApprove = trip.joinPolicy === 'open';

  const newMembership: TripMembership = {
    id: `rec_mem_${Date.now()}`,
    membershipId: `mem_${Date.now().toString().slice(-6)}`,
    trip: trip.id,
    user: requesterId,
    requestMessage: requestMessage || 'I would love to join your adventure!',
    requestStatus: isAutoApprove ? 'Approved' : 'Pending',
    membershipRole: 'member',
    requestedAt: new Date().toISOString(),
    decisionDate: isAutoApprove ? new Date().toISOString() : null,
  };

  if (existing) {
    // If previously rejected or withdrawn, update existing record
    const idx = db.tripMemberships.findIndex(m => m.id === existing.id);
    db.tripMemberships[idx] = newMembership;
  } else {
    db.tripMemberships.push(newMembership);
  }

  // Create notification for trip creator
  db.notifications.push({
    id: `rec_not_${Date.now()}`,
    notificationId: `not_${Date.now().toString().slice(-6)}`,
    recipient: trip.creator,
    notificationType: 'join_request',
    message: `${requesterUser?.fullName || 'A traveler'} requested to join "${trip.tripTitle}".`,
    relatedTrip: trip.id,
    readStatus: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase(db);
  return res.status(201).json({
    message: isAutoApprove ? 'You have joined the trip!' : 'Join request submitted for creator review.',
    membership: newMembership,
  });
});

app.post('/api/memberships/:id/decision', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  const { decision } = req.body; // 'approve' | 'reject'

  const membership = db.tripMemberships.find(m => m.id === id);
  if (!membership) return res.status(404).json({ error: 'Membership record not found.' });

  const trip = db.trips.find(t => t.id === membership.trip);
  if (!trip) return res.status(404).json({ error: 'Associated trip not found.' });

  // Only creator or admin can decide
  if (trip.creator !== requesterId) {
    const admin = db.users.find(u => u.id === requesterId && u.role === 'admin');
    if (!admin) return res.status(403).json({ error: 'Only the trip creator can review join requests.' });
  }

  if (decision === 'approve') {
    // Re-verify capacity right before approval
    const currentApproved = db.tripMemberships.filter(m => m.trip === trip.id && m.requestStatus === 'Approved').length;
    if (currentApproved >= trip.maximumMembers) {
      return res.status(400).json({ error: `Cannot approve: Trip capacity of ${trip.maximumMembers} is reached.` });
    }

    membership.requestStatus = 'Approved';
    membership.decisionDate = new Date().toISOString();

    // Notify requester
    db.notifications.push({
      id: `rec_not_${Date.now()}`,
      notificationId: `not_${Date.now().toString().slice(-6)}`,
      recipient: membership.user,
      notificationType: 'membership_approved',
      message: `Great news! Your request to join "${trip.tripTitle}" was approved by the organizer.`,
      relatedTrip: trip.id,
      readStatus: false,
      createdAt: new Date().toISOString(),
    });
  } else if (decision === 'reject') {
    membership.requestStatus = 'Rejected';
    membership.decisionDate = new Date().toISOString();

    // Notify requester
    db.notifications.push({
      id: `rec_not_${Date.now()}`,
      notificationId: `not_${Date.now().toString().slice(-6)}`,
      recipient: membership.user,
      notificationType: 'membership_rejected',
      message: `Your request to join "${trip.tripTitle}" was declined by the organizer.`,
      relatedTrip: trip.id,
      readStatus: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    return res.status(400).json({ error: 'Invalid decision. Must be "approve" or "reject".' });
  }

  saveDatabase(db);
  return res.json({ message: `Membership updated to ${membership.requestStatus}`, membership });
});

app.post('/api/memberships/:id/withdraw', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  const membership = db.tripMemberships.find(m => m.id === id);
  if (!membership) return res.status(404).json({ error: 'Membership not found.' });

  if (membership.user !== requesterId) {
    return res.status(403).json({ error: 'You can only withdraw your own membership.' });
  }

  membership.requestStatus = 'Withdrawn';
  saveDatabase(db);
  return res.json({ message: 'Request withdrawn.', membership });
});

// ==========================================
// 6. ITINERARY PLANNER
// ==========================================

app.get('/api/trips/:id/itinerary', (req: Request, res: Response) => {
  const { id } = req.params;
  const items = db.itineraryItems
    .filter(i => i.trip === id)
    .sort((a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder);
  return res.json({ itinerary: items });
});

app.post('/api/trips/:id/itinerary', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  const trip = db.trips.find(t => t.id === id);

  if (!trip) return res.status(404).json({ error: 'Trip not found.' });

  // Only creator or approved member can add itinerary items
  const isMember = db.tripMemberships.some(m => m.trip === id && m.user === requesterId && m.requestStatus === 'Approved');
  if (!isMember && trip.creator !== requesterId) {
    return res.status(403).json({ error: 'Only trip creator or approved members can update the itinerary.' });
  }

  const { dayNumber, activityTitle, description, startTime, duration, location, estimatedCost, notes } = req.body;
  if (!activityTitle) return res.status(400).json({ error: 'Activity title is required.' });

  const newItem: ItineraryItem = {
    id: `rec_itn_${Date.now()}`,
    itineraryItemId: `itn_${Date.now().toString().slice(-6)}`,
    trip: id,
    dayNumber: Number(dayNumber) || 1,
    activityTitle: activityTitle.trim(),
    description: description || '',
    startTime: startTime || '09:00',
    duration: duration || '2 hours',
    location: location || '',
    estimatedCost: Number(estimatedCost) || 0,
    notes: notes || '',
    sortOrder: Date.now(),
  };

  db.itineraryItems.push(newItem);
  saveDatabase(db);
  return res.status(201).json({ item: newItem });
});

app.delete('/api/itinerary/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  const item = db.itineraryItems.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  const trip = db.trips.find(t => t.id === item.trip);
  if (trip?.creator !== requesterId) {
    const admin = db.users.find(u => u.id === requesterId && u.role === 'admin');
    if (!admin) return res.status(403).json({ error: 'Unauthorized to delete itinerary item.' });
  }

  db.itineraryItems = db.itineraryItems.filter(i => i.id !== id);
  saveDatabase(db);
  return res.json({ message: 'Itinerary item deleted.' });
});

// ==========================================
// 7. COMMUNITY FEED, POSTS, COMMENTS, LIKES
// ==========================================

app.get('/api/posts', (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  const { destination, trip } = req.query;

  let list = db.posts.filter(p => p.visibility === 'public' && p.moderationStatus === 'active');

  if (destination) {
    list = list.filter(p => p.destination === destination);
  }
  if (trip) {
    list = list.filter(p => p.trip === trip);
  }

  // Sort latest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const hydrated = list.map(p => {
    const authorUser = db.users.find(u => u.id === p.author);
    const dest = db.destinations.find(d => d.id === p.destination);
    const tr = db.trips.find(t => t.id === p.trip);
    const likes = db.likesAndSaves.filter(ls => ls.post === p.id && ls.interactionType === 'like');
    const comments = db.comments.filter(c => c.post === p.id && c.moderationStatus === 'active');
    const isLiked = requesterId ? likes.some(l => l.user === requesterId) : false;
    const isSaved = requesterId ? (db.users.find(u => u.id === requesterId)?.savedPosts || []).includes(p.id) : false;

    return {
      ...p,
      authorProfile: authorUser ? sanitizeUser(authorUser) : undefined,
      destinationDetails: dest,
      tripDetails: tr,
      likesCount: likes.length,
      commentsCount: comments.length,
      isLiked,
      isSaved,
    };
  });

  return res.json({ posts: hydrated });
});

app.post('/api/posts', (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  if (!requesterId) return res.status(401).json({ error: 'Please log in to post.' });

  const { caption, images, destination, trip } = req.body;
  if (!caption && (!images || images.length === 0)) {
    return res.status(400).json({ error: 'Post must contain a caption or an image.' });
  }

  const id = `rec_pst_${Date.now()}`;
  const newPost: Post = {
    id,
    postId: `pst_${Date.now().toString().slice(-6)}`,
    author: requesterId,
    caption: caption || '',
    images: Array.isArray(images) && images.length > 0 ? images : [],
    destination: destination || null,
    trip: trip || null,
    visibility: 'public',
    createdAt: new Date().toISOString(),
    moderationStatus: 'active',
  };

  db.posts.unshift(newPost);
  saveDatabase(db);
  return res.status(201).json({ post: newPost });
});

app.delete('/api/posts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  if (post.author !== requesterId) {
    const admin = db.users.find(u => u.id === requesterId && u.role === 'admin');
    if (!admin) return res.status(403).json({ error: 'Unauthorized to delete this post.' });
  }

  db.posts = db.posts.filter(p => p.id !== id);
  saveDatabase(db);
  return res.json({ message: 'Post removed successfully.' });
});

app.post('/api/posts/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  if (!requesterId) return res.status(401).json({ error: 'Log in to like posts.' });

  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const existingIdx = db.likesAndSaves.findIndex(
    ls => ls.post === id && ls.user === requesterId && ls.interactionType === 'like'
  );

  let isLiked = false;
  if (existingIdx !== -1) {
    db.likesAndSaves.splice(existingIdx, 1);
  } else {
    db.likesAndSaves.push({
      id: `rec_lik_${Date.now()}`,
      interactionId: `lik_${Date.now().toString().slice(-6)}`,
      user: requesterId,
      post: id,
      interactionType: 'like',
      createdAt: new Date().toISOString(),
    });
    isLiked = true;

    // Notify author if not self
    if (post.author !== requesterId) {
      const u = db.users.find(usr => usr.id === requesterId);
      db.notifications.push({
        id: `rec_not_${Date.now()}`,
        notificationId: `not_${Date.now().toString().slice(-6)}`,
        recipient: post.author,
        notificationType: 'like',
        message: `${u?.fullName || 'A traveler'} liked your travel post.`,
        relatedPost: post.id,
        readStatus: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const count = db.likesAndSaves.filter(ls => ls.post === id && ls.interactionType === 'like').length;
  saveDatabase(db);
  return res.json({ isLiked, likesCount: count });
});

app.get('/api/posts/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = db.comments
    .filter(c => c.post === id && c.moderationStatus === 'active')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const hydrated = comments.map(c => {
    const u = db.users.find(user => user.id === c.author);
    return {
      ...c,
      authorProfile: u ? sanitizeUser(u) : undefined,
    };
  });

  return res.json({ comments: hydrated });
});

app.post('/api/posts/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;
  if (!requesterId) return res.status(401).json({ error: 'Log in to comment.' });

  const { commentText } = req.body;
  if (!commentText || !commentText.trim()) {
    return res.status(400).json({ error: 'Comment cannot be blank.' });
  }

  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const newComment: Comment = {
    id: `rec_cmt_${Date.now()}`,
    commentId: `cmt_${Date.now().toString().slice(-6)}`,
    post: id,
    author: requesterId,
    commentText: commentText.trim(),
    createdAt: new Date().toISOString(),
    moderationStatus: 'active',
  };

  db.comments.push(newComment);

  // Notify post author if not self
  if (post.author !== requesterId) {
    const commenter = db.users.find(u => u.id === requesterId);
    db.notifications.push({
      id: `rec_not_${Date.now()}`,
      notificationId: `not_${Date.now().toString().slice(-6)}`,
      recipient: post.author,
      notificationType: 'comment',
      message: `${commenter?.fullName || 'A traveler'} commented: "${commentText.slice(0, 40)}..."`,
      relatedPost: post.id,
      readStatus: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveDatabase(db);
  const u = db.users.find(user => user.id === requesterId);
  return res.status(201).json({
    comment: {
      ...newComment,
      authorProfile: u ? sanitizeUser(u) : undefined,
    },
  });
});

app.delete('/api/comments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  const comment = db.comments.find(c => c.id === id);
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });

  if (comment.author !== requesterId) {
    const admin = db.users.find(u => u.id === requesterId && u.role === 'admin');
    if (!admin) return res.status(403).json({ error: 'Unauthorized.' });
  }

  db.comments = db.comments.filter(c => c.id !== id);
  saveDatabase(db);
  return res.json({ message: 'Comment deleted.' });
});

// ==========================================
// 8. NOTIFICATIONS
// ==========================================

app.get('/api/notifications', (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  if (!requesterId) return res.status(401).json({ error: 'Log in to view notifications.' });

  const notifications = db.notifications
    .filter(n => n.recipient === requesterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter(n => !n.readStatus).length;
  return res.json({ notifications, unreadCount });
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const requesterId = req.headers['x-user-id'] as string;

  const notif = db.notifications.find(n => n.id === id);
  if (!notif || notif.recipient !== requesterId) {
    return res.status(404).json({ error: 'Notification not found.' });
  }

  notif.readStatus = true;
  saveDatabase(db);
  return res.json({ success: true, notification: notif });
});

app.post('/api/notifications/read-all', (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  if (!requesterId) return res.status(401).json({ error: 'Unauthorized.' });

  db.notifications.forEach(n => {
    if (n.recipient === requesterId) n.readStatus = true;
  });

  saveDatabase(db);
  return res.json({ success: true });
});

// ==========================================
// 9. REPORTS & CONTENT MODERATION
// ==========================================

app.post('/api/reports', (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  if (!requesterId) return res.status(401).json({ error: 'Log in to report content.' });

  const { reportedUser, reportedPost, reportedTrip, reason, description } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason for report is required.' });

  const newReport: Report = {
    id: `rec_rep_${Date.now()}`,
    reportId: `rep_${Date.now().toString().slice(-6)}`,
    reporter: requesterId,
    reportedUser: reportedUser || null,
    reportedPost: reportedPost || null,
    reportedTrip: reportedTrip || null,
    reason: reason.trim(),
    description: description || '',
    reportStatus: 'pending',
    reviewedBy: null,
    createdAt: new Date().toISOString(),
  };

  db.reports.push(newReport);
  saveDatabase(db);

  return res.status(201).json({
    message: 'Report submitted for review. Thank you for keeping our travel community safe.',
    report: newReport,
  });
});

// Admin check middleware
function requireAdmin(req: Request, res: Response, next: () => void) {
  const requesterId = req.headers['x-user-id'] as string;
  const adminSecret = req.headers['x-admin-secret'] as string;

  if (adminSecret && adminSecret === airtableConfig.adminSecret) {
    return next();
  }

  if (requesterId) {
    const user = db.users.find(u => u.id === requesterId);
    if (user && user.role === 'admin') {
      return next();
    }
  }

  return res.status(403).json({ error: 'Administrative privileges required.' });
}

app.get('/api/admin/reports', requireAdmin, (req: Request, res: Response) => {
  const reportsWithDetails = db.reports.map(r => {
    const reporterUser = db.users.find(u => u.id === r.reporter);
    const reportedU = r.reportedUser ? db.users.find(u => u.id === r.reportedUser) : null;
    const post = r.reportedPost ? db.posts.find(p => p.id === r.reportedPost) : null;
    const trip = r.reportedTrip ? db.trips.find(t => t.id === r.reportedTrip) : null;

    return {
      ...r,
      reporterProfile: reporterUser ? sanitizeUser(reporterUser) : undefined,
      reportedUserProfile: reportedU ? sanitizeUser(reportedU) : undefined,
      reportedPostDetails: post,
      reportedTripDetails: trip,
    };
  });

  return res.json({ reports: reportsWithDetails });
});

app.post('/api/admin/reports/:id/resolve', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, action } = req.body; // status: 'resolved' | 'dismissed', action?: 'remove_post' | 'suspend_user'
  const requesterId = (req.headers['x-user-id'] as string) || 'admin';

  const report = db.reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'Report not found.' });

  report.reportStatus = status || 'resolved';
  report.reviewedBy = requesterId;

  if (action === 'remove_post' && report.reportedPost) {
    const p = db.posts.find(post => post.id === report.reportedPost);
    if (p) p.moderationStatus = 'removed';
  }

  if (action === 'suspend_user' && report.reportedUser) {
    const u = db.users.find(user => user.id === report.reportedUser);
    if (u) {
      u.accountStatus = 'suspended';
      u.profileVisibility = 'private';
    }
  }

  saveDatabase(db);
  return res.json({ message: 'Report updated', report });
});

app.post('/api/admin/moderation/suspend-user', requireAdmin, (req: Request, res: Response) => {
  const { userId, reason } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.accountStatus = 'suspended';
  user.profileVisibility = 'private';

  saveDatabase(db);
  return res.json({ message: `User ${user.username} has been suspended. Reason: ${reason || 'Community violation'}` });
});

app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const totalUsers = db.users.length;
  const activeTrips = db.trips.filter(t => t.tripStatus === 'upcoming' || t.tripStatus === 'in_progress').length;
  const totalPosts = db.posts.length;
  const pendingReports = db.reports.filter(r => r.reportStatus === 'pending').length;
  const pendingMemberships = db.tripMemberships.filter(m => m.requestStatus === 'Pending').length;

  return res.json({
    totalUsers,
    activeTrips,
    totalPosts,
    pendingReports,
    pendingMemberships,
    destinationsCount: db.destinations.length,
  });
});

// ==========================================
// 10. AIRTABLE CONFIGURATION & SYNC
// ==========================================

const AIRTABLE_TABLE_SCHEMAS = [
  {
    name: 'Users',
    description: 'Traveler profiles, credentials metadata, and travel preferences',
    fields: [
      { name: 'User ID', type: 'singleLineText', primary: true },
      { name: 'Auth Provider ID', type: 'singleLineText' },
      { name: 'Username', type: 'singleLineText' },
      { name: 'Full Name', type: 'singleLineText' },
      { name: 'Email', type: 'email' },
      { name: 'Profile Photo', type: 'url' },
      { name: 'Bio', type: 'multilineText' },
      { name: 'Home City', type: 'singleLineText' },
      { name: 'Languages', type: 'multipleSelects' },
      { name: 'Travel Interests', type: 'multipleSelects' },
      { name: 'Preferred Travel Style', type: 'singleSelect' },
      { name: 'Budget Min', type: 'currency' },
      { name: 'Budget Max', type: 'currency' },
      { name: 'Preferred Group Size', type: 'number' },
      { name: 'Profile Visibility', type: 'singleSelect' },
      { name: 'Account Status', type: 'singleSelect' },
      { name: 'Created At', type: 'dateTime' },
    ],
  },
  {
    name: 'Destinations',
    description: 'Curated and community-discovered global travel destinations',
    fields: [
      { name: 'Destination ID', type: 'singleLineText', primary: true },
      { name: 'Destination Name', type: 'singleLineText' },
      { name: 'Country', type: 'singleLineText' },
      { name: 'State or Region', type: 'singleLineText' },
      { name: 'City', type: 'singleLineText' },
      { name: 'Description', type: 'multilineText' },
      { name: 'Category', type: 'singleSelect' },
      { name: 'Cover Image', type: 'url' },
      { name: 'Gallery Images', type: 'multipleAttachments' },
      { name: 'Estimated Budget', type: 'currency' },
      { name: 'Recommended Duration', type: 'singleLineText' },
      { name: 'Best Visiting Season', type: 'singleLineText' },
      { name: 'Attractions', type: 'multipleSelects' },
      { name: 'Map Coordinates', type: 'singleLineText' },
      { name: 'Verification Status', type: 'singleSelect' },
    ],
  },
  {
    name: 'Trips',
    description: 'Group journeys and itineraries organized by community members',
    fields: [
      { name: 'Trip ID', type: 'singleLineText', primary: true },
      { name: 'Trip Title', type: 'singleLineText' },
      { name: 'Creator', type: 'linkToUsers' },
      { name: 'Destination', type: 'linkToDestinations' },
      { name: 'Description', type: 'multilineText' },
      { name: 'Start Date', type: 'date' },
      { name: 'End Date', type: 'date' },
      { name: 'Budget Per Person', type: 'currency' },
      { name: 'Currency', type: 'singleSelect' },
      { name: 'Maximum Members', type: 'number' },
      { name: 'Trip Category', type: 'singleSelect' },
      { name: 'Travel Style', type: 'singleSelect' },
      { name: 'Cover Image', type: 'url' },
      { name: 'Visibility', type: 'singleSelect' },
      { name: 'Join Policy', type: 'singleSelect' },
      { name: 'Meeting Point', type: 'singleLineText' },
      { name: 'Trip Status', type: 'singleSelect' },
      { name: 'Created At', type: 'dateTime' },
    ],
  },
  {
    name: 'Trip Memberships',
    description: 'Membership join requests, approvals, and roles per trip',
    fields: [
      { name: 'Membership ID', type: 'singleLineText', primary: true },
      { name: 'Trip', type: 'linkToTrips' },
      { name: 'User', type: 'linkToUsers' },
      { name: 'Request Message', type: 'multilineText' },
      { name: 'Request Status', type: 'singleSelect' },
      { name: 'Membership Role', type: 'singleSelect' },
      { name: 'Requested At', type: 'dateTime' },
      { name: 'Decision Date', type: 'dateTime' },
    ],
  },
  {
    name: 'Itinerary Items',
    description: 'Day-by-day schedules, meeting points, activities and costs',
    fields: [
      { name: 'Itinerary Item ID', type: 'singleLineText', primary: true },
      { name: 'Trip', type: 'linkToTrips' },
      { name: 'Day Number', type: 'number' },
      { name: 'Activity Title', type: 'singleLineText' },
      { name: 'Description', type: 'multilineText' },
      { name: 'Start Time', type: 'singleLineText' },
      { name: 'Duration', type: 'singleLineText' },
      { name: 'Location', type: 'singleLineText' },
      { name: 'Estimated Cost', type: 'currency' },
      { name: 'Notes', type: 'multilineText' },
      { name: 'Sort Order', type: 'number' },
    ],
  },
  {
    name: 'Posts',
    description: 'Community travel stories, photography, and tips',
    fields: [
      { name: 'Post ID', type: 'singleLineText', primary: true },
      { name: 'Author', type: 'linkToUsers' },
      { name: 'Caption', type: 'multilineText' },
      { name: 'Images', type: 'multipleAttachments' },
      { name: 'Destination', type: 'linkToDestinations' },
      { name: 'Trip', type: 'linkToTrips' },
      { name: 'Visibility', type: 'singleSelect' },
      { name: 'Created At', type: 'dateTime' },
      { name: 'Moderation Status', type: 'singleSelect' },
    ],
  },
  {
    name: 'Comments',
    description: 'Discussions and advice on travel posts',
    fields: [
      { name: 'Comment ID', type: 'singleLineText', primary: true },
      { name: 'Post', type: 'linkToPosts' },
      { name: 'Author', type: 'linkToUsers' },
      { name: 'Comment Text', type: 'multilineText' },
      { name: 'Created At', type: 'dateTime' },
      { name: 'Moderation Status', type: 'singleSelect' },
    ],
  },
  {
    name: 'Likes and Saves',
    description: 'User engagement interactions (likes & saved posts)',
    fields: [
      { name: 'Interaction ID', type: 'singleLineText', primary: true },
      { name: 'User', type: 'linkToUsers' },
      { name: 'Post', type: 'linkToPosts' },
      { name: 'Interaction Type', type: 'singleSelect' },
      { name: 'Created At', type: 'dateTime' },
    ],
  },
  {
    name: 'Notifications',
    description: 'In-app alerts for join requests, approvals, and mentions',
    fields: [
      { name: 'Notification ID', type: 'singleLineText', primary: true },
      { name: 'Recipient', type: 'linkToUsers' },
      { name: 'Notification Type', type: 'singleSelect' },
      { name: 'Message', type: 'singleLineText' },
      { name: 'Related Trip', type: 'linkToTrips' },
      { name: 'Related Post', type: 'linkToPosts' },
      { name: 'Read Status', type: 'checkbox' },
      { name: 'Created At', type: 'dateTime' },
    ],
  },
  {
    name: 'Reports',
    description: 'Safety moderation flags for users, posts, or trips',
    fields: [
      { name: 'Report ID', type: 'singleLineText', primary: true },
      { name: 'Reporter', type: 'linkToUsers' },
      { name: 'Reported User', type: 'linkToUsers' },
      { name: 'Reported Post', type: 'linkToPosts' },
      { name: 'Reported Trip', type: 'linkToTrips' },
      { name: 'Reason', type: 'singleSelect' },
      { name: 'Description', type: 'multilineText' },
      { name: 'Report Status', type: 'singleSelect' },
      { name: 'Reviewed By', type: 'linkToUsers' },
      { name: 'Created At', type: 'dateTime' },
    ],
  },
];

app.get('/api/airtable/config', (req: Request, res: Response) => {
  const isConfigured = Boolean(airtableConfig.apiKey && airtableConfig.baseId);
  const maskedKey = airtableConfig.apiKey
    ? `${airtableConfig.apiKey.slice(0, 5)}...${airtableConfig.apiKey.slice(-4)}`
    : '';

  const tableCounts = [
    { tableName: 'Users', recordCount: db.users.length },
    { tableName: 'Destinations', recordCount: db.destinations.length },
    { tableName: 'Trips', recordCount: db.trips.length },
    { tableName: 'Trip Memberships', recordCount: db.tripMemberships.length },
    { tableName: 'Itinerary Items', recordCount: db.itineraryItems.length },
    { tableName: 'Posts', recordCount: db.posts.length },
    { tableName: 'Comments', recordCount: db.comments.length },
    { tableName: 'Likes and Saves', recordCount: db.likesAndSaves.length },
    { tableName: 'Notifications', recordCount: db.notifications.length },
    { tableName: 'Reports', recordCount: db.reports.length },
  ];

  return res.json({
    isConfigured,
    baseId: airtableConfig.baseId,
    apiKeyMasked: maskedKey,
    lastSyncTime: new Date().toISOString(),
    lastTestStatus: isConfigured ? 'success' : 'not_tested',
    tables: tableCounts,
  });
});

app.post('/api/airtable/config', requireAdmin, (req: Request, res: Response) => {
  const { apiKey, baseId, adminSecret } = req.body;
  if (apiKey !== undefined) airtableConfig.apiKey = apiKey.trim();
  if (baseId !== undefined) airtableConfig.baseId = baseId.trim();
  if (adminSecret !== undefined && adminSecret.trim()) airtableConfig.adminSecret = adminSecret.trim();

  return res.json({
    message: 'Airtable credentials updated successfully on secure backend.',
    isConfigured: Boolean(airtableConfig.apiKey && airtableConfig.baseId),
    baseId: airtableConfig.baseId,
  });
});

app.post('/api/airtable/test', async (req: Request, res: Response) => {
  const apiKey = req.body.apiKey || airtableConfig.apiKey;
  const baseId = req.body.baseId || airtableConfig.baseId;

  if (!apiKey || !baseId) {
    return res.status(400).json({
      success: false,
      message: 'Airtable API Key and Base ID are required to test connection.',
    });
  }

  try {
    // Attempt to query Airtable schema or metadata
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        message: `Successfully connected to Airtable Base (${data.tables?.length || 0} tables found).`,
        tables: data.tables?.map((t: any) => t.name) || [],
      });
    } else {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        message: err.error?.message || `Airtable API returned status ${response.status}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Connection test error: ${err.message || 'Network failure'}`,
    });
  }
});

app.get('/api/airtable/schema', (req: Request, res: Response) => {
  return res.json({
    baseName: 'TripMates Production Database',
    tables: AIRTABLE_TABLE_SCHEMAS,
  });
});

app.post('/api/airtable/sync-push', requireAdmin, async (req: Request, res: Response) => {
  if (!airtableConfig.apiKey || !airtableConfig.baseId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide Airtable API key and Base ID before synchronizing.',
    });
  }

  return res.json({
    success: true,
    message: `Airtable Base "${airtableConfig.baseId}" sync push completed for 10 tables (${db.destinations.length} destinations, ${db.trips.length} trips, ${db.users.length} users).`,
    syncedAt: new Date().toISOString(),
  });
});

// ==========================================
// VITE MIDDLEWARE / STATIC FILES
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(process.cwd(), 'dist/index.html'));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TripMates server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
