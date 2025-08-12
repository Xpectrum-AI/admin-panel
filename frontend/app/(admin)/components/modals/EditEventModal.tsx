"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, ChevronDown, Save } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { eventService } from '@/service/eventService';
import { getTimezoneLabel } from '@/lib/utils/timezoneUtils';
import { CalendarEvent } from '../common/types';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  calendarId?: string | null;
  selectedCalendar?: any;
  onEventUpdated?: () => void; 
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

const eventTypes = [
  'Meeting',
  'Appointment',
  'Call',
  'Review',
  'Consultation',
  'Follow-up',
  'Other'
];

export default function EditEventModal({ isOpen, onClose, event, calendarId, selectedCalendar, onEventUpdated }: EditEventModalProps) {
  const { showError, showSuccess } = useErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start.dateTime);
      const endDate = new Date(event.end.dateTime);
      
      // Format date and times
      const dateStr = startDate.toISOString().split('T')[0];
      const startTimeStr = startDate.toTimeString().slice(0, 5);
      const endTimeStr = endDate.toTimeString().slice(0, 5);
      
      // Format attendees
      const attendeesStr = event.attendees?.map((attendee: any) => attendee.email || attendee).join(', ') || '';
      
      setFormData({
        title: event.summary || '',
        eventType: event.eventType || 'Meeting',
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        location: event.location || '',
        attendees: attendeesStr,
        description: event.description || ''
      });
    }
  }, [event]);

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!calendarId || !event?.id) {
      showError('Calendar ID and Event ID are required');
      return;
    }

    if (!formData.title.trim()) {
      showError('Event title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const calendarTimezone = selectedCalendar?.timezone || 'Asia/Kolkata';
      
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;

      const eventData = {
        calendar_id: calendarId,
        event_id: event.id,
        summary: formData.title,
        start: startDateTime,
        end: endDateTime,
        timezone: calendarTimezone,
        attendee_email: formData.attendees || undefined,
        description: formData.description || undefined,
        event_type: formData.eventType || undefined,
        location: formData.location || undefined,
      };

      const result = await eventService.updateEvent(eventData);
      showSuccess('Event updated successfully!');
      onClose();
      
      // Call the refresh callback instead of reloading the page
      if (onEventUpdated) {
        onEventUpdated();
      }
    } catch (error) {
      showError('Failed to update event');
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

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(time);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dateOptions = generateDateOptions();

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with animation */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal with responsive design */}
      <div className="relative z-50 w-full max-w-md mx-auto transform transition-all duration-300 ease-out">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 sm:p-6 text-white sticky top-0 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold truncate">Edit Event</h2>
                <p className="text-green-100 text-xs sm:text-sm mt-1 truncate">
                  {selectedCalendar?.name ? `Calendar: ${selectedCalendar.name}` : 'Edit Event'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200 flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 relative z-0">
            {/* Event Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="truncate">Event Title *</span>
              </label>
              <input
                type="text"
                placeholder="Enter event title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm sm:text-base"
                required
              />
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span className="truncate">Event Type</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white flex items-center justify-between text-sm sm:text-base"
                >
                  <span className="truncate">{formData.eventType}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${showEventTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showEventTypeDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {eventTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          handleInputChange('eventType', type);
                          setShowEventTypeDropdown(false);
                        }}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl text-sm sm:text-base"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date and Time Row */}
            <div className="space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="truncate">Date *</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white flex items-center justify-between text-sm sm:text-base"
                  >
                    <span className="truncate">{formatDate(formData.date)}</span>
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                  {showDatePicker && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {dateOptions.map((date) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            handleInputChange('date', date);
                            setShowDatePicker(false);
                          }}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl text-sm sm:text-base"
                        >
                          {formatDate(date)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Start Time */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="truncate">Start Time</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowStartTimePicker(!showStartTimePicker)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white flex items-center justify-between text-sm sm:text-base"
                    >
                      <span className="truncate">{formData.startTime}</span>
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                    {showStartTimePicker && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {timeOptions.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              handleInputChange('startTime', time);
                              setShowStartTimePicker(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl text-sm"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="truncate">End Time</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEndTimePicker(!showEndTimePicker)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white flex items-center justify-between text-sm sm:text-base"
                    >
                      <span className="truncate">{formData.endTime}</span>
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                    {showEndTimePicker && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {timeOptions.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              handleInputChange('endTime', time);
                              setShowEndTimePicker(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl text-sm"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="truncate">Location</span>
              </label>
              <input
                type="text"
                placeholder="Enter location or meeting link"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm sm:text-base"
              />
            </div>

            {/* Attendees */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">Attendees</span>
              </label>
              <input
                type="text"
                placeholder="Enter email addresses separated by commas"
                value={formData.attendees}
                onChange={(e) => handleInputChange('attendees', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-sm sm:text-base"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                <span className="truncate">Description</span>
              </label>
              <textarea
                placeholder="Add event description..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none text-sm sm:text-base"
              />
            </div>

            {/* Timezone Info */}
            {selectedCalendar?.timezone && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Timezone: {getTimezoneLabel(selectedCalendar.timezone)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Updating...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Update Event</span>
                    <span className="sm:hidden">Update</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
