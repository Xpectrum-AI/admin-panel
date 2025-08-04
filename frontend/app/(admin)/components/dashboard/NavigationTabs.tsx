import { Calendar, UserCheck } from 'lucide-react';

interface NavigationTabsProps {
  activeTab: 'calendar' | 'agents';
  onTabChange: (tab: 'calendar' | 'agents') => void;
}

export default function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
      <button
        onClick={() => onTabChange('calendar')}
        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
          activeTab === 'calendar' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>Calendar</span>
      </button>
      <button
        onClick={() => onTabChange('agents')}
        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
          activeTab === 'agents' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <UserCheck className="w-4 h-4" />
        <span>Agents</span>
      </button>
    </div>
  );
} 