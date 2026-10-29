import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { Search, MapPin, Languages, Compass, DollarSign, Users, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface CompanionsViewProps {
  companions: User[];
  onSelectCompanion: (companion: User) => void;
}

export const CompanionsView: React.FC<CompanionsViewProps> = ({
  companions,
  onSelectCompanion,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState('All');
  const [interestFilter, setInterestFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');

  const styles = ['All', 'Backpacker', 'Mid-range', 'Adventure', 'Luxury'];
  const interests = ['All', 'Mountains', 'Adventure', 'Heritage', 'Food', 'Photography', 'Culture', 'Trekking'];
  const languages = ['All', 'English', 'Spanish', 'Japanese', 'Italian', 'French', 'Mandarin'];

  const filtered = companions.filter(c => {
    const matchesStyle = styleFilter === 'All' || c.preferredTravelStyle === styleFilter;
    const matchesInterest =
      interestFilter === 'All' ||
      c.travelInterests.some(i => i.toLowerCase().includes(interestFilter.toLowerCase()));
    const matchesLang =
      languageFilter === 'All' ||
      c.languages.some(l => l.toLowerCase().includes(languageFilter.toLowerCase()));
    const matchesSearch =
      search === '' ||
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.homeCity.toLowerCase().includes(search.toLowerCase()) ||
      c.bio.toLowerCase().includes(search.toLowerCase());

    return matchesStyle && matchesInterest && matchesLang && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-[#174D3C] tracking-tight">
          Find Travel Companions
        </h1>
        <p className="text-xs text-[#5E6963] mt-1">
          Discover like-minded travelers with aligned travel rhythms, budget expectations, and cultural curiosities.
        </p>
      </div>

      {/* Safety & Transparency Note */}
      <div className="p-3.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-xl flex items-start gap-3 text-xs text-[#5E6963]">
        <ShieldAlert className="w-4 h-4 text-[#C99E4E] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-[#174D3C]">Community Transparency:</span> Compatibility is
          calculated strictly from voluntarily shared interests, budget intervals, and travel styles.
          Automated matching does not constitute a verification or guarantee of personal safety. Always
          communicate through verified group channels and meet in public locations.
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E3D8] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9790]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city, language, or bio..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#202824] placeholder-[#8A9790] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={styleFilter}
            onChange={e => setStyleFilter(e.target.value)}
            aria-label="Filter companions by travel style"
            className="px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs font-medium text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
          >
            {styles.map(s => (
              <option key={s} value={s}>
                Style: {s}
              </option>
            ))}
          </select>

          <select
            value={interestFilter}
            onChange={e => setInterestFilter(e.target.value)}
            aria-label="Filter companions by interest"
            className="px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs font-medium text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
          >
            {interests.map(i => (
              <option key={i} value={i}>
                Interest: {i}
              </option>
            ))}
          </select>

          <select
            value={languageFilter}
            onChange={e => setLanguageFilter(e.target.value)}
            aria-label="Filter companions by language"
            className="px-3 py-2 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs font-medium text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
          >
            {languages.map(l => (
              <option key={l} value={l}>
                Language: {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Companions Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E5E3D8] p-8 space-y-3">
          <Users className="w-10 h-10 text-[#8A9790] mx-auto" />
          <h3 className="text-base font-semibold text-[#174D3C]">No travelers found</h3>
          <p className="text-xs text-[#5E6963] max-w-sm mx-auto">
            Try adjusting your travel style or language filters to find more companions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(buddy => {
            // Check compatibility with logged-in user
            const sharedInterests = user
              ? buddy.travelInterests.filter(i => (user.travelInterests || []).includes(i))
              : [];
            const isStyleMatch = user?.preferredTravelStyle === buddy.preferredTravelStyle;

            return (
              <div
                key={buddy.id}
                onClick={() => onSelectCompanion(buddy)}
                className="bg-white rounded-xl p-5 border border-[#E5E3D8] hover:border-[#27866A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <img
                      src={buddy.profilePhoto}
                      alt={buddy.fullName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#E5E3D8]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base text-[#202824] truncate">
                        {buddy.fullName}
                      </h3>
                      <div className="text-xs text-[#8A9790] truncate">@{buddy.username}</div>
                      <div className="text-xs text-[#5E6963] flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#27866A] shrink-0" />
                        <span className="truncate">{buddy.homeCity}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#5E6963] line-clamp-3 leading-relaxed mt-4">
                    {buddy.bio}
                  </p>

                  {/* Compatibility highlight */}
                  {user && user.id !== buddy.id && (
                    <div className="mt-3 p-2.5 bg-[#F8F7F2] rounded-lg border border-[#E5E3D8] text-[11px] text-[#5E6963] space-y-1">
                      <div className="font-semibold text-[#174D3C] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#E4BD73]" />
                        <span>Compatibility Match</span>
                      </div>
                      <div className="text-[#5E6963]">
                        {sharedInterests.length > 0
                          ? `Shared passions: ${sharedInterests.join(', ')}`
                          : 'Diverse perspectives & destinations'}
                        {isStyleMatch ? ' · Same travel rhythm' : ''}
                      </div>
                    </div>
                  )}

                  {/* Interests unboxed text */}
                  <div className="mt-3 pt-3 border-t border-[#EFECE3] space-y-1 text-xs">
                    <div className="text-[11px] font-medium text-[#202824]">Interests:</div>
                    <div className="text-[11px] text-[#5E6963]">
                      {buddy.travelInterests.join(' · ')}
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#EFECE3]">
                    <div>
                      <span className="text-[#8A9790] block text-[10px]">Pace & Style</span>
                      <span className="font-medium text-[#202824]">{buddy.preferredTravelStyle}</span>
                    </div>
                    <div>
                      <span className="text-[#8A9790] block text-[10px]">Budget Range</span>
                      <span className="font-mono tabular-nums font-semibold text-[#174D3C]">
                        ${buddy.budgetMin}–${buddy.budgetMax}
                      </span>
                    </div>
                  </div>

                  <button className="w-full py-2 px-3 bg-[#174D3C] text-white hover:bg-[#1F644E] text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center">
                    View Profile & Adventures
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
