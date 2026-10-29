import React from 'react';
import { Compass, MapPin, Calendar, Users, MessageSquare, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const tabs = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'destinations', label: 'Explore', icon: MapPin },
    { id: 'trips', label: 'Trips', icon: Calendar },
    { id: 'companions', label: 'Buddies', icon: Users },
    { id: 'community', label: 'Feed', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8F7F2]/95 backdrop-blur-md border-t border-[#E5E3D8] px-2 py-1.5 flex items-center justify-around">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              isActive ? 'text-[#174D3C]' : 'text-[#8A9790] hover:text-[#5E6963]'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
            <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
