import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { HomeDiscover } from './components/HomeDiscover.tsx';
import { DestinationsView } from './components/DestinationsView.tsx';
import { DestinationDetailModal } from './components/DestinationDetailModal.tsx';
import { TripsMarketplace } from './components/TripsMarketplace.tsx';
import { TripDetailModal } from './components/TripDetailModal.tsx';
import { CreateTripModal } from './components/CreateTripModal.tsx';
import { CompanionsView } from './components/CompanionsView.tsx';
import { CommunityFeed } from './components/CommunityFeed.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import { Destination, Trip, User } from './types/index.ts';
import { api } from './services/api.ts';
import { Database, Shield } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');

  // Shared entities
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [companions, setCompanions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & view selections
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [targetProfileUserId, setTargetProfileUserId] = useState<string | null>(null);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    reportedUser?: string | null;
    reportedPost?: string | null;
    reportedTrip?: string | null;
  } | null>(null);

  const fetchAppData = async () => {
    try {
      const [destRes, tripsRes, usersRes] = await Promise.all([
        api.getDestinations(),
        api.getTrips(),
        api.getUsers(),
      ]);
      setDestinations(destRes.destinations);
      setTrips(tripsRes.trips);
      setCompanions(usersRes.users);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleToggleWishlist = async (destId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await api.toggleWishlist(user.id, destId);
      // Update local user state
      if (user) {
        user.savedDestinations = res.savedDestinations;
      }
      setDestinations([...destinations]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCompanion = (comp: User) => {
    setTargetProfileUserId(comp.id);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTrip = (trip: Trip) => {
    setSelectedTripId(trip.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F2] text-[#202824] antialiased">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={tab => {
          if (tab === 'profile') setTargetProfileUserId(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        openCreateTrip={() => {
          if (!user) {
            setShowAuthModal(true);
          } else {
            setShowCreateTrip(true);
          }
        }}
        openAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#174D3C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#5E6963]">Connecting to TripMates Airtable base...</p>
          </div>
        ) : (
          <>
            {activeTab === 'discover' && (
              <HomeDiscover
                destinations={destinations}
                trips={trips}
                companions={companions}
                setActiveTab={setActiveTab}
                openCreateTrip={() => {
                  if (!user) setShowAuthModal(true);
                  else setShowCreateTrip(true);
                }}
                onSelectDestination={dest => setSelectedDestination(dest)}
                onSelectTrip={handleSelectTrip}
                onSelectCompanion={handleSelectCompanion}
                onToggleWishlist={handleToggleWishlist}
              />
            )}

            {activeTab === 'destinations' && (
              <DestinationsView
                destinations={destinations}
                trips={trips}
                onSelectDestination={dest => setSelectedDestination(dest)}
                onToggleWishlist={handleToggleWishlist}
              />
            )}

            {activeTab === 'trips' && (
              <TripsMarketplace
                trips={trips}
                destinations={destinations}
                onSelectTrip={handleSelectTrip}
                openCreateTrip={() => {
                  if (!user) setShowAuthModal(true);
                  else setShowCreateTrip(true);
                }}
              />
            )}

            {activeTab === 'companions' && (
              <CompanionsView
                companions={companions}
                onSelectCompanion={handleSelectCompanion}
              />
            )}

            {activeTab === 'community' && (
              <CommunityFeed
                destinations={destinations}
                trips={trips}
                onSelectUser={userId => {
                  setTargetProfileUserId(userId);
                  setActiveTab('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                openReportModal={target => setReportTarget(target)}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                targetUserId={targetProfileUserId}
                destinations={destinations}
                onSelectTrip={handleSelectTrip}
                onSelectDestination={dest => setSelectedDestination(dest)}
                openReportModal={target => setReportTarget(target)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard
                onDestinationAdded={newD => {
                  setDestinations(prev => [...prev, newD]);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E5E3D8] bg-[#F8F7F2] py-8 text-xs text-[#5E6963]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold font-display text-sm text-[#174D3C]">TripMates</span>
            <span aria-hidden="true">·</span>
            <span>Explore More. Meet Your People.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#8A9790]">
            <button
              onClick={() => setActiveTab('admin')}
              className="flex items-center gap-1 hover:text-[#174D3C] cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#27866A]" />
              <span>Airtable Base Explorer</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>10 Connected Tables</span>
            <span aria-hidden="true">·</span>
            <span>© 2026 TripMates Platform</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={tab => {
          if (tab === 'profile') setTargetProfileUserId(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Destination Detail Modal */}
      {selectedDestination && (
        <DestinationDetailModal
          destination={selectedDestination}
          onClose={() => setSelectedDestination(null)}
          onSelectTrip={trip => {
            setSelectedDestination(null);
            handleSelectTrip(trip);
          }}
          onSelectCompanion={comp => {
            setSelectedDestination(null);
            handleSelectCompanion(comp);
          }}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {/* Trip Detail & Membership Workflow Modal */}
      {selectedTripId && (
        <TripDetailModal
          tripId={selectedTripId}
          onClose={() => setSelectedTripId(null)}
          onTripUpdated={fetchAppData}
        />
      )}

      {/* Create Trip Modal */}
      {showCreateTrip && (
        <CreateTripModal
          destinations={destinations}
          onClose={() => setShowCreateTrip(false)}
          onTripCreated={newTrip => {
            setTrips(prev => [newTrip, ...prev]);
            setSelectedTripId(newTrip.id);
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        reportTarget={reportTarget}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
