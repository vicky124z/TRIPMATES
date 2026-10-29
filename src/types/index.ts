/**
 * TripMates — Data Types & Airtable Schema Interfaces
 */

export interface User {
  id: string; // rec_...
  userId: string;
  authProviderId: string;
  username: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  profilePhoto: string;
  bio: string;
  homeCity: string;
  languages: string[];
  travelInterests: string[];
  preferredTravelStyle: string;
  budgetMin: number;
  budgetMax: number;
  preferredGroupSize: number;
  profileVisibility: 'public' | 'private';
  accountStatus: 'active' | 'suspended';
  savedDestinations: string[];
  savedPosts: string[];
  createdAt: string;
}

export type DestinationCategory =
  | 'Mountains'
  | 'Beaches'
  | 'Heritage'
  | 'Adventure'
  | 'Food'
  | 'Weekend Getaways';

export interface Destination {
  id: string; // rec_...
  destinationId: string;
  destinationName: string;
  country: string;
  stateOrRegion: string;
  city: string;
  description: string;
  category: DestinationCategory;
  coverImage: string;
  galleryImages: string[];
  estimatedBudget: number;
  recommendedDuration: string;
  bestVisitingSeason: string;
  attractions: string[];
  mapCoordinates: {
    lat: number;
    lng: number;
  };
  verificationStatus: 'verified' | 'community';
}

export type TripStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type TripJoinPolicy = 'request' | 'open' | 'invite';

export interface Trip {
  id: string; // rec_...
  tripId: string;
  tripTitle: string;
  creator: string; // User ID / rec_...
  creatorProfile?: Partial<User>;
  destination: string; // Destination ID / rec_...
  destinationDetails?: Partial<Destination>;
  description: string;
  startDate: string;
  endDate: string;
  budgetPerPerson: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD';
  maximumMembers: number;
  tripCategory: string;
  travelStyle: string;
  coverImage: string;
  visibility: 'public' | 'private';
  joinPolicy: TripJoinPolicy;
  meetingPoint: string;
  tripStatus: TripStatus;
  createdAt: string;
  approvedCount?: number;
  memberProfiles?: Partial<User>[];
}

export type MembershipStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Withdrawn'
  | 'Cancelled';

export interface TripMembership {
  id: string; // rec_...
  membershipId: string;
  trip: string; // Trip ID
  user: string; // User ID
  userProfile?: Partial<User>;
  tripTitle?: string;
  requestMessage: string;
  requestStatus: MembershipStatus;
  membershipRole: 'creator' | 'member' | 'co_host';
  requestedAt: string;
  decisionDate: string | null;
}

export interface ItineraryItem {
  id: string; // rec_...
  itineraryItemId: string;
  trip: string; // Trip ID
  dayNumber: number;
  activityTitle: string;
  description: string;
  startTime: string;
  duration: string;
  location: string;
  estimatedCost: number;
  notes: string;
  sortOrder: number;
}

export interface Post {
  id: string; // rec_...
  postId: string;
  author: string; // User ID
  authorProfile?: Partial<User>;
  caption: string;
  images: string[];
  destination?: string | null;
  destinationDetails?: Partial<Destination>;
  trip?: string | null;
  tripDetails?: Partial<Trip>;
  visibility: 'public' | 'private';
  createdAt: string;
  moderationStatus: 'active' | 'flagged' | 'removed';
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Comment {
  id: string; // rec_...
  commentId: string;
  post: string; // Post ID
  author: string; // User ID
  authorProfile?: Partial<User>;
  commentText: string;
  createdAt: string;
  moderationStatus: 'active' | 'flagged' | 'removed';
}

export interface LikeSave {
  id: string; // rec_...
  interactionId: string;
  user: string;
  post: string;
  interactionType: 'like' | 'save';
  createdAt: string;
}

export type NotificationType =
  | 'join_request'
  | 'membership_approved'
  | 'membership_rejected'
  | 'comment'
  | 'like'
  | 'trip_update'
  | 'trip_reminder'
  | 'moderation_alert';

export interface Notification {
  id: string; // rec_...
  notificationId: string;
  recipient: string; // User ID
  notificationType: NotificationType;
  message: string;
  relatedTrip?: string | null;
  relatedPost?: string | null;
  readStatus: boolean;
  createdAt: string;
}

export interface Report {
  id: string; // rec_...
  reportId: string;
  reporter: string; // User ID
  reporterProfile?: Partial<User>;
  reportedUser?: string | null;
  reportedPost?: string | null;
  reportedTrip?: string | null;
  reason: string;
  description: string;
  reportStatus: 'pending' | 'resolved' | 'dismissed';
  reviewedBy?: string | null;
  createdAt: string;
}

export interface AirtableConfigStatus {
  isConfigured: boolean;
  baseId: string;
  apiKeyMasked: string;
  lastSyncTime: string | null;
  lastTestStatus: 'success' | 'failed' | 'not_tested';
  testMessage?: string;
  tables: {
    tableName: string;
    recordCount: number;
  }[];
}
