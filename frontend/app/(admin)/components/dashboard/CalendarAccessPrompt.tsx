import { Lock, CircleCheckBig, Star } from 'lucide-react';

interface CalendarAccessPromptProps {
  onRequestAccess: () => void;
}

export default function CalendarAccessPrompt({ onRequestAccess }: CalendarAccessPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <Lock className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Calendar Access Required</h3>
      <p className="text-gray-600 mb-6 max-w-md">
        Get access to our powerful calendar management system to schedule meetings, track events, and manage your time effectively.
      </p>
      <div className="grid gap-4 mb-6 text-left">
        <div className="flex items-center gap-2">
          <CircleCheckBig className="h-4 w-4 text-green-600" />
          <span className="text-sm">Schedule and manage appointments</span>
        </div>
        <div className="flex items-center gap-2">
          <CircleCheckBig className="h-4 w-4 text-green-600" />
          <span className="text-sm">Integration with external calendars</span>
        </div>
        <div className="flex items-center gap-2">
          <CircleCheckBig className="h-4 w-4 text-green-600" />
          <span className="text-sm">Team collaboration features</span>
        </div>
        <div className="flex items-center gap-2">
          <CircleCheckBig className="h-4 w-4 text-green-600" />
          <span className="text-sm">Automated reminders and notifications</span>
        </div>
      </div>
      <button
        onClick={onRequestAccess}
        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        <Star className="h-4 w-4" />
        Request Calendar Access
      </button>
    </div>
  );
} 