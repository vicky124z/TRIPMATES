import React, { useState, useEffect } from 'react';
import { Trip, TripMembership, ItineraryItem, User } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  X,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface TripDetailModalProps {
  tripId: string;
  onClose: () => void;
  onTripUpdated?: () => void;
}

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
  tripId,
  onClose,
  onTripUpdated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [memberships, setMemberships] = useState<TripMembership[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<(User & { membershipRole: string })[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);

  // Join request state
  const [joinMessage, setJoinMessage] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add itinerary state
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    dayNumber: 1,
    activityTitle: '',
    description: '',
    startTime: '09:00',
    duration: '2 hours',
    location: '',
    estimatedCost: 20,
    notes: '',
  });

  const loadData = async () => {
    try {
      const data = await api.getTripDetails(tripId);
      setTrip(data.trip);
      setMemberships(data.memberships);
      setMemberProfiles(data.memberProfiles);
      setItinerary(data.itinerary);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load trip.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tripId]);

  if (loading || !trip) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#E5E3D8] text-center text-xs text-[#5E6963]">
          Loading trip details and itinerary...
        </div>
      </div>
    );
  }

  const isCreator = user?.id === trip.creator;
  const currentMembership = memberships.find(m => m.user === user?.id);
  const isApprovedMember = currentMembership?.requestStatus === 'Approved';
  const isPendingMember = currentMembership?.requestStatus === 'Pending';
  const approvedMemberships = memberships.filter(m => m.requestStatus === 'Approved');
  const pendingRequests = memberships.filter(m => m.requestStatus === 'Pending');
  const spotsRemaining = Math.max(0, trip.maximumMembers - approvedMemberships.length);
  const isFull = spotsRemaining === 0;

  // Calculate total estimated expenses from itinerary
  const totalItineraryCost = itinerary.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);

  const handleJoinTrip = async () => {
    if (!user) {
      setStatusMessage({ type: 'error', text: 'Please sign in to join this trip.' });
      return;
    }
    setJoinSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await api.joinTrip(trip.id, joinMessage);
      setStatusMessage({ type: 'success', text: res.message });
      setJoinMessage('');
      await loadData();
      onTripUpdated?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to join trip.' });
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleMembershipDecision = async (membershipId: string, decision: 'approve' | 'reject') => {
    try {
      const res = await api.decideMembership(membershipId, decision);
      setStatusMessage({ type: 'success', text: res.message });
      await loadData();
      onTripUpdated?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update membership.' });
    }
  };

  const handleWithdraw = async (membershipId: string) => {
    try {
      const res = await api.withdrawMembership(membershipId);
      setStatusMessage({ type: 'success', text: res.message });
      await loadData();
      onTripUpdated?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddItineraryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addItineraryItem(trip.id, newActivity);
      setShowAddActivity(false);
      setNewActivity({
        dayNumber: 1,
        activityTitle: '',
        description: '',
        startTime: '09:00',
        duration: '2 hours',
        location: '',
        estimatedCost: 20,
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to add activity.' });
    }
  };

  const handleDeleteItineraryItem = async (itemId: string) => {
    try {
      await api.deleteItineraryItem(itemId);
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleCancelTrip = async () => {
    if (!confirm('Are you sure you want to cancel this entire trip? All confirmed members will be notified.')) {
      return;
    }
    try {
      await api.cancelTrip(trip.id);
      setStatusMessage({ type: 'success', text: 'Trip has been marked as cancelled.' });
      await loadData();
      onTripUpdated?.();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-[#E5E3D8] max-h-[92vh] flex flex-col my-auto">
        
        {/* Header Cover Photo */}
        <div className="relative aspect-[16/7] overflow-hidden bg-[#EFECE3]">
          <img
            src={trip.coverImage}
            alt={trip.tripTitle}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors cursor-pointer"
            aria-label="Close trip details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Title */}
          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E4BD73] uppercase tracking-wider">
              <span>{trip.tripCategory}</span>
              <span aria-hidden="true">·</span>
              <span>{trip.travelStyle}</span>
              <span aria-hidden="true">·</span>
              <span className={trip.tripStatus === 'cancelled' ? 'text-red-400' : 'text-emerald-300'}>
                {trip.tripStatus === 'cancelled' ? 'Trip Cancelled' : 'Active Adventure'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight">
              {trip.tripTitle}
            </h2>
            <div className="text-xs text-white/90 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#E4BD73]" />
                <span>{trip.startDate} to {trip.endDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E4BD73]" />
                <span>Meeting: {trip.meetingPoint}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F8F7F2] rounded-xl border border-[#E5E3D8] text-xs">
            <div>
              <div className="text-[#8A9790]">Budget Per Person</div>
              <div className="font-bold text-[#174D3C] font-mono tabular-nums text-sm mt-0.5">
                ${trip.budgetPerPerson} {trip.currency}
              </div>
            </div>
            <div>
              <div className="text-[#8A9790]">Group Capacity</div>
              <div className="font-semibold text-[#202824] mt-0.5">
                {approvedMemberships.length} / {trip.maximumMembers} Travelers
              </div>
            </div>
            <div>
              <div className="text-[#8A9790]">Available Places</div>
              <div className={`font-semibold mt-0.5 ${isFull ? 'text-red-600' : 'text-[#27866A]'}`}>
                {isFull ? 'Sold Out' : `${spotsRemaining} Spots Available`}
              </div>
            </div>
            <div>
              <div className="text-[#8A9790]">Join Policy</div>
              <div className="font-semibold text-[#202824] mt-0.5">
                {trip.joinPolicy === 'open' ? 'Instant Approval' : 'Creator Review'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold font-display text-[#174D3C] uppercase tracking-wider">
              About the Trip
            </h3>
            <p className="text-xs sm:text-sm text-[#5E6963] leading-relaxed">
              {trip.description}
            </p>
          </div>

          {/* Creator & Organizer Section */}
          <div className="p-4 bg-white border border-[#E5E3D8] rounded-xl space-y-3">
            <h3 className="text-xs font-bold font-display text-[#174D3C] uppercase tracking-wider">
              Trip Organizer
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={trip.creatorProfile?.profilePhoto}
                  alt={trip.creatorProfile?.fullName}
                  className="w-10 h-10 rounded-full object-cover border border-[#E5E3D8]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-sm font-semibold text-[#202824]">
                    {trip.creatorProfile?.fullName}
                  </div>
                  <div className="text-xs text-[#8A9790]">
                    @{trip.creatorProfile?.username} · {trip.creatorProfile?.homeCity}
                  </div>
                </div>
              </div>

              {isCreator && trip.tripStatus !== 'cancelled' && (
                <button
                  onClick={handleCancelTrip}
                  className="px-3 py-1.5 text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Trip
                </button>
              )}
            </div>
          </div>

          {/* Creator Management Section: Pending Requests */}
          {isCreator && pendingRequests.length > 0 && (
            <div className="space-y-3 p-4 bg-[#F8F7F2] border border-[#E4BD73] rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#174D3C] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#C99E4E]" />
                  <span>Pending Membership Requests ({pendingRequests.length})</span>
                </h3>
                <span className="text-[11px] text-[#5E6963]">
                  {spotsRemaining} spaces left before full capacity
                </span>
              </div>

              <div className="space-y-2">
                {pendingRequests.map(req => {
                  const applicant = req.userProfile || { fullName: 'Traveler', username: 'user' };
                  return (
                    <div
                      key={req.id}
                      className="p-3 bg-white border border-[#E5E3D8] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#202824]">
                          {applicant.fullName} (@{applicant.username})
                        </div>
                        <div className="text-xs text-[#5E6963] mt-0.5 italic">
                          "{req.requestMessage}"
                        </div>
                        <div className="text-[10px] text-[#8A9790] mt-1">
                          Requested {new Date(req.requestedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleMembershipDecision(req.id, 'reject')}
                          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          disabled={isFull}
                          onClick={() => handleMembershipDecision(req.id, 'approve')}
                          className="px-3 py-1.5 text-xs text-white bg-[#174D3C] hover:bg-[#1F644E] disabled:opacity-50 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Day-by-Day Itinerary Planner */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-display text-[#174D3C] uppercase tracking-wider">
                  Day-by-Day Itinerary & Schedule
                </h3>
                <p className="text-xs text-[#5E6963]">
                  Estimated activities total: ${totalItineraryCost} · Target budget: ${trip.budgetPerPerson}
                </p>
              </div>

              {(isCreator || isApprovedMember) && (
                <button
                  onClick={() => setShowAddActivity(!showAddActivity)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#174D3C] bg-[#F8F7F2] hover:bg-[#EFECE3] border border-[#E5E3D8] rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddActivity ? 'Cancel' : 'Add Activity'}</span>
                </button>
              )}
            </div>

            {/* Add Activity Form */}
            {showAddActivity && (
              <form
                onSubmit={handleAddItineraryItem}
                className="p-4 bg-[#F8F7F2] rounded-xl border border-[#E5E3D8] space-y-3 animate-in fade-in duration-150"
              >
                <div className="text-xs font-semibold text-[#174D3C]">Add Schedule Activity</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[#5E6963] block mb-1">Day Number</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={newActivity.dayNumber}
                      onChange={e => setNewActivity({ ...newActivity, dayNumber: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#5E6963] block mb-1">Start Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:30"
                      value={newActivity.startTime}
                      onChange={e => setNewActivity({ ...newActivity, startTime: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#5E6963] block mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 hours"
                      value={newActivity.duration}
                      onChange={e => setNewActivity({ ...newActivity, duration: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#5E6963] block mb-1">Activity Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Bamboo Grove Sunrise Shoot"
                      value={newActivity.activityTitle}
                      onChange={e => setNewActivity({ ...newActivity, activityTitle: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#5E6963] block mb-1">Est. Cost ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={newActivity.estimatedCost}
                      onChange={e => setNewActivity({ ...newActivity, estimatedCost: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#5E6963] block mb-1">Description & Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Details, meeting points, gear required..."
                    value={newActivity.description}
                    onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174D3C] text-white text-xs font-semibold rounded-lg hover:bg-[#1F644E] cursor-pointer"
                >
                  Save Activity
                </button>
              </form>
            )}

            {/* Itinerary Items Timeline */}
            {itinerary.length === 0 ? (
              <div className="p-6 bg-[#F8F7F2] rounded-xl text-center text-xs text-[#5E6963]">
                No itinerary schedule published yet. The organizer will post day-by-day details soon.
              </div>
            ) : (
              <div className="space-y-3">
                {itinerary.map(item => (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-[#E5E3D8] rounded-xl flex items-start justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#174D3C] font-mono">Day {item.dayNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#5E6963]">{item.startTime} ({item.duration})</span>
                        {item.location && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#8A9790]">{item.location}</span>
                          </>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-[#202824]">{item.activityTitle}</h4>
                      {item.description && (
                        <p className="text-xs text-[#5E6963] leading-relaxed">{item.description}</p>
                      )}
                      {item.notes && (
                        <div className="text-[11px] text-[#8A9790] italic mt-1">Note: {item.notes}</div>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end justify-between">
                      <div className="font-mono tabular-nums text-xs font-semibold text-[#174D3C]">
                        ~${item.estimatedCost}
                      </div>
                      {(isCreator || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteItineraryItem(item.id)}
                          className="mt-2 text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Remove activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Confirmed Travelers / Group Members */}
          <div className="space-y-3 pt-2 border-t border-[#EFECE3]">
            <h3 className="text-sm font-bold font-display text-[#174D3C] uppercase tracking-wider flex items-center justify-between">
              <span>Confirmed Members ({approvedMemberships.length}/{trip.maximumMembers})</span>
              <span className="text-xs text-[#27866A] font-normal font-sans">
                {spotsRemaining > 0 ? `${spotsRemaining} spots left` : 'Trip full'}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {memberProfiles.map(member => (
                <div
                  key={member.id}
                  className="p-3 bg-[#F8F7F2] rounded-xl border border-[#E5E3D8] flex items-center gap-3"
                >
                  <img
                    src={member.profilePhoto}
                    alt={member.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-[#E5E3D8]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-xs text-[#202824] truncate">
                      {member.fullName}
                    </div>
                    <div className="text-[10px] text-[#8A9790] uppercase tracking-wider">
                      {member.membershipRole === 'creator' ? 'Organizer' : 'Member'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer: Join Action & Status Banner */}
        <div className="p-4 bg-[#F8F7F2] border-t border-[#E5E3D8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#5E6963]">
            {isCreator ? (
              <span className="font-medium text-[#174D3C]">You are the trip organizer.</span>
            ) : isApprovedMember ? (
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>You are an approved member of this trip!</span>
              </span>
            ) : isPendingMember ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Your join request is pending approval.</span>
                </span>
                <button
                  onClick={() => currentMembership && handleWithdraw(currentMembership.id)}
                  className="text-xs text-[#5E6963] hover:underline cursor-pointer"
                >
                  Withdraw
                </button>
              </div>
            ) : isFull ? (
              <span className="text-red-600 font-medium">This trip has reached maximum capacity.</span>
            ) : (
              <span>Spaces are open. Introduce yourself to the trip organizer below.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isCreator && !isApprovedMember && !isPendingMember && !isFull && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Introduce yourself (travel style, goals)..."
                  value={joinMessage}
                  onChange={e => setJoinMessage(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-lg text-xs flex-1 sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                />
                <button
                  disabled={joinSubmitting}
                  onClick={handleJoinTrip}
                  className="px-4 py-2 bg-[#174D3C] hover:bg-[#1F644E] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{trip.joinPolicy === 'open' ? 'Join Trip' : 'Request to Join'}</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#EFECE3] border border-[#E5E3D8] text-[#202824] text-xs font-medium rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
