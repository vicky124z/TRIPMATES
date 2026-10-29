import React, { useState } from 'react';
import { Destination, Trip } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, Calendar, MapPin, DollarSign, Users, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface CreateTripModalProps {
  destinations: Destination[];
  onClose: () => void;
  onTripCreated: (newTrip: Trip) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  destinations,
  onClose,
  onTripCreated,
}) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tripTitle: '',
    destination: destinations[0]?.id || '',
    description: '',
    startDate: '2026-11-20',
    endDate: '2026-11-27',
    budgetPerPerson: 1200,
    currency: 'USD' as const,
    maximumMembers: 6,
    tripCategory: 'Adventure',
    travelStyle: 'Backpacker',
    coverImage: destinations[0]?.coverImage || '/src/assets/images/hero_travel_adventure_1793249478917.jpg',
    visibility: 'public' as const,
    joinPolicy: 'request' as 'request' | 'open',
    meetingPoint: 'Central Railway Station Entrance',
  });

  const [itineraryDays, setItineraryDays] = useState([
    {
      dayNumber: 1,
      activityTitle: 'Arrival & Welcome Meetup',
      description: 'Check into accommodations, assemble for welcome dinner and safety briefing.',
      startTime: '17:00',
      duration: '3 hours',
      location: 'Central Plaza',
      estimatedCost: 40,
      notes: 'Group dinner included',
    },
    {
      dayNumber: 2,
      activityTitle: 'Main Landmark & Trail Exploration',
      description: 'Morning trek and exploration followed by local street food tasting.',
      startTime: '08:30',
      duration: '5 hours',
      location: 'Scenic Viewpoint',
      estimatedCost: 25,
      notes: 'Wear sturdy footwear',
    },
  ]);

  const handleAddDay = () => {
    const nextDay = itineraryDays.length + 1;
    setItineraryDays([
      ...itineraryDays,
      {
        dayNumber: nextDay,
        activityTitle: `Day ${nextDay} Excursion`,
        description: 'Explore scenic trails, local artisan workshops, and sunset views.',
        startTime: '09:00',
        duration: '4 hours',
        location: 'Heritage District',
        estimatedCost: 30,
        notes: '',
      },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    setItineraryDays(itineraryDays.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to create a trip.');
      return;
    }

    if (!formData.tripTitle.trim()) {
      setError('Trip title is required.');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      setError('End date cannot be prior to start date.');
      return;
    }

    if (formData.maximumMembers < 2 || formData.maximumMembers > 50) {
      setError('Group capacity must be between 2 and 50.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createTrip({
        ...formData,
        itinerary: itineraryDays,
      });
      onTripCreated(res.trip);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-[#E5E3D8] max-h-[92vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E5E3D8] flex items-center justify-between bg-[#F8F7F2]">
          <div>
            <h2 className="text-xl font-bold font-display text-[#174D3C]">
              Create a Group Trip
            </h2>
            <p className="text-xs text-[#5E6963] mt-0.5">
              Publish your journey to the TripMates Airtable base and invite travel companions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5E6963] hover:text-[#174D3C] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Trip Title */}
          <div>
            <label className="text-xs font-semibold text-[#174D3C] block mb-1">
              Trip Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Kyoto Zen Gardens & Autumn Foliage Walk"
              value={formData.tripTitle}
              onChange={e => setFormData({ ...formData, tripTitle: e.target.value })}
              className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
              required
            />
          </div>

          {/* Destination & Meeting Point */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                Destination *
              </label>
              <select
                value={formData.destination}
                onChange={e => {
                  const sel = destinations.find(d => d.id === e.target.value);
                  setFormData({
                    ...formData,
                    destination: e.target.value,
                    coverImage: sel?.coverImage || formData.coverImage,
                  });
                }}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                required
              >
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.destinationName} ({d.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                Meeting Point *
              </label>
              <input
                type="text"
                placeholder="e.g. Kyoto Central Station Main Clock"
                value={formData.meetingPoint}
                onChange={e => setFormData({ ...formData, meetingPoint: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                required
              />
            </div>
          </div>

          {/* Budget, Currency & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                Budget / Person *
              </label>
              <input
                type="number"
                min="50"
                max="20000"
                value={formData.budgetPerPerson}
                onChange={e => setFormData({ ...formData, budgetPerPerson: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs font-mono tabular-nums text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                Max Group Size *
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={formData.maximumMembers}
                onChange={e => setFormData({ ...formData, maximumMembers: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs font-mono tabular-nums text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                required
              />
            </div>
          </div>

          {/* Category & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                Trip Category
              </label>
              <select
                value={formData.tripCategory}
                onChange={e => setFormData({ ...formData, tripCategory: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
              >
                <option value="Adventure">Adventure</option>
                <option value="Mountains">Mountains</option>
                <option value="Heritage">Heritage</option>
                <option value="Beaches">Beaches</option>
                <option value="Food">Food</option>
                <option value="Weekend Getaways">Weekend Getaways</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#174D3C] block mb-1">
                Travel Style & Pace
              </label>
              <select
                value={formData.travelStyle}
                onChange={e => setFormData({ ...formData, travelStyle: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
              >
                <option value="Backpacker">Backpacker (Hostels & Local transit)</option>
                <option value="Mid-range">Mid-range (Boutique guesthouses)</option>
                <option value="Adventure">Adventure (Hiking & Camping)</option>
                <option value="Luxury">Luxury & Comfort</option>
              </select>
            </div>
          </div>

          {/* Join Policy */}
          <div>
            <label className="text-xs font-semibold text-[#174D3C] block mb-1">
              Join Approval Policy
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="p-3 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="joinPolicy"
                  value="request"
                  checked={formData.joinPolicy === 'request'}
                  onChange={() => setFormData({ ...formData, joinPolicy: 'request' })}
                  className="accent-[#174D3C]"
                />
                <div>
                  <div className="font-semibold text-[#202824]">Request to Join</div>
                  <div className="text-[10px] text-[#5E6963]">You review applicants before approval</div>
                </div>
              </label>

              <label className="p-3 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="joinPolicy"
                  value="open"
                  checked={formData.joinPolicy === 'open'}
                  onChange={() => setFormData({ ...formData, joinPolicy: 'open' })}
                  className="accent-[#174D3C]"
                />
                <div>
                  <div className="font-semibold text-[#202824]">Instant Join</div>
                  <div className="text-[10px] text-[#5E6963]">Anyone can join until capacity is reached</div>
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#174D3C] block mb-1">
              Description & Expectations
            </label>
            <textarea
              rows={3}
              placeholder="Tell travel companions what you plan to do, accommodation style, fitness expectations, and rules..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            />
          </div>

          {/* Initial Itinerary Builder */}
          <div className="space-y-3 pt-2 border-t border-[#E5E3D8]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#174D3C] uppercase tracking-wider block">
                Itinerary Schedule Outline
              </label>
              <button
                type="button"
                onClick={handleAddDay}
                className="text-xs text-[#27866A] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Day</span>
              </button>
            </div>

            <div className="space-y-2">
              {itineraryDays.map((day, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-[#174D3C]">Day {day.dayNumber}</span>
                    {itineraryDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(idx)}
                        className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Activity title..."
                      value={day.activityTitle}
                      onChange={e => {
                        const updated = [...itineraryDays];
                        updated[idx].activityTitle = e.target.value;
                        setItineraryDays(updated);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-[#E5E3D8] rounded-md text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Start time & duration (e.g. 09:00, 3h)..."
                      value={day.startTime}
                      onChange={e => {
                        const updated = [...itineraryDays];
                        updated[idx].startTime = e.target.value;
                        setItineraryDays(updated);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-[#E5E3D8] rounded-md text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-[#E5E3D8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F8F7F2] hover:bg-[#EFECE3] border border-[#E5E3D8] rounded-lg text-xs font-medium text-[#5E6963] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#174D3C] hover:bg-[#1F644E] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving to Airtable...' : 'Publish Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
