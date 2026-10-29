import React, { useState } from 'react';
import { Trip, Destination } from '../types/index.ts';
import { Search, Calendar, Users, DollarSign, Filter, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface TripsMarketplaceProps {
  trips: Trip[];
  destinations: Destination[];
  onSelectTrip: (trip: Trip) => void;
  openCreateTrip: () => void;
}

export const TripsMarketplace: React.FC<TripsMarketplaceProps> = ({
  trips,
  destinations,
  onSelectTrip,
  openCreateTrip,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [styleFilter, setStyleFilter] = useState('All');
  const [maxBudget, setMaxBudget] = useState<number>(3500);

  const categories = ['All', 'Mountains', 'Beaches', 'Heritage', 'Adventure', 'Food', 'Weekend Getaways'];
  const styles = ['All', 'Backpacker', 'Mid-range', 'Adventure', 'Luxury'];

  const filteredTrips = trips.filter(t => {
    const matchesCat = categoryFilter === 'All' || t.tripCategory.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStyle = styleFilter === 'All' || t.travelStyle.toLowerCase() === styleFilter.toLowerCase();
    const matchesSearch =
      search === '' ||
      t.tripTitle.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.meetingPoint.toLowerCase().includes(search.toLowerCase());
    const matchesBudget = t.budgetPerPerson <= maxBudget;

    return matchesCat && matchesStyle && matchesSearch && matchesBudget;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-[#174D3C] tracking-tight">
            Trips Marketplace
          </h1>
          <p className="text-xs text-[#5E6963] mt-1">
            Browse upcoming community-led travel adventures, review detailed itineraries, and join groups.
          </p>
        </div>

        <button
          onClick={openCreateTrip}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#174D3C] hover:bg-[#1F644E] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Organize a Trip</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E3D8] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9790]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by trip title, route, or meeting point..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] placeholder-[#8A9790] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              aria-label="Filter trips by category"
              className="px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs font-medium text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>

            <select
              value={styleFilter}
              onChange={e => setStyleFilter(e.target.value)}
              aria-label="Filter trips by style"
              className="px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs font-medium text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              {styles.map(s => (
                <option key={s} value={s}>
                  Style: {s}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg">
              <span className="text-[11px] text-[#5E6963]">Max:</span>
              <span className="text-xs font-mono tabular-nums text-[#174D3C] font-bold">
                ${maxBudget}
              </span>
              <input
                type="range"
                min="500"
                max="4000"
                step="250"
                value={maxBudget}
                onChange={e => setMaxBudget(Number(e.target.value))}
                aria-label="Budget filter slider"
                className="w-20 accent-[#174D3C] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E5E3D8] p-8 space-y-3">
          <Calendar className="w-10 h-10 text-[#8A9790] mx-auto" />
          <h3 className="text-base font-semibold text-[#174D3C]">No matching trips found</h3>
          <p className="text-xs text-[#5E6963] max-w-sm mx-auto">
            Try adjusting your search criteria or create your own adventure to invite other travelers!
          </p>
          <button
            onClick={openCreateTrip}
            className="px-4 py-2 bg-[#174D3C] text-white text-xs font-medium rounded-lg hover:bg-[#1F644E] cursor-pointer"
          >
            Create Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => {
            const approved = trip.approvedCount || 1;
            const remaining = Math.max(0, trip.maximumMembers - approved);
            const isFull = remaining === 0;

            return (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip)}
                className="group bg-white rounded-xl overflow-hidden border border-[#E5E3D8] hover:border-[#27866A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#EFECE3]">
                    <img
                      src={trip.coverImage}
                      alt={trip.tripTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Category & Status Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                      <div className="font-semibold text-[#E4BD73]">
                        {trip.tripCategory} · {trip.travelStyle}
                      </div>
                      <div className="font-medium text-[11px] bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                        {trip.joinPolicy === 'open' ? 'Instant Join' : 'Request to Join'}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    {/* Dates & spots unboxed text */}
                    <div className="flex items-center justify-between text-xs text-[#5E6963]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#27866A]" />
                        <span>
                          {trip.startDate} to {trip.endDate}
                        </span>
                      </div>
                      <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-[#27866A]'}`}>
                        {isFull ? 'Group Full' : `${remaining} spots open`}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base text-[#202824] group-hover:text-[#174D3C] transition-colors leading-snug line-clamp-2">
                      {trip.tripTitle}
                    </h3>

                    <p className="text-xs text-[#5E6963] leading-relaxed line-clamp-2">
                      {trip.description}
                    </p>

                    <div className="text-[11px] text-[#8A9790] flex items-center gap-1">
                      <span>Meeting:</span>
                      <span className="text-[#5E6963] truncate">{trip.meetingPoint}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-[#EFECE3] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {trip.creatorProfile?.profilePhoto ? (
                        <img
                          src={trip.creatorProfile.profilePhoto}
                          alt={trip.creatorProfile.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-[#E5E3D8]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#174D3C] text-white flex items-center justify-center text-xs font-semibold">
                          {trip.creatorProfile?.fullName?.[0] || 'T'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-[#202824] leading-tight truncate max-w-[110px]">
                          {trip.creatorProfile?.fullName || 'Traveler'}
                        </div>
                        <div className="text-[10px] text-[#8A9790]">Organizer</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[#174D3C] font-bold font-mono tabular-nums text-sm">
                        ${trip.budgetPerPerson} {trip.currency}
                      </div>
                      <div className="text-[10px] text-[#8A9790]">Estimated / person</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
