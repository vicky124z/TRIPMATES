import React, { useState } from 'react';
import { Destination, Trip } from '../types/index.ts';
import { Search, Heart, MapPin, DollarSign, Calendar, ExternalLink, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface DestinationsViewProps {
  destinations: Destination[];
  trips: Trip[];
  onSelectDestination: (dest: Destination) => void;
  onToggleWishlist: (destId: string) => void;
}

export const DestinationsView: React.FC<DestinationsViewProps> = ({
  destinations,
  trips,
  onSelectDestination,
  onToggleWishlist,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [maxBudget, setMaxBudget] = useState<number>(3000);
  const [onlySaved, setOnlySaved] = useState(false);

  const categories = ['All', 'Mountains', 'Beaches', 'Heritage', 'Adventure', 'Food', 'Weekend Getaways'];

  const filtered = destinations.filter(d => {
    const matchesCat = categoryFilter === 'All' || d.category === categoryFilter;
    const matchesSearch =
      search === '' ||
      d.destinationName.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase());
    const matchesBudget = d.estimatedBudget <= maxBudget;
    const matchesSaved = !onlySaved || (user?.savedDestinations || []).includes(d.id);

    return matchesCat && matchesSearch && matchesBudget && matchesSaved;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header and Filter Toolbar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-[#174D3C] tracking-tight">
            Explore Destinations
          </h1>
          <p className="text-xs text-[#5E6963] mt-1">
            Browse verified itineraries, attractions, visiting seasons, and connected community trips.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E3D8] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9790]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by city, country, or landmark..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] placeholder-[#8A9790] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category select */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              aria-label="Filter destinations by category"
              className="px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs font-medium text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>

            {/* Budget range slider */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg">
              <span className="text-[11px] text-[#5E6963] whitespace-nowrap">Max:</span>
              <span className="text-xs font-mono tabular-nums text-[#174D3C] font-semibold whitespace-nowrap">
                ${maxBudget}
              </span>
              <input
                type="range"
                min="500"
                max="4000"
                step="250"
                value={maxBudget}
                onChange={e => setMaxBudget(Number(e.target.value))}
                aria-label="Maximum budget range"
                className="w-20 accent-[#174D3C] cursor-pointer"
              />
            </div>

            {/* Saved Wishlist Toggle */}
            <button
              onClick={() => setOnlySaved(!onlySaved)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                onlySaved
                  ? 'bg-[#174D3C] text-white'
                  : 'bg-[#F8F7F2] border border-[#E5E3D8] text-[#5E6963] hover:text-[#174D3C]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlySaved ? 'fill-current' : ''}`} />
              <span>Wishlist ({user?.savedDestinations?.length || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Destination Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E5E3D8] p-8 space-y-3">
          <Compass className="w-10 h-10 text-[#8A9790] mx-auto" />
          <h3 className="text-base font-semibold text-[#174D3C]">No destinations found</h3>
          <p className="text-xs text-[#5E6963] max-w-sm mx-auto">
            Try adjusting your category filters, search keywords, or budget slider.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
              setMaxBudget(4000);
              setOnlySaved(false);
            }}
            className="px-4 py-2 bg-[#174D3C] text-white text-xs font-medium rounded-lg hover:bg-[#1F644E] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(dest => {
            const isSaved = (user?.savedDestinations || []).includes(dest.id);
            const connectedTrips = trips.filter(t => t.destination === dest.id);

            return (
              <div
                key={dest.id}
                onClick={() => onSelectDestination(dest)}
                className="group bg-white rounded-xl overflow-hidden border border-[#E5E3D8] hover:border-[#27866A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#EFECE3]">
                    <img
                      src={dest.coverImage}
                      alt={dest.destinationName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Unboxed Metadata in Overlay */}
                    <div className="absolute bottom-3 left-3 text-xs text-white">
                      <span className="font-semibold text-[#E4BD73]">{dest.category}</span>
                      <span className="mx-1.5 opacity-60">·</span>
                      <span>{dest.city}, {dest.country}</span>
                    </div>

                    {/* Wishlist toggle */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleWishlist(dest.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors cursor-pointer"
                      aria-label="Wishlist button"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isSaved ? 'fill-[#E4BD73] text-[#E4BD73]' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-semibold text-base text-[#202824] group-hover:text-[#174D3C] transition-colors">
                      {dest.destinationName}
                    </h3>

                    <p className="text-xs text-[#5E6963] leading-relaxed line-clamp-3">
                      {dest.description}
                    </p>

                    {/* Attractions tags */}
                    <div className="text-xs text-[#5E6963] space-y-1 pt-1">
                      <span className="text-[11px] font-medium text-[#202824] block">Highlights:</span>
                      <div className="text-[11px] text-[#5E6963] leading-relaxed">
                        {dest.attractions.slice(0, 3).join(' · ')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-[#EFECE3] flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[#174D3C] font-bold font-mono tabular-nums text-sm">
                        ${dest.estimatedBudget}
                      </div>
                      <div className="text-[10px] text-[#8A9790]">avg. trip budget</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[#202824] font-medium">{dest.recommendedDuration}</div>
                      <div className="text-[10px] text-[#27866A] font-semibold">
                        {connectedTrips.length} active {connectedTrips.length === 1 ? 'trip' : 'trips'}
                      </div>
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
