"use client";

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, ChevronDown } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { eventService } from '@/service/eventService';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId?: string | null;
}

interface EventFormData {
  title: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string;
  description: string;
}

const EVENT_TYPES = [
  'Meeting',
  'Appointment',
  'Consultation',
  'Follow-up',
  'Emergency',
  'Other'
];

export default function CreateEventModal({ isOpen, onClose, calendarId }: CreateEventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    eventType: 'Meeting',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    attendees: '',
    description: ''
  });
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showError, showSuccess } = useErrorHandler();

  if (!isOpen) return null;

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!calendarId) {
      showError('No calendar selected');
      return;
    }

    if (!formData.title.trim()) {
      showError('Event title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Format date and time for API
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;

      // Create event data with all form fields
      const eventData = {
        calendar_id: calendarId,
        summary: formData.title,
        start: startDateTime,
        end: endDateTime,
        attendee_email: formData.attendees || undefined,
      };

      await eventService.createEvent(eventData);

      showSuccess('Event created successfully!');
      onClose();
      // Reset form
      setFormData({
        title: '',
        eventType: 'Meeting',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        attendees: '',
        description: ''
      });
    } catch (error) {
      showError('Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg sm:max-w-lg">
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Create New Event</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Event Title *
            </label>
            <input
              type="text"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-200 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              required
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Event Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{formData.eventType}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
              {showEventTypeDropdown && (
                <div className="absolute top-full left-0 right-0 z-10 mt-2 rounded-md border border-gray-200 border-input bg-background shadow-lg">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        handleInputChange('eventType', type);
                        setShowEventTypeDropdown(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Date *
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {formatDate(formData.date)}
            </button>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="sr-only"
              required
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-200 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                End Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-200 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter location or meeting link"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-200 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
              />
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Attendees
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter email addresses separated by commas"
                value={formData.attendees}
                onChange={(e) => handleInputChange('attendees', e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-200 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Description
            </label>
            <textarea
              placeholder="Add event description..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-gray-200 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-10 px-4 py-2"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
} 