import { useState } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface CreateCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (calendarData: CalendarData) => void;
}

interface CalendarData {
  name: string;
  timezone: string;
}

const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' }
];

export default function CreateCalendarModal({ isOpen, onClose, onSubmit }: CreateCalendarModalProps) {
  const [formData, setFormData] = useState<CalendarData>({
    name: '',
    timezone: 'America/New_York',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const { showError, showSuccess } = useErrorHandler();

  const handleInputChange = (field: keyof CalendarData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Calendar name is required');
      return;
    }

    setIsProcessing(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      handleClose();
    } catch (error: any) {
      showError(error?.message || 'Failed to create calendar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      timezone: 'America/New_York',
    });
    setShowTimezoneDropdown(false);
    onClose();
  };

  const selectedTimezone = timezoneOptions.find(tz => tz.value === formData.timezone);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-40">
      <div 
        className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-[500px]"
        tabIndex={-1}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Calendar
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Icon and Description */}
          <div className="text-center">
            <div className="rounded-full bg-gray-200 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground text-gray-500">
              Set up your calendar with timezone and preferences
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Calendar Name */}
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="calendar_name">
                Calendar Name
              </label>
              <input
                className="flex h-10 w-full rounded-md border border-input border-gray-200 bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1"
                id="calendar_name"
                placeholder="My Work Calendar"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="timezone">
                Timezone
              </label>
              <div className="relative">
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={showTimezoneDropdown}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{selectedTimezone?.label || 'Select timezone'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                
                {showTimezoneDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-input border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {timezoneOptions.map((timezone) => (
                      <button
                        key={timezone.value}
                        className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm"
                        onClick={() => {
                          handleInputChange('timezone', timezone.value);
                          setShowTimezoneDropdown(false);
                        }}
                      >
                        {timezone.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-10 px-4 py-2"
              onClick={handleSubmit}
              disabled={isProcessing || !formData.name.trim()}
            >
              {isProcessing ? 'Creating...' : 'Create Calendar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 