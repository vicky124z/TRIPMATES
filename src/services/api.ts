import {
  User,
  Destination,
  Trip,
  TripMembership,
  ItineraryItem,
  Post,
  Comment,
  Notification,
  Report,
  AirtableConfigStatus,
} from '../types/index.ts';

const API_BASE = '/api';

function getHeaders(userId?: string, adminSecret?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const activeUserId = userId || localStorage.getItem('tripmates_user_id');
  if (activeUserId) {
    headers['x-user-id'] = activeUserId;
  }
  const secret = adminSecret || localStorage.getItem('tripmates_admin_secret');
  if (secret) {
    headers['x-admin-secret'] = secret;
  }
  return headers;
}

export const api = {
  // Auth
  async getMe(userId?: string): Promise<{ user: User; isDemo: boolean }> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders(userId) });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async login(identifier: string, password: string):Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(userData: Partial<User> & { password: string }): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async resetPassword(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset request failed');
    return data;
  },

  // Users
  async getUsers(params?: {
    style?: string;
    interest?: string;
    language?: string;
    search?: string;
    maxBudget?: number;
  }): Promise<{ users: User[] }> {
    const query = new URLSearchParams();
    if (params?.style) query.set('style', params.style);
    if (params?.interest) query.set('interest', params.interest);
    if (params?.language) query.set('language', params.language);
    if (params?.search) query.set('search', params.search);
    if (params?.maxBudget) query.set('maxBudget', String(params.maxBudget));

    const res = await fetch(`${API_BASE}/users?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch travelers');
    return res.json();
  },

  async getUserProfile(id: string): Promise<{
    user: User;
    posts: Post[];
    trips: Trip[];
    memberships: TripMembership[];
  }> {
    const res = await fetch(`${API_BASE}/users/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async toggleWishlist(userId: string, destinationId: string): Promise<{ savedDestinations: string[]; isSaved: boolean }> {
    const res = await fetch(`${API_BASE}/users/${userId}/wishlist`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ destinationId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update wishlist');
    return data;
  },

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(userId),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete account');
    return data;
  },

  // Destinations
  async getDestinations(params?: {
    category?: string;
    search?: string;
    country?: string;
    maxBudget?: number;
  }): Promise<{ destinations: Destination[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.country) query.set('country', params.country);
    if (params?.maxBudget) query.set('maxBudget', String(params.maxBudget));

    const res = await fetch(`${API_BASE}/destinations?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch destinations');
    return res.json();
  },

  async getDestinationDetails(id: string): Promise<{
    destination: Destination;
    relatedTrips: Trip[];
    interestedUsers: User[];
  }> {
    const res = await fetch(`${API_BASE}/destinations/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch destination details');
    return res.json();
  },

  async createDestination(destData: Partial<Destination>): Promise<{ destination: Destination }> {
    const res = await fetch(`${API_BASE}/destinations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(destData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create destination');
    return data;
  },

  // Trips
  async getTrips(params?: {
    destination?: string;
    category?: string;
    style?: string;
    minBudget?: number;
    maxBudget?: number;
    search?: string;
    status?: string;
  }): Promise<{ trips: Trip[] }> {
    const query = new URLSearchParams();
    if (params?.destination) query.set('destination', params.destination);
    if (params?.category) query.set('category', params.category);
    if (params?.style) query.set('style', params.style);
    if (params?.minBudget) query.set('minBudget', String(params.minBudget));
    if (params?.maxBudget) query.set('maxBudget', String(params.maxBudget));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/trips?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch trips');
    return res.json();
  },

  async getTripDetails(id: string): Promise<{
    trip: Trip;
    memberships: TripMembership[];
    memberProfiles: (User & { membershipRole: string })[];
    itinerary: ItineraryItem[];
  }> {
    const res = await fetch(`${API_BASE}/trips/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch trip details');
    return res.json();
  },

  async createTrip(tripData: Partial<Trip> & { itinerary?: Partial<ItineraryItem>[] }): Promise<{ trip: Trip }> {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(tripData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create trip');
    return data;
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<{ trip: Trip }> {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update trip');
    return data;
  },

  async cancelTrip(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/trips/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel trip');
    return data;
  },

  // Memberships
  async joinTrip(tripId: string, requestMessage: string): Promise<{ message: string; membership: TripMembership }> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ requestMessage }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit join request');
    return data;
  },

  async decideMembership(membershipId: string, decision: 'approve' | 'reject'): Promise<{ message: string; membership: TripMembership }> {
    const res = await fetch(`${API_BASE}/memberships/${membershipId}/decision`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ decision }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update membership decision');
    return data;
  },

  async withdrawMembership(membershipId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/memberships/${membershipId}/withdraw`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to withdraw membership');
    return data;
  },

  // Itinerary
  async addItineraryItem(tripId: string, item: Partial<ItineraryItem>): Promise<{ item: ItineraryItem }> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/itinerary`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add itinerary item');
    return data;
  },

  async deleteItineraryItem(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/itinerary/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete itinerary item');
    return data;
  },

  // Posts & Social Feed
  async getPosts(params?: { destination?: string; trip?: string }): Promise<{ posts: Post[] }> {
    const query = new URLSearchParams();
    if (params?.destination) query.set('destination', params.destination);
    if (params?.trip) query.set('trip', params.trip);

    const res = await fetch(`${API_BASE}/posts?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch feed');
    return res.json();
  },

  async createPost(postData: {
    caption: string;
    images?: string[];
    destination?: string | null;
    trip?: string | null;
  }): Promise<{ post: Post }> {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(postData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish post');
    return data;
  },

  async deletePost(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete post');
    return data;
  },

  async toggleLikePost(postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to like post');
    return data;
  },

  async getComments(postId: string): Promise<{ comments: Comment[] }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load comments');
    return res.json();
  },

  async addComment(postId: string, commentText: string): Promise<{ comment: Comment }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ commentText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add comment');
    return data;
  },

  async deleteComment(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/comments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete comment');
    return data;
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Reports
  async submitReport(report: {
    reportedUser?: string | null;
    reportedPost?: string | null;
    reportedTrip?: string | null;
    reason: string;
    description?: string;
  }): Promise<{ message: string; report: Report }> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(report),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit report');
    return data;
  },

  // Admin
  async getAdminStats(): Promise<{
    totalUsers: number;
    activeTrips: number;
    totalPosts: number;
    pendingReports: number;
    pendingMemberships: number;
    destinationsCount: number;
  }> {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async getAdminReports(): Promise<{ reports: any[] }> {
    const res = await fetch(`${API_BASE}/admin/reports`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch moderation reports');
    return res.json();
  },

  async resolveReport(id: string, status: string, action?: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/reports/${id}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status, action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve report');
    return data;
  },

  async suspendUser(userId: string, reason: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/moderation/suspend-user`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to suspend user');
    return data;
  },

  // Airtable
  async getAirtableConfig(): Promise<AirtableConfigStatus> {
    const res = await fetch(`${API_BASE}/airtable/config`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch Airtable status');
    return res.json();
  },

  async updateAirtableConfig(config: { apiKey?: string; baseId?: string; adminSecret?: string }): Promise<{ message: string; isConfigured: boolean; baseId: string }> {
    const res = await fetch(`${API_BASE}/airtable/config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update Airtable credentials');
    return data;
  },

  async testAirtableConnection(apiKey?: string, baseId?: string): Promise<{ success: boolean; message: string; tables?: string[] }> {
    const res = await fetch(`${API_BASE}/airtable/test`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ apiKey, baseId }),
    });
    return res.json();
  },

  async getAirtableSchema(): Promise<{ baseName: string; tables: any[] }> {
    const res = await fetch(`${API_BASE}/airtable/schema`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch schema');
    return res.json();
  },

  async syncPushAirtable(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/airtable/sync-push`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Sync failed');
    return data;
  },
};
