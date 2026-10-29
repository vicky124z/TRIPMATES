import React, { useState, useEffect } from 'react';
import { User, Trip, Post, Destination } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  MapPin,
  Languages,
  DollarSign,
  Users,
  Compass,
  Edit3,
  Calendar,
  MessageSquare,
  Heart,
  Trash2,
  Check,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfileViewProps {
  targetUserId?: string | null;
  destinations: Destination[];
  onSelectTrip: (trip: Trip) => void;
  onSelectDestination: (dest: Destination) => void;
  openReportModal: (item: { reportedUser: string }) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  targetUserId,
  destinations,
  onSelectTrip,
  onSelectDestination,
  openReportModal,
}) => {
  const { user: currentUser, updateUser, logout } = useAuth();
  const [profileData, setProfileData] = useState<{
    user: User;
    posts: Post[];
    trips: Trip[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'posts' | 'saved'>('trips');
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeId = targetUserId || currentUser?.id;
  const isOwner = currentUser?.id === activeId;

  const loadProfile = async () => {
    if (!activeId) return;
    try {
      const res = await api.getUserProfile(activeId);
      setProfileData({
        user: res.user,
        posts: res.posts,
        trips: res.trips,
      });
      setEditForm(res.user);
    } catch {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [activeId]);

  if (loading || !profileData) {
    return (
      <div className="text-center py-24 text-xs text-[#8A9790]">
        Loading traveler profile...
      </div>
    );
  }

  const { user: profileUser, posts, trips } = profileData;
  const savedDestinationsList = destinations.filter(d =>
    (profileUser.savedDestinations || []).includes(d.id)
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(editForm);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEditModal(false);
      }, 800);
      await loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to request account deletion? All personal data and preferences will be permanently scrubbed.')) {
      return;
    }
    try {
      await api.deleteAccount(profileUser.id);
      logout();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E3D8] shadow-sm">
        {/* Banner */}
        <div className="h-36 sm:h-48 bg-gradient-to-r from-[#174D3C] via-[#27866A] to-[#1F644E] relative" />

        {/* Profile Info */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <img
                src={profileUser.profilePhoto}
                alt={profileUser.fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
              <div className="mb-1">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-[#202824]">
                  {profileUser.fullName}
                </h1>
                <div className="text-xs text-[#8A9790]">
                  @{profileUser.username} · Member since {new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-end">
              {isOwner ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#F8F7F2] hover:bg-[#EFECE3] border border-[#E5E3D8] text-[#174D3C] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => openReportModal({ reportedUser: profileUser.id })}
                  className="p-2 text-[#8A9790] hover:text-red-600 rounded-lg border border-[#E5E3D8] cursor-pointer"
                  title="Report user"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#5E6963] leading-relaxed max-w-2xl">
            {profileUser.bio}
          </p>

          {/* Quick Stats & Badges */}
          <div className="mt-6 pt-4 border-t border-[#EFECE3] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#8A9790] block text-[11px]">Home City</span>
              <span className="font-semibold text-[#202824] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#27866A]" />
                <span>{profileUser.homeCity}</span>
              </span>
            </div>

            <div>
              <span className="text-[#8A9790] block text-[11px]">Travel Style</span>
              <span className="font-semibold text-[#174D3C] mt-0.5 block">
                {profileUser.preferredTravelStyle}
              </span>
            </div>

            <div>
              <span className="text-[#8A9790] block text-[11px]">Budget Compatibility</span>
              <span className="font-semibold text-[#174D3C] font-mono tabular-nums mt-0.5 block">
                ${profileUser.budgetMin}–${profileUser.budgetMax}
              </span>
            </div>

            <div>
              <span className="text-[#8A9790] block text-[11px]">Languages</span>
              <span className="font-semibold text-[#202824] mt-0.5 block truncate">
                {profileUser.languages.join(', ')}
              </span>
            </div>
          </div>

          {/* Travel Interests unboxed text */}
          <div className="mt-4 pt-3 border-t border-[#EFECE3] text-xs">
            <span className="text-[11px] text-[#8A9790] font-medium mr-2">Passions:</span>
            <span className="text-[#5E6963]">
              {profileUser.travelInterests.join(' · ')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-[#E5E3D8] pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('trips')}
          className={`pb-2.5 transition-colors cursor-pointer relative ${
            activeTab === 'trips' ? 'text-[#174D3C] font-bold' : 'text-[#8A9790] hover:text-[#5E6963]'
          }`}
        >
          Organized Trips ({trips.length})
          {activeTab === 'trips' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174D3C] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-2.5 transition-colors cursor-pointer relative ${
            activeTab === 'posts' ? 'text-[#174D3C] font-bold' : 'text-[#8A9790] hover:text-[#5E6963]'
          }`}
        >
          Travel Stories ({posts.length})
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174D3C] rounded-full" />
          )}
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeTab === 'saved' ? 'text-[#174D3C] font-bold' : 'text-[#8A9790] hover:text-[#5E6963]'
            }`}
          >
            Saved Wishlist ({savedDestinationsList.length})
            {activeTab === 'saved' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174D3C] rounded-full" />
            )}
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'trips' && (
        <div className="space-y-4">
          {trips.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E5E3D8] text-center text-xs text-[#8A9790]">
              No active group trips organized yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trips.map(tr => (
                <div
                  key={tr.id}
                  onClick={() => onSelectTrip(tr)}
                  className="bg-white p-4 rounded-xl border border-[#E5E3D8] hover:border-[#27866A] shadow-xs hover:shadow-sm transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-[#5E6963]">
                    <span>{tr.tripCategory}</span>
                    <span className="font-mono tabular-nums font-semibold text-[#174D3C]">
                      ${tr.budgetPerPerson} {tr.currency}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#202824] leading-snug">
                    {tr.tripTitle}
                  </h3>
                  <div className="text-[11px] text-[#8A9790]">
                    {tr.startDate} to {tr.endDate} · Max {tr.maximumMembers} members
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E5E3D8] text-center text-xs text-[#8A9790]">
              No travel stories posted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="bg-white p-5 rounded-xl border border-[#E5E3D8] shadow-xs space-y-3"
                >
                  <div className="text-xs text-[#8A9790]">
                    Posted on {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                  <p className="text-xs sm:text-sm text-[#202824] leading-relaxed">
                    {post.caption}
                  </p>
                  {post.images && post.images.length > 0 && (
                    <div className="aspect-[16/9] rounded-lg overflow-hidden bg-[#EFECE3]">
                      <img
                        src={post.images[0]}
                        alt="Story moment"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && isOwner && (
        <div className="space-y-4">
          {savedDestinationsList.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E5E3D8] text-center text-xs text-[#8A9790]">
              Your wishlist is empty. Tap the heart icon on any destination to save it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {savedDestinationsList.map(dest => (
                <div
                  key={dest.id}
                  onClick={() => onSelectDestination(dest)}
                  className="bg-white rounded-xl overflow-hidden border border-[#E5E3D8] hover:border-[#27866A] shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#EFECE3]">
                    <img
                      src={dest.coverImage}
                      alt={dest.destinationName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-xs text-[#202824] truncate">
                      {dest.destinationName}
                    </h4>
                    <div className="text-[11px] text-[#8A9790] mt-0.5">
                      {dest.city}, {dest.country} · ${dest.estimatedBudget}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account Deletion Area (Owner Only) */}
      {isOwner && (
        <div className="p-4 bg-white border border-red-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-red-800">Account & Privacy Management</div>
            <div className="text-[#8A9790] mt-0.5">
              Request immediate deletion of all personal data, memberships, and profile details.
            </div>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="px-3 py-1.5 text-xs text-red-600 border border-red-300 hover:bg-red-50 rounded-lg cursor-pointer"
          >
            Delete Account
          </button>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E5E3D8] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E3D8]">
              <h3 className="font-bold font-display text-base text-[#174D3C]">
                Edit Traveler Profile
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#8A9790] hover:text-[#202824] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.fullName || ''}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                  Home City
                </label>
                <input
                  type="text"
                  value={editForm.homeCity || ''}
                  onChange={e => setEditForm({ ...editForm, homeCity: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                  Short Bio
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio || ''}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                    Travel Style
                  </label>
                  <select
                    value={editForm.preferredTravelStyle || 'Mid-range'}
                    onChange={e => setEditForm({ ...editForm, preferredTravelStyle: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                  >
                    <option value="Backpacker">Backpacker</option>
                    <option value="Mid-range">Mid-range</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                    Profile Visibility
                  </label>
                  <select
                    value={editForm.profileVisibility || 'public'}
                    onChange={e => setEditForm({ ...editForm, profileVisibility: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                  >
                    <option value="public">Public (Visible in Buddy search)</option>
                    <option value="private">Private (Restricted)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                    Min Budget ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.budgetMin || 500}
                    onChange={e => setEditForm({ ...editForm, budgetMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#174D3C] block mb-1">
                    Max Budget ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.budgetMax || 2500}
                    onChange={e => setEditForm({ ...editForm, budgetMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E3D8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-[#F8F7F2] hover:bg-[#EFECE3] rounded-lg text-[#5E6963] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#174D3C] hover:bg-[#1F644E] text-white rounded-lg font-semibold cursor-pointer"
                >
                  {saveSuccess ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
