import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Bell, Plus, Shield, User as UserIcon, LogOut, ChevronDown, Check } from 'lucide-react';
import { Notification } from '../types/index.ts';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openCreateTrip: () => void;
  openAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openCreateTrip,
  openAuthModal,
}) => {
  const { user, logout, switchUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [allDemoUsers, setAllDemoUsers] = useState<any[]>([]);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    api.getUsers().then(res => setAllDemoUsers(res.users)).catch(() => {});
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    setUnreadCount(0);
  };

  const navLinks = [
    { id: 'discover', label: 'Discover' },
    { id: 'destinations', label: 'Destinations' },
    { id: 'trips', label: 'Trips' },
    { id: 'companions', label: 'Companions' },
    { id: 'community', label: 'Community' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F2]/95 backdrop-blur-md border-b border-[#E5E3D8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('discover')}
          className="text-2xl font-bold font-display tracking-tight text-[#174D3C] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
        >
          TripMates
          <span className="text-[#E4BD73] text-3xl leading-none">.</span>
        </button>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5E6963]">
          {navLinks.map(link => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`transition-colors whitespace-nowrap shrink-0 pb-1 relative cursor-pointer ${
                  isActive
                    ? 'text-[#174D3C] font-semibold'
                    : 'hover:text-[#174D3C]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174D3C] rounded-full" />
                )}
              </button>
            );
          })}
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 relative flex items-center gap-1 cursor-pointer ${
                activeTab === 'admin'
                  ? 'text-[#174D3C] font-semibold'
                  : 'text-[#27866A] hover:text-[#174D3C]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin & Base</span>
              {activeTab === 'admin' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174D3C] rounded-full" />
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification Icon */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-2 text-[#5E6963] hover:text-[#174D3C] hover:bg-[#EFECE3] rounded-lg transition-colors relative cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E4BD73] ring-2 ring-[#F8F7F2] rounded-full" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E5E3D8] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5E3D8]">
                  <div className="text-sm font-semibold text-[#174D3C]">Notifications</div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#27866A] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#EFECE3]">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-[#5E6963]">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 hover:bg-[#F8F7F2] transition-colors cursor-pointer ${
                          !n.readStatus ? 'bg-[#F8F7F2]/60' : ''
                        }`}
                        onClick={async () => {
                          if (!n.readStatus) {
                            await api.markNotificationRead(n.id);
                            setNotifications(prev =>
                              prev.map(x => (x.id === n.id ? { ...x, readStatus: true } : x))
                            );
                            setUnreadCount(c => Math.max(0, c - 1));
                          }
                          if (n.relatedTrip) {
                            setActiveTab('trips');
                          } else if (n.relatedPost) {
                            setActiveTab('community');
                          }
                          setShowNotifications(false);
                        }}
                      >
                        <div className="text-xs text-[#202824] leading-relaxed">{n.message}</div>
                        <div className="text-[11px] text-[#8A9790] mt-1">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Create Trip Primary Button */}
          <button
            onClick={openCreateTrip}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#174D3C] hover:bg-[#1F644E] active:scale-[0.98] rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Trip</span>
          </button>

          {/* User Profile trigger & quick demo switcher */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-[#EFECE3] transition-colors cursor-pointer"
              >
                <img
                  src={user.profilePhoto}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover border border-[#E5E3D8]"
                  referrerPolicy="no-referrer"
                />
                <ChevronDown className="w-3.5 h-3.5 text-[#5E6963]" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E5E3D8] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#E5E3D8]">
                    <div className="text-sm font-semibold text-[#174D3C] truncate">{user.fullName}</div>
                    <div className="text-xs text-[#8A9790]">@{user.username}</div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-[#202824] hover:bg-[#F8F7F2] flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#5E6963]" />
                      <span>My Profile & Wishlist</span>
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#27866A] hover:bg-[#F8F7F2] flex items-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Airtable & Moderation</span>
                      </button>
                    )}
                  </div>

                  {/* Switch Demo Traveler (Convenient Role Testing) */}
                  <div className="border-t border-[#E5E3D8] px-4 py-2 bg-[#F8F7F2]/50">
                    <div className="text-[11px] font-medium text-[#5E6963] uppercase tracking-wider mb-1.5">
                      Switch Role (Demo)
                    </div>
                    <div className="space-y-1">
                      {allDemoUsers.slice(0, 4).map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u);
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                            user.id === u.id
                              ? 'bg-[#174D3C] text-white font-medium'
                              : 'text-[#5E6963] hover:bg-[#EFECE3]'
                          }`}
                        >
                          <span className="truncate">{u.fullName} ({u.preferredTravelStyle})</span>
                          {user.id === u.id && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#E5E3D8] pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3.5 py-2 text-xs font-semibold text-[#174D3C] hover:bg-[#EFECE3] rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
