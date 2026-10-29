import React, { useState } from 'react';
import { Destination, Trip, User } from '../types/index.ts';
import { Search, Compass, Users, PlusCircle, ArrowRight, Calendar, MapPin, DollarSign, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HomeDiscoverProps {
  destinations: Destination[];
  trips: Trip[];
  companions: User[];
  setActiveTab: (tab: string) => void;
  openCreateTrip: () => void;
  onSelectDestination: (destination: Destination) => void;
  onSelectTrip: (trip: Trip) => void;
  onSelectCompanion: (companion: User) => void;
  onToggleWishlist: (destId: string) => void;
}

const CATEGORIES = [
  { name: 'All', count: 12 },
  { name: 'Mountains', count: 3 },
  { name: 'Beaches', count: 2 },
  { name: 'Heritage', count: 4 },
  { name: 'Adventure', count: 5 },
  { name: 'Food', count: 3 },
  { name: 'Weekend Getaways', count: 2 },
];

export const HomeDiscover: React.FC<HomeDiscoverProps> = ({
  destinations,
  trips,
  companions,
  setActiveTab,
  openCreateTrip,
  onSelectDestination,
  onSelectTrip,
  onSelectCompanion,
  onToggleWishlist,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredDestinations = destinations.filter(d => {
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      d.destinationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const filteredTrips = trips.filter(t => {
    return (
      searchQuery === '' ||
      t.tripTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tripCategory.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden shadow-lg border border-[#E5E3D8] bg-[#174D3C] text-white">
        <div className="relative min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-6 sm:p-10 lg:p-12">
          {/* Background Image with carefully calibrated contrast scrim */}
          <img
            src="/src/assets/images/hero_travel_adventure_1793249478917.jpg"
            alt="Adventurous travelers overlooking mountain range"
            className="absolute inset-0 w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F362A]/95 via-[#174D3C]/60 to-black/20" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="text-xs uppercase font-semibold tracking-widest text-[#E4BD73]">
              Social Travel · Powered by Airtable
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold font-display tracking-tight leading-tight text-white">
              Explore More.
              <br />
              Meet Your People.
            </h1>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
              Connect with fellow globetrotters, organize small group itineraries, and discover
              handpicked destinations with authentic local experiences.
            </p>

            {/* Quick Actions Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={openCreateTrip}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#E4BD73] hover:bg-[#C99E4E] text-[#174D3C] text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create a Trip</span>
              </button>
              <button
                onClick={() => setActiveTab('companions')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-semibold rounded-lg backdrop-blur-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Users className="w-4 h-4" />
                <span>Find Travel Buddies</span>
              </button>
              <button
                onClick={() => setActiveTab('destinations')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-semibold rounded-lg backdrop-blur-sm transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Destinations</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Search Bar attached to bottom */}
        <div className="bg-[#0F362A] px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search destinations, countries, or adventures..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#E4BD73]"
            />
          </div>
          <div className="text-xs text-white/80 flex items-center gap-2">
            <span>Greeting, {user?.fullName || 'Traveler'}</span>
            <span aria-hidden="true">·</span>
            <span>{destinations.length} Verified Destinations</span>
            <span aria-hidden="true">·</span>
            <span>{trips.length} Active Trips</span>
          </div>
        </div>
      </section>

      {/* Categories Filter Strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-[#174D3C] tracking-tight">
            Curated Categories
          </h2>
          <span className="text-xs text-[#5E6963]">Browse by travel theme</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#174D3C] text-white shadow-sm'
                    : 'bg-white border border-[#E5E3D8] text-[#5E6963] hover:text-[#174D3C] hover:border-[#27866A]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display text-[#174D3C] tracking-tight">
              Featured Destinations
            </h2>
            <p className="text-xs text-[#5E6963] mt-0.5">
              Iconic regions with verified guides and community-organized group trips.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('destinations')}
            className="flex items-center gap-1 text-xs font-semibold text-[#27866A] hover:text-[#174D3C] transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDestinations.slice(0, 4).map(dest => {
            const isSaved = (user?.savedDestinations || []).includes(dest.id);
            return (
              <div
                key={dest.id}
                onClick={() => onSelectDestination(dest)}
                className="group bg-white rounded-xl overflow-hidden border border-[#E5E3D8] hover:border-[#27866A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#EFECE3]">
                  <img
                    src={dest.coverImage}
                    alt={dest.destinationName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Category text (unboxed metadata rule) */}
                  <div className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-white uppercase tracking-wider drop-shadow-md">
                    {dest.category} · {dest.country}
                  </div>

                  {/* Wishlist button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onToggleWishlist(dest.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors cursor-pointer"
                    aria-label="Save destination"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isSaved ? 'fill-[#E4BD73] text-[#E4BD73]' : 'text-white'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm text-[#202824] group-hover:text-[#174D3C] transition-colors line-clamp-1">
                      {dest.destinationName}
                    </h3>
                    <p className="text-xs text-[#5E6963] line-clamp-2 mt-1 leading-relaxed">
                      {dest.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#EFECE3] flex items-center justify-between text-xs text-[#5E6963]">
                    <div className="flex items-center gap-1 font-mono tabular-nums text-[#174D3C] font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-[#27866A]" />
                      <span>~${dest.estimatedBudget}</span>
                    </div>
                    <span>{dest.recommendedDuration}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trending Upcoming Trips */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display text-[#174D3C] tracking-tight">
              Trending Group Adventures
            </h2>
            <p className="text-xs text-[#5E6963] mt-0.5">
              Open spots available. Connect with trip leaders and review day-by-day itineraries.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('trips')}
            className="flex items-center gap-1 text-xs font-semibold text-[#27866A] hover:text-[#174D3C] transition-colors cursor-pointer"
          >
            <span>Browse marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTrips.slice(0, 4).map(trip => {
            const spotsRemaining = Math.max(0, trip.maximumMembers - (trip.approvedCount || 1));
            return (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip)}
                className="group bg-white rounded-xl overflow-hidden border border-[#E5E3D8] hover:border-[#27866A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row"
              >
                <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto relative overflow-hidden bg-[#EFECE3]">
                  <img
                    src={trip.coverImage}
                    alt={trip.tripTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[11px] font-medium text-white">
                    {trip.tripCategory}
                  </div>
                </div>

                <div className="sm:w-3/5 p-5 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#5E6963]">
                      <span>{trip.travelStyle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#27866A] font-semibold">
                        {spotsRemaining > 0 ? `${spotsRemaining} spots left` : 'Trip Full'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base text-[#202824] group-hover:text-[#174D3C] transition-colors leading-snug">
                      {trip.tripTitle}
                    </h3>
                    <p className="text-xs text-[#5E6963] line-clamp-2 leading-relaxed">
                      {trip.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#EFECE3] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {trip.creatorProfile?.profilePhoto ? (
                        <img
                          src={trip.creatorProfile.profilePhoto}
                          alt={trip.creatorProfile.fullName}
                          className="w-6 h-6 rounded-full object-cover border border-[#E5E3D8]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#174D3C] text-white flex items-center justify-center text-[10px]">
                          {trip.creatorProfile?.fullName?.[0] || 'T'}
                        </div>
                      )}
                      <span className="text-[#202824] font-medium truncate max-w-[100px]">
                        {trip.creatorProfile?.fullName || 'Traveler'}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-[#174D3C] font-bold font-mono tabular-nums text-sm">
                        ${trip.budgetPerPerson} {trip.currency}
                      </div>
                      <div className="text-[10px] text-[#8A9790]">per person</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recommended Travel Companions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display text-[#174D3C] tracking-tight">
              Recommended Travel Companions
            </h2>
            <p className="text-xs text-[#5E6963] mt-0.5">
              Connect with travelers based on shared travel styles, budget harmony, and preferred activities.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('companions')}
            className="flex items-center gap-1 text-xs font-semibold text-[#27866A] hover:text-[#174D3C] transition-colors cursor-pointer"
          >
            <span>See all companions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {companions.slice(0, 4).map(buddy => (
            <div
              key={buddy.id}
              onClick={() => onSelectCompanion(buddy)}
              className="bg-white rounded-xl p-5 border border-[#E5E3D8] hover:border-[#27866A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-3">
                <img
                  src={buddy.profilePhoto}
                  alt={buddy.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-[#E5E3D8]"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-[#202824] truncate">
                    {buddy.fullName}
                  </h3>
                  <div className="text-xs text-[#8A9790] truncate">@{buddy.username}</div>
                  <div className="text-[11px] text-[#5E6963] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#27866A] shrink-0" />
                    <span className="truncate">{buddy.homeCity}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#5E6963] line-clamp-3 leading-relaxed">
                {buddy.bio}
              </p>

              <div className="space-y-2 pt-2 border-t border-[#EFECE3] text-xs">
                <div className="flex items-center justify-between text-[#5E6963]">
                  <span>Style</span>
                  <span className="font-medium text-[#174D3C]">{buddy.preferredTravelStyle}</span>
                </div>
                <div className="flex items-center justify-between text-[#5E6963]">
                  <span>Budget</span>
                  <span className="font-mono tabular-nums text-[#174D3C] font-semibold">
                    ${buddy.budgetMin}–${buddy.budgetMax}
                  </span>
                </div>
              </div>

              <button className="w-full py-1.5 px-3 bg-[#F8F7F2] hover:bg-[#174D3C] hover:text-white text-[#174D3C] text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                View Profile & Connect
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
