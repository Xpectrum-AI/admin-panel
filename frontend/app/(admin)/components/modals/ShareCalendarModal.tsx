"use client";

import { useState } from 'react';
import { Share, Mail, X, Copy, ChevronDown } from 'lucide-react';
import { calendarService } from '@/service/calendarService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarName?: string;
  calendarId?: string | null;
  onComplete?: () => void;
}

interface SharedUser {
  email: string;
  permission: 'view' | 'edit';
}

export default function ShareCalendarModal({ isOpen, onClose, calendarName = "My Calendar", calendarId, onComplete }: ShareCalendarModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { showSuccess } = useErrorHandler();
  
  const handleAddUser = async () => {
    if (!email.trim() || !calendarId) return;
    
    setIsSharing(true);
    try {
      await calendarService.shareCalendar({
        calendar_id: calendarId,
        share_email: email.trim(),
        role: 'writer'
      });
      showSuccess('Calendar shared successfully');
      setSharedUsers([...sharedUsers, { email: email.trim(), permission }]);
      setEmail('');
      onComplete?.();
    } catch (error) {
      console.error('Failed to share calendar:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // const handleRemoveUser = (emailToRemove: string) => {
  //   setSharedUsers(sharedUsers.filter(user => user.email !== emailToRemove));
  // };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-300 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-md">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Share Calendar: {calendarName}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                Email address
              </label>
              <input
                type="email"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                id="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="permission">
                Permission
              </label>
              <div className="relative">
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={showPermissionDropdown}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setShowPermissionDropdown(!showPermissionDropdown)}
                >
                  <span className="line-clamp-1">
                    {permission === 'view' ? 'View only' : 'Edit'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {showPermissionDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-10">
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setPermission('view');
                        setShowPermissionDropdown(false);
                      }}
                    >
                      View only
                    </button>
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setPermission('edit');
                        setShowPermissionDropdown(false);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-10 px-4 py-2 w-full"
              onClick={handleAddUser}
              disabled={isSharing || !email.trim() || !calendarId}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSharing ? 'Sharing...' : 'Add User'}
            </button>
          </div>

          {/* <div className="space-y-3">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Shared with
            </label>
            {sharedUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm">{user.email}</span>
                  <div className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300">
                    {user.permission}
                  </div>
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                  onClick={() => handleRemoveUser(user.email)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div> */}
        </div>
      </div>
    </div>
  );
} 