"use client";

import { User, Building, Calendar, Edit, CalendarPlus, Trash, Share2, Mail } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useState } from 'react';
import { calendarService } from '@/service/calendarService';

interface Doctor {
  _id: string;
  doctor_id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  doctor_data: {
    gender: string;
    age: string;
    experience: string;
    phone: string;
    registration_number: string;
    registration_year: string;
    registration_state: string;
    registration_country: string;
    registration_board: string;
    qualifications: Array<{
      degree: string;
      university: string;
      year: string;
      place: string;
    }>;
    specializations: Array<{
      specialization: string;
      level: string;
    }>;
    aliases: string[];
    facilities: Array<{
      name: string;
      type: string;
      area: string;
      city: string;
      state: string;
      pincode: string;
      address: string;
    }>;
  };
  calendarId?: string;
}

interface DoctorCardProps {
  doctor: Doctor;
  onEdit?: (doctor: Doctor) => void;
  onAssignCalendar?: (doctor: Doctor) => void;
  onDelete?: (doctor: Doctor) => void;
  onViewDetails?: (doctor: Doctor) => void;
  calendars?: any[];
}

export default function DoctorCard({
  doctor,
  onEdit,
  onAssignCalendar,
  onDelete,
  onViewDetails,
  calendars
}: DoctorCardProps) {
  const { showWarning, showSuccess, showError } = useErrorHandler();
  const [isSharing, setIsSharing] = useState(false);
  const [sharedEmail, setSharedEmail] = useState('');
  const [showShareInput, setShowShareInput] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);

  const doctorCalendar = calendars?.find((calendar) => calendar.doctor_id === doctor.doctor_id);
  const hasCalendar = !!doctorCalendar;
  const createdDate = doctor.created_at ? new Date(doctor.created_at).toLocaleDateString('en-GB') : '03/08/2025';
  const doctorName = `${doctor.first_name} ${doctor.last_name}`;
  const primarySpecialization = doctor.doctor_data.specializations[0]?.specialization || 'General';
  const primaryFacility = doctor.doctor_data.facilities[0]?.name || 'No facility';

  const handleShareCalendar = async () => {
    if (!sharedEmail.trim() || !doctorCalendar?.calendar_id) {
      showError('Please enter a valid email address');
      return;
    }

    setIsSharing(true);
    try {
      await calendarService.shareCalendar({
        calendar_id: doctorCalendar.calendar_id,
        share_email: sharedEmail.trim(),
        role: 'writer'
      });

      showSuccess('Calendar shared successfully');
      setShowShareInput(false);
      setSharedEmail('');
      setUpdatingEmail(null);

      // Update the calendar's shared_with information
      if (doctorCalendar) {
        doctorCalendar.shared_with = doctorCalendar.shared_with || [];
        if (!doctorCalendar.shared_with.includes(sharedEmail.trim())) {
          doctorCalendar.shared_with.push(sharedEmail.trim());
        }
      }
    } catch (error) {
      console.error('Failed to share calendar:', error);
      showError('Failed to share calendar. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveSharedEmail = async (emailToRemove: string) => {
    if (!doctorCalendar?.calendar_id) {
      showError('Calendar not found');
      return;
    }

    try {
      // Note: The current shareCalendar API doesn't support removal
      // This would require a new API endpoint for unsharing
      // For now, we'll just remove from the local state

      if (doctorCalendar.shared_with) {
        doctorCalendar.shared_with = doctorCalendar.shared_with.filter(
          (email: string) => email !== emailToRemove
        );
      }

      showSuccess('Email removed from sharing');
    } catch (error) {
      console.error('Failed to remove shared email:', error);
      showError('Failed to remove shared email. Please try again.');
    }
  };

  const handleUpdateSharedEmail = async (oldEmail: string, newEmail: string) => {
    if (!newEmail.trim() || !doctorCalendar?.calendar_id) {
      showError('Please enter a valid email address');
      return;
    }

    if (oldEmail === newEmail.trim()) {
      showError('New email must be different from the current email');
      return;
    }

    setIsSharing(true);
    try {
      // First, remove the old email (this would need an unshare API endpoint)
      if (doctorCalendar.shared_with) {
        doctorCalendar.shared_with = doctorCalendar.shared_with.filter(
          (email: string) => email !== oldEmail
        );
      }

      // Then share with the new email
      await calendarService.shareCalendar({
        calendar_id: doctorCalendar.calendar_id,
        share_email: newEmail.trim(),
        role: 'writer'
      });

      // Add the new email to shared_with
      if (doctorCalendar.shared_with) {
        doctorCalendar.shared_with.push(newEmail.trim());
      }

      showSuccess('Calendar sharing updated successfully');
      setShowShareInput(false);
      setSharedEmail('');
      setUpdatingEmail(null);
    } catch (error) {
      console.error('Failed to update calendar sharing:', error);
      showError('Failed to update calendar sharing. Please try again.');

      // Revert the old email if update failed
      if (doctorCalendar.shared_with && !doctorCalendar.shared_with.includes(oldEmail)) {
        doctorCalendar.shared_with.push(oldEmail);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const getSharedEmails = () => {
    if (!doctorCalendar?.shared_with) return [];
    return Array.isArray(doctorCalendar.shared_with)
      ? doctorCalendar.shared_with.filter((email: string) => email !== 'No one')
      : [];
  };

  const sharedEmails = getSharedEmails();

  return (
    <div className="rounded-lg border border-gray-200 bg-card text-card-foreground hover:shadow-lg transition-shadow"
      onClick={() => onViewDetails?.(doctor)}>
      {/* Card Header */}
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <span className="relative flex shrink-0 overflow-hidden rounded-full h-12 w-12">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
              <User className="h-6 w-6 text-muted-foreground" />
            </span>
          </span>

          {/* Doctor Info */}
          <div className="flex-1">
            <h3 className="font-semibold tracking-tight text-lg">
              Dr. {doctorName}
            </h3>
            <p className="text-sm text-gray-500">
              {doctor.doctor_data.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 pt-0 space-y-3">
        {/* Specializations */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Specializations
          </p>
          <div className="flex flex-wrap gap-1">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-200 text-secondary-foreground hover:bg-gray-200 text-xs">
              {primarySpecialization}
            </div>
          </div>
        </div>

        {/* Facilities */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Facilities
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <Building className="h-3 w-3 mr-2 text-gray-500" />
            {primaryFacility}
          </div>
        </div>

        {/* Calendar Status */}
        <div className="space-y-2">
          {hasCalendar ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm text-green-700">Calendar assigned</span>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs border-green-300 text-green-700">
                  Assigned
                </div>
              </div>

              {/* Shared Emails Display */}
              {sharedEmails.length > 0 && (
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">Shared with:</p>
                  <div className="space-y-2">
                    {sharedEmails.map((email: string, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs text-blue-600">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {email}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharedEmail(email);
                              setUpdatingEmail(email);
                              setShowShareInput(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-100"
                            title="Update email"
                          >
                            Update
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSharedEmail(email);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-100"
                            title="Remove email"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200">
              <span className="text-sm text-orange-700">No calendar assigned</span>
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs border-orange-300 text-orange-700">
                Unassigned
              </div>
            </div>
          )}
        </div>

        {/* Share Calendar Input */}
        {hasCalendar && showShareInput && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  placeholder="Enter email to share with"
                  value={sharedEmail}
                  onChange={(e) => setSharedEmail(e.target.value)}
                  className="flex-1 h-8 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Check if this is an update or new share
                    if (updatingEmail) {
                      handleUpdateSharedEmail(updatingEmail, sharedEmail);
                    } else {
                      handleShareCalendar();
                    }
                  }}
                  disabled={isSharing || !sharedEmail.trim()}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSharing ? 'Updating...' : (updatingEmail ? 'Update' : 'Share')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareInput(false);
                    setSharedEmail('');
                    setUpdatingEmail(null);
                  }}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
              {updatingEmail && (
                <p className="text-xs text-blue-600">
                  Updating shared email from: {updatingEmail}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(doctor);
            }}
            className="inline-flex items-center justify-center text-gray-700 gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-gray-300 border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 flex-1"
          >
            <Edit className="h-3 w-3 mr-1 text-gray-700" />
            Edit
          </button>

          {hasCalendar ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareInput(!showShareInput);
                if (showShareInput) {
                  setSharedEmail('');
                  setUpdatingEmail(null);
                }
              }}
              className="inline-flex items-center justify-center text-blue-700 gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-blue-300 border-input bg-background hover:bg-blue-50 h-9 rounded-md px-3 flex-1"
            >
              <Share2 className="h-3 w-3 mr-1 text-blue-700" />
              {showShareInput ? 'Cancel Share' : 'Share Calendar'}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasCalendar) {
                  showWarning('Only 1 calendar is allowed per doctor for now.');
                  return;
                }
                onAssignCalendar?.(doctor);
              }}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-gray-300 border-input bg-background h-9 rounded-md px-3 flex-1 text-gray-700 hover:bg-accent hover:text-accent-foreground"
            >
              <CalendarPlus className="h-3 w-3 mr-1 text-gray-700" />
              Assign Calendar
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(doctor);
            }}
            className="inline-flex items-center justify-center text-red-700 gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-red-300 border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 flex-1"
          >
            <Trash className="h-3 w-3 mr-1 text-red-700" />
            Delete
          </button>
        </div>

        {/* Created Date */}
        <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
          <Calendar className="h-3 w-3 mr-2 text-gray-500" />
          Added {createdDate}
        </div>
      </div>
    </div>
  );
} 