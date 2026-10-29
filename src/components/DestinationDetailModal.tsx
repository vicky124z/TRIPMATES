import React, { useState, useEffect } from 'react';
import { Destination, Trip, User } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, Heart, MapPin, Calendar, DollarSign, Compass, ExternalLink, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface DestinationDetailModalProps {
  destination: Destination;
  onClose: () => void;
  onSelectTrip: (trip: Trip) => void;
  onSelectCompanion: (user: User) => void;
  onToggleWishlist: (destId: string) => void;
}

export const DestinationDetailModal: React.FC<DestinationDetailModalProps> = ({
  destination,
  onClose,
  onSelectTrip,
  onSelectCompanion,
  onToggleWishlist,
}) => {
  const { user } = useAuth();
  const [details, setDetails] = useState<{
    relatedTrips: Trip[];
    interestedUsers: User[];
  }>({ relatedTrips: [], interestedUsers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDestinationDetails(destination.id)
      .then(res => {
        setDetails({
          relatedTrips: res.relatedTrips,
          interestedUsers: res.interestedUsers,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [destination.id]);

  const isSaved = (user?.savedDestinations || []).includes(destination.id);

  // External directions URL
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${destination.destinationName}, ${destination.country}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-[#E5E3D8] max-h-[90vh] flex flex-col my-auto">
        
        {/* Modal Header Media */}
        <div className="relative aspect-[16/8] sm:aspect-[16/7] overflow-hidden bg-[#EFECE3]">
          <img
            src={destination.coverImage}
            alt={destination.destinationName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close & Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => onToggleWishlist(destination.id)}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors cursor-pointer"
              aria-label="Wishlist toggle"
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-[#E4BD73] text-[#E4BD73]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title info in banner */}
          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
            <div className="text-xs font-semibold text-[#E4BD73] uppercase tracking-wider">
              {destination.category} · {destination.verificationStatus === 'verified' ? 'Verified Destination' : 'Community Gem'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight">
              {destination.destinationName}
            </h2>
            <div className="text-xs text-white/90 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#E4BD73]" />
              <span>{destination.city}, {destination.stateOrRegion ? `${destination.stateOrRegion}, ` : ''}{destination.country}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Facts Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F8F7F2] rounded-xl border border-[#E5E3D8] text-xs">
            <div>
              <div className="text-[#8A9790]">Estimated Budget</div>
              <div className="font-bold text-[#174D3C] font-mono tabular-nums text-sm mt-0.5">
                ${destination.estimatedBudget}
              </div>
            </div>
            <div>
              <div className="text-[#8A9790]">Ideal Duration</div>
              <div className="font-semibold text-[#202824] mt-0.5">{destination.recommendedDuration}</div>
            </div>
            <div>
              <div className="text-[#8A9790]">Best Season</div>
              <div className="font-semibold text-[#202824] mt-0.5 line-clamp-1">{destination.bestVisitingSeason}</div>
            </div>
            <div>
              <div className="text-[#8A9790]">Navigation</div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#27866A] hover:underline font-semibold mt-0.5"
              >
                <span>Directions</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold font-display text-[#174D3C] uppercase tracking-wider">
              About this destination
            </h3>
            <p className="text-xs sm:text-sm text-[#5E6963] leading-relaxed">
              {destination.description}
            </p>
          </div>

          {/* Attractions */}
          {destination.attractions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold font-display text-[#174D3C] uppercase tracking-wider">
                Top Attractions & Highlights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#202824]">
                {destination.attractions.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#F8F7F2] rounded-lg border border-[#E5E3D8]">
                    <Compass className="w-3.5 h-3.5 text-[#27866A] shrink-0" />
                    <span>{att}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Trips */}
          <div className="space-y-3 pt-2 border-t border-[#EFECE3]">
            <h3 className="text-sm font-bold font-display text-[#174D3C] uppercase tracking-wider flex items-center justify-between">
              <span>Public Trips to {destination.city || destination.destinationName}</span>
              <span className="text-xs text-[#5E6963] font-normal font-sans">
                {details.relatedTrips.length} active
              </span>
            </h3>

            {loading ? (
              <div className="py-6 text-center text-xs text-[#8A9790]">Loading upcoming trips...</div>
            ) : details.relatedTrips.length === 0 ? (
              <div className="p-4 bg-[#F8F7F2] rounded-xl text-center text-xs text-[#5E6963]">
                No public trips scheduled to this destination yet. Be the first to create one!
              </div>
            ) : (
              <div className="space-y-2">
                {details.relatedTrips.map(tr => (
                  <div
                    key={tr.id}
                    onClick={() => {
                      onClose();
                      onSelectTrip(tr);
                    }}
                    className="p-3 bg-white hover:bg-[#F8F7F2] border border-[#E5E3D8] hover:border-[#27866A] rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-xs text-[#202824]">{tr.tripTitle}</div>
                      <div className="text-[11px] text-[#5E6963] mt-0.5">
                        {tr.startDate} to {tr.endDate} · {tr.travelStyle} · Max {tr.maximumMembers} members
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-xs font-bold text-[#174D3C]">
                        ${tr.budgetPerPerson} {tr.currency}
                      </div>
                      <span className="text-[11px] text-[#27866A] font-medium">View Trip →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interested Travelers */}
          {details.interestedUsers.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#EFECE3]">
              <h3 className="text-sm font-bold font-display text-[#174D3C] uppercase tracking-wider">
                Travelers Interested in this Destination
              </h3>
              <div className="flex flex-wrap gap-3">
                {details.interestedUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onClose();
                      onSelectCompanion(u);
                    }}
                    className="flex items-center gap-2 p-2 bg-[#F8F7F2] hover:bg-[#EFECE3] border border-[#E5E3D8] rounded-xl transition-colors cursor-pointer"
                  >
                    <img
                      src={u.profilePhoto}
                      alt={u.fullName}
                      className="w-7 h-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-xs">
                      <div className="font-medium text-[#202824] leading-tight">{u.fullName}</div>
                      <div className="text-[10px] text-[#8A9790]">{u.preferredTravelStyle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F8F7F2] border-t border-[#E5E3D8] flex items-center justify-between">
          <button
            onClick={() => onToggleWishlist(destination.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#174D3C] bg-white border border-[#E5E3D8] rounded-lg hover:bg-[#EFECE3] cursor-pointer"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#E4BD73] text-[#E4BD73]' : ''}`} />
            <span>{isSaved ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#174D3C] hover:bg-[#1F644E] rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
