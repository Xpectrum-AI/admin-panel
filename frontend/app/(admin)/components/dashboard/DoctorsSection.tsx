"use client";

import { useState } from 'react';
import { User, Plus, Search } from 'lucide-react';
import DoctorCard from './DoctorCard';
import NoDoctorsModal from '../modals/NoDoctorsModal';

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

interface DoctorsSectionProps {
  doctors?: Doctor[];
  loading?: boolean;
  calendars?: any[];
  onAddDoctor?: () => void;
  onSearch?: (query: string) => void;
  onEditDoctor?: (doctor: Doctor) => void;
  onAssignCalendar?: (doctor: Doctor) => void;
  onDeleteDoctor?: (doctor: Doctor) => void;
  onViewDetails?: (doctor: Doctor) => void;
}

export default function DoctorsSection({ 
  doctors = [], 
  loading = false, 
  calendars = [],
  onAddDoctor,
  onSearch,
  onEditDoctor,
  onAssignCalendar,
  onDeleteDoctor,
  onViewDetails
}: DoctorsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoDoctorsModal, setShowNoDoctorsModal] = useState(true);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleAddDoctorClick = () => {
    if (doctors.length === 0) {
      setShowNoDoctorsModal(true);
    } else {
      onAddDoctor?.();
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchQuery.toLowerCase();
    
    // Handle new structure (with doctor_data)
    if (doctor.doctor_data) {
      const firstName = doctor.first_name?.toLowerCase() || '';
      const lastName = doctor.last_name?.toLowerCase() || '';
      const specializations = doctor.doctor_data.specializations?.map(spec => 
        spec.specialization?.toLowerCase() || ''
      ) || [];
      
      return firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             specializations.some(spec => spec.includes(searchLower));
    }
    
    // Fallback for any other structure
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
          <p className="mt-1 text-lg text-gray-600">
            Manage doctor profiles and information.
          </p>
        </div>
        {doctors.length === 0 && (
          <button
            onClick={handleAddDoctorClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Doctor
          </button>
        )}

      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search doctors by name, email, or specialization..."
          value={searchQuery}
          onChange={handleSearch}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        />
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              onEdit={onEditDoctor}
              onAssignCalendar={onAssignCalendar}
              onDelete={onDeleteDoctor}
              calendars={calendars}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search terms.' : 'Get started by adding your first doctor.'}
          </p>
        </div>
      )}

      {/* No Doctors Modal */}
      <NoDoctorsModal
        isOpen={showNoDoctorsModal && doctors.length === 0}
        onClose={() => setShowNoDoctorsModal(false)}
        onAddDoctor={onAddDoctor || (() => {})}
      />
    </div>
  );
} 