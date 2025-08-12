"use client";

import { User, Building, Calendar, Edit, CalendarPlus, Trash } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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
  const { showWarning } = useErrorHandler();
  const doctorCalendar = calendars?.find((calendar) => calendar.doctor_id === doctor.doctor_id);
  const hasCalendar = !!doctorCalendar;
  const createdDate = doctor.created_at ? new Date(doctor.created_at).toLocaleDateString('en-GB') : '03/08/2025';
  const doctorName = `${doctor.first_name} ${doctor.last_name}`;
  const primarySpecialization = doctor.doctor_data.specializations[0]?.specialization || 'General';
  const primaryFacility = doctor.doctor_data.facilities[0]?.name || 'No facility';

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
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm text-green-700">Calendar assigned</span>
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs border-green-300 text-green-700">
                Assigned
              </div>
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasCalendar) {
                showWarning('Only 1 calendar is allowed per doctor for now.');
                return;
              }
              onAssignCalendar?.(doctor);
            }}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-gray-300 border-input bg-background h-9 rounded-md px-3 flex-1 ${
              hasCalendar 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <CalendarPlus className={`h-3 w-3 mr-1 ${hasCalendar ? 'text-gray-400' : 'text-gray-700'}`} />
            {hasCalendar ? 'Calendar Assigned' : 'Assign Calendar'}
          </button>
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