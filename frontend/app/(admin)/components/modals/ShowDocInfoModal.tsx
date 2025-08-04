'use client';

import { useState } from 'react';
import { X, User, GraduationCap, Stethoscope, Building, Trash, Plus } from 'lucide-react';

interface ShowDocInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: any;
}

export default function ShowDocInfoModal({ isOpen, onClose, doctor }: ShowDocInfoModalProps) {
  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          type="button"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-500" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Doctor Information
          </h2>
          <p className="text-gray-600 mt-1">
            {doctor.first_name} {doctor.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">First Name:</span>
                <span className="font-medium">{doctor.first_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Name:</span>
                <span className="font-medium">{doctor.last_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Age:</span>
                <span className="font-medium">{doctor.doctor_data?.age || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone Number:</span>
                <span className="font-medium">{doctor.doctor_data?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experience (Years):</span>
                <span className="font-medium">{doctor.doctor_data?.experience || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gender:</span>
                <span className="font-medium">{doctor.doctor_data?.gender || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Registration Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Registration Number:</span>
                <span className="font-medium">{doctor.doctor_data?.registration_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registration Year:</span>
                <span className="font-medium">{doctor.doctor_data?.registration_year || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">State:</span>
                <span className="font-medium">{doctor.doctor_data?.registration_state || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span className="font-medium">{doctor.doctor_data?.registration_country || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Board:</span>
                <span className="font-medium">{doctor.doctor_data?.registration_board || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Qualifications Card */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Qualifications</h3>
            </div>
          </div>
          <div className="space-y-4">
            {doctor.doctor_data?.qualifications && doctor.doctor_data.qualifications.length > 0 ? (
              doctor.doctor_data.qualifications.map((qualification: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Qualification {index + 1}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Degree:</span>
                      <p className="font-medium">{qualification.degree || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">University:</span>
                      <p className="font-medium">{qualification.university || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Year:</span>
                      <p className="font-medium">{qualification.year || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Place:</span>
                      <p className="font-medium">{qualification.place || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No qualifications added</p>
            )}
          </div>
        </div>

        {/* Specializations Card */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Specializations</h3>
            </div>
          </div>
          <div className="space-y-4">
            {doctor.doctor_data?.specializations && doctor.doctor_data.specializations.length > 0 ? (
              doctor.doctor_data.specializations.map((specialization: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Specialization {index + 1}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Specialization:</span>
                      <p className="font-medium">{specialization.specialization || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Level:</span>
                      <p className="font-medium">{specialization.level || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No specializations added</p>
            )}
          </div>
        </div>

        {/* Professional Aliases Card */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Professional Aliases</h3>
          </div>
          <div className="space-y-2">
            {doctor.doctor_data?.aliases && doctor.doctor_data.aliases.length > 0 ? (
              doctor.doctor_data.aliases.map((alias: string, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="font-medium">{alias}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No aliases added</p>
            )}
          </div>
        </div>

        {/* Practice Facilities Card */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Practice Facilities</h3>
            </div>
          </div>
          <div className="space-y-4">
            {doctor.doctor_data?.facilities && doctor.doctor_data.facilities.length > 0 ? (
              doctor.doctor_data.facilities.map((facility: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Facility {index + 1}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Facility Name:</span>
                      <p className="font-medium">{facility.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium">{facility.type || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Area:</span>
                      <p className="font-medium">{facility.area || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">City:</span>
                      <p className="font-medium">{facility.city || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">State:</span>
                      <p className="font-medium">{facility.state || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Pincode:</span>
                      <p className="font-medium">{facility.pincode || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Address:</span>
                      <p className="font-medium">{facility.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No facilities added</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 