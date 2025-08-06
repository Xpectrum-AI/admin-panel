'use client';

import { useState } from 'react';
import { useAuthInfo } from '@propelauth/react';
import axios from 'axios';
import { SyncLoader } from 'react-spinners';
import {UserPen, UserCheck, Trash, Plus, X} from "lucide-react";
import Module from 'module';
import { doctorApiService } from '@/service/doctorService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// Helper function to generate unique ID
const generateUniqueId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const now = Date.now();
  const timeStr = now.toString(36).slice(-4); // Last 4 chars of timestamp
  let result = timeStr;
  
  // Fill remaining 6 characters with random chars
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

const initialDoctorProfile = {
  doctor_id: '',
  first_name: '',
  last_name: '',
  organization_id: '',
  doctor_data: {  gender: '',
    age: '',
    experience: '',
    phone: '',
    registration_number: '',
    registration_year: '',
    registration_state: '',
    registration_country: '',
    registration_board: '',
    qualifications: [{ degree: '', university: '', year: '', place: '' }],
    specializations: [{ specialization: '', level: '' }],
    aliases: [''],
    facilities: [{ name: '', type: '', area: '', city: '', state: '', pincode: '', address: '' }],
  }
};

interface DocInfoModalProps {
  isOpen?: boolean;
  onComplete?: () => void;
  isEdit?: boolean;
  doctorData?: any;
}

export default function WelcomeSetupModal({ 
  onComplete, 
  isEdit = false, 
  doctorData = null 
}: DocInfoModalProps) {
  const { showSuccess, showError } = useErrorHandler();
  const { orgHelper } = useAuthInfo();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDoctor, setIsDoctor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(
    isEdit && doctorData ? {
      doctor_id: doctorData.doctor_id || '',
      organization_id: doctorData.organization_id || '',
      first_name: doctorData.first_name || '',
      last_name: doctorData.last_name || '',
      doctor_data: {
        gender: doctorData.doctor_data?.gender || '',
        age: doctorData.doctor_data?.age || '',
        experience: doctorData.doctor_data?.experience || '',
        phone: doctorData.doctor_data?.phone || '',
        registration_number: doctorData.doctor_data?.registration_number || '',
        registration_year: doctorData.doctor_data?.registration_year || '',
        registration_state: doctorData.doctor_data?.registration_state || '',
        registration_country: doctorData.doctor_data?.registration_country || '',
        registration_board: doctorData.doctor_data?.registration_board || '',
        qualifications: doctorData.doctor_data?.qualifications || [],
        specializations: doctorData.doctor_data?.specializations || [],
        aliases: doctorData.doctor_data?.aliases || [],
        facilities: doctorData.doctor_data?.facilities || []
      }
    } : initialDoctorProfile
  );

  // Handlers for dynamic fields
  const handleChange = (field: string, value: any) => {
    if (field === 'first_name' || field === 'last_name') {
      setDoctorProfile((prev: any) => ({ ...prev, [field]: value }));
    } else {
      setDoctorProfile((prev: any) => ({ 
        ...prev, 
        doctor_data: { ...prev.doctor_data, [field]: value } 
      }));
    }
  };

  // For array fields (qualifications, specializations, aliases, facilities)
  const handleArrayChange = (field: string, idx: number, subfield: string, value: any) => {
    setDoctorProfile((prev: any) => {
      const arr = [...prev.doctor_data[field]];
      arr[idx][subfield] = value;
      return { 
        ...prev, 
        doctor_data: { ...prev.doctor_data, [field]: arr } 
      };
    });
  };

  const addArrayItem = (field: string, template: any) => {
    setDoctorProfile((prev: any) => ({
      ...prev,
      doctor_data: {
        ...prev.doctor_data,
        [field]: [
          ...prev.doctor_data[field],
          field === 'aliases' ? '' : { ...template }
        ],
      }
    }));
  };

  const removeArrayItem = (field: string, idx: number) => {
    setDoctorProfile((prev: any) => {
      const arr = [...prev.doctor_data[field]];
      arr.splice(idx, 1);
      return { 
        ...prev, 
        doctor_data: { ...prev.doctor_data, [field]: arr } 
      };
    });
  };

  // Step navigation
  const next = () => {
    if (currentStep === 0 && isDoctor === null) {
      // If we're on step 0 and isDoctor is null, we need to select a role first
      return;
    }
    setCurrentStep((s) => s + 1);
  };
  const prev = () => setCurrentStep((s) => s - 1);

  // Submit handler
  const handleSubmit = async () => {
    const orgId = orgHelper?.getOrgs()?.[0]?.orgId;
    if (!orgId) {
      showError('No organization selected');
      return;
    }

    if (isEdit) {
      // Update existing doctor
      setLoading(true);
      try {
        await doctorApiService.updateDoctor(doctorProfile.doctor_id, doctorProfile);
        showSuccess('Doctor updated successfully');
        onComplete?.();
      } catch (e) {
        showError('Failed to update doctor. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Create new doctor
      const doctorId = generateUniqueId();
      doctorProfile.organization_id = orgId;
      doctorProfile.doctor_id = doctorId;
      setLoading(true);
      try {
        await doctorApiService.createDoctor(doctorProfile);
        showSuccess('Doctor created successfully');
        onComplete?.();
      } catch (e) {
        showError('Failed to submit. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Step Renderers ---

  // Doctor steps
  if (isDoctor) {
    // Step 1: Basic Info (or step 0 if we skipped role selection)
    if (currentStep === 1 || (currentStep === 0 && isDoctor === true)) {
      return (
        <Modal>
          <div
          role="dialog"
          aria-modal="true"
          className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
          tabIndex={-1}
          style={{ pointerEvents: "auto" }}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={onComplete}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Close</span>
          </button>

          {/* Header */}
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              Doctor Profile Setup - Step {currentStep === 0 ? 1 : currentStep} of 5
            </h2>
          </div>

          {/* Content */}
          <div className="py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="first_name">First Name</label>
                  <input
                    id="first_name"
                    placeholder="Enter first name"
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={doctorProfile.first_name}
                    onChange={e => handleChange('first_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name"
                    placeholder="Enter last name"
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={doctorProfile.last_name}
                    onChange={e => handleChange('last_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={doctorProfile.doctor_data.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                    required
                  >
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="age">Age</label>
                  <input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={doctorProfile.doctor_data.age}
                    onChange={e => handleChange('age', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    placeholder="Enter phone number"
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={doctorProfile.doctor_data.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="experience">Experience (Years)</label>
                  <input
                    id="experience"
                    type="number"
                    placeholder="Years of experience"
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={doctorProfile.doctor_data.experience}
                    onChange={e => handleChange('experience', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t border-gray-300">
            <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2  border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"></div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-10 px-4 py-2"
                onClick={next}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        </Modal>
      );
    }
    // Step 2: Registration Details (or step 1 if we skipped role selection)
    if (currentStep === 2 || (currentStep === 1 && isDoctor === true)) {
      return (
        <Modal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
            tabIndex={-1}
            style={{ pointerEvents: "auto" }}
          >
            {/* Close button */}
            <button
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={onComplete}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Close</span>
          </button>
    
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Doctor Profile Setup - Step {currentStep === 1 ? 2 : currentStep} of 5
              </h2>
            </div>
    
            {/* Content */}
            <div className="py-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Registration Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_number">Registration Number</label>
                    <input
                      id="reg_number"
                      placeholder="Registration number"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={doctorProfile.doctor_data.registration_number}
                      onChange={e => handleChange('registration_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_year">Registration Year</label>
                    <input
                      id="reg_year"
                      type="number"
                      placeholder="Year"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={doctorProfile.doctor_data.registration_year}
                      onChange={e => handleChange('registration_year', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_state">State</label>
                    <input
                      id="reg_state"
                      placeholder="State"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={doctorProfile.doctor_data.registration_state}
                      onChange={e => handleChange('registration_state', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_country">Country</label>
                    <input
                      id="reg_country"
                      placeholder="Country"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={doctorProfile.doctor_data.registration_country}
                      onChange={e => handleChange('registration_country', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_board">Board</label>
                    <input
                      id="reg_board"
                      placeholder="Medical board"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={doctorProfile.doctor_data.registration_board}
                      onChange={e => handleChange('registration_board', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
    
            {/* Footer */}
            <div className="flex justify-between pt-4 border-t border-gray-300">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-gray-300  border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                onClick={prev}
              >
                Previous
              </button>
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-10 px-4 py-2"
                  onClick={next}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }
    // Step 3: Qualifications (or step 2 if we skipped role selection)
    if (currentStep === 3 || (currentStep === 2 && isDoctor === true)) {
      return (
        <Modal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
            tabIndex={-1}
            style={{ pointerEvents: "auto" }}
          >

              <button
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={onComplete}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Close</span>
          </button>    
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Doctor Profile Setup - Step {currentStep === 2 ? 3 : currentStep} of 5
              </h2>
            </div>
    
            {/* Content */}
            <div className="py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Qualifications</h3>
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-9 rounded-md px-3"
                    onClick={() => addArrayItem('qualifications', { degree: '', university: '', year: '', place: '' })}
                  >
                    <Plus />
                    Add Qualification
                  </button>
                </div>
                {doctorProfile.doctor_data.qualifications.map((q: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-gray-300 bg-card text-card-foreground">
                    <div className="flex flex-col space-y-1.5 p-6 pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold tracking-tight text-sm">Qualification {idx + 1}</h3>
                        <button
                          onClick={() => removeArrayItem('qualifications', idx)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Remove qualification"
                        >
                          <Trash />
                        </button>
                      </div>
                    </div>
                    <div className="p-6 pt-0 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`degree_${idx}`}>Degree Name</label>
                        <input
                          id={`degree_${idx}`}
                          placeholder="e.g., MBBS, MD"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={q.degree}
                          onChange={e => handleArrayChange('qualifications', idx, 'degree', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`year_${idx}`}>Year</label>
                        <input
                          id={`year_${idx}`}
                          type="number"
                          placeholder="Year"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={q.year}
                          onChange={e => handleArrayChange('qualifications', idx, 'year', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`university_${idx}`}>University</label>
                        <input
                          id={`university_${idx}`}
                          placeholder="University name"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={q.university}
                          onChange={e => handleArrayChange('qualifications', idx, 'university', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`place_${idx}`}>Place</label>
                        <input
                          id={`place_${idx}`}
                          placeholder="City"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={q.place}
                          onChange={e => handleArrayChange('qualifications', idx, 'place', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
    
            {/* Footer */}
            <div className="flex justify-between pt-4 border-t border-gray-300">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-gray-300  border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                onClick={prev}
              >
                Previous
              </button>
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-10 px-4 py-2"
                  onClick={next}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }
    // Step 4: Specializations & Aliases (or step 3 if we skipped role selection)
    if (currentStep === 4 || (currentStep === 3 && isDoctor === true)) {
      return (
        <Modal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
            tabIndex={-1}
            style={{ pointerEvents: "auto" }}
          >
            <button
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={onComplete}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Close</span>
          </button>
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Doctor Profile Setup - Step 4 of 5
              </h2>
            </div>
    
            {/* Content */}
            <div className="py-4">
              <div className="space-y-4">
                {/* Specializations Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Specializations</h3>
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-9 rounded-md px-3"
                    onClick={() => addArrayItem('specializations', { specialization: '', level: '' })}
                  >
                    <Plus/>
                    Add Specialization
                  </button>
                </div>
                {/* Specializations List */}
                {doctorProfile.doctor_data.specializations.map((s: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-gray-300 bg-card text-card-foreground mb-2">
                    <div className="flex flex-col space-y-1.5 p-6 pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold tracking-tight text-sm">Specialization {idx + 1}</h3>
                        <button
                          onClick={() => removeArrayItem('specializations', idx)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Remove specialization"
                        >
                          <Trash/>
                        </button>
                      </div>
                    </div>
                    <div className="p-6 pt-0 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`specialization_${idx}`}>Specialization</label>
                        <input
                          id={`specialization_${idx}`}
                          placeholder="e.g., gynecologist, cardiologist"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={s.specialization}
                          onChange={e => handleArrayChange('specializations', idx, 'specialization', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`level_${idx}`}>Level</label>
                        <select
                          id={`level_${idx}`}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={s.level}
                          onChange={e => handleArrayChange('specializations', idx, 'level', e.target.value)}
                        >
                          <option value="">Level</option>
                          <option>Junior</option>
                          <option>Senior</option>
                          <option>Consultant</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
    
                {/* Aliases Header */}
                <div className="flex items-center justify-between mt-4">
                  <h4 className="font-medium">Aliases</h4>
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-9 rounded-md px-3"
                    onClick={() => addArrayItem('aliases', '')}
                  >
                    <Plus/>
                    Add Alias
                  </button>
                </div>
                {/* Aliases List */}
                {doctorProfile.doctor_data.aliases.map((a: string, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      placeholder="e.g., Dr. Smith, Doc"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={a}
                      onChange={e => {
                        const arr = [...doctorProfile.doctor_data.aliases];
                        arr[idx] = e.target.value;
                        setDoctorProfile((prev: any) => ({ 
                          ...prev, 
                          doctor_data: { ...prev.doctor_data, aliases: arr } 
                        }));
                      }}
                    />
                    <button
                      onClick={() => removeArrayItem('aliases', idx)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Remove alias"
                    >
                      <Trash/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
    
            {/* Footer */}
            <div className="flex justify-between pt-4 border-t border-gray-300">
              <button
                className="inline-flex  items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-gray-300  border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                onClick={prev}
              >
                Previous
              </button>
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-10 px-4 py-2"
                  onClick={next}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }
    // Step 5: Practice Facilities (or step 4 if we skipped role selection)
    if (currentStep === 5 || (currentStep === 4 && isDoctor === true)) {
      return (
        <Modal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
            tabIndex={-1}
            style={{ pointerEvents: "auto" }}
          >
            <button
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={onComplete}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
            <span className="sr-only">Close</span>
          </button>
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Doctor Profile Setup - Step {currentStep === 4 ? 5 : currentStep} of 5
              </h2>
            </div>
    
            {/* Content */}
            <div className="py-4">
              <div className="space-y-4">
                {/* Facilities Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Practice Facilities</h3>
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-9 rounded-md px-3"
                    onClick={() => addArrayItem('facilities', { name: '', type: '', area: '', city: '', state: '', pincode: '', address: '' })}
                  >
                    <Plus/>
                    Add Facility
                  </button>
                </div>
                {/* Facilities List */}
                {doctorProfile.doctor_data.facilities.map((f: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-gray-300 bg-card text-card-foreground mb-2">
                    <div className="flex flex-col space-y-1.5 p-6 pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold tracking-tight text-sm">Facility {idx + 1}</h3>
                        <button
                          onClick={() => removeArrayItem('facilities', idx)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Remove facility"
                        >
                          <Trash/>
                        </button>
                      </div>
                    </div>
                    <div className="p-6 pt-0 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`facility_name_${idx}`}>Facility Name</label>
                        <input
                          id={`facility_name_${idx}`}
                          placeholder="Hospital/Clinic name"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={f.name}
                          onChange={e => handleArrayChange('facilities', idx, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`facility_type_${idx}`}>Type</label>
                        <input
                          id={`facility_type_${idx}`}
                          placeholder="Type (e.g., Hospital, Clinic)"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={f.type}
                          onChange={e => handleArrayChange('facilities', idx, 'type', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`facility_area_${idx}`}>Area</label>
                        <input
                          id={`facility_area_${idx}`}
                          placeholder="Area/Locality"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={f.area}
                          onChange={e => handleArrayChange('facilities', idx, 'area', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`facility_city_${idx}`}>City</label>
                        <input
                          id={`facility_city_${idx}`}
                          placeholder="City"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={f.city}
                          onChange={e => handleArrayChange('facilities', idx, 'city', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`facility_state_${idx}`}>State</label>
                        <input
                          id={`facility_state_${idx}`}
                          placeholder="State"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={f.state}
                          onChange={e => handleArrayChange('facilities', idx, 'state', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`facility_pincode_${idx}`}>Pincode</label>
                        <input
                          id={`facility_pincode_${idx}`}
                          placeholder="Pincode"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={f.pincode}
                          onChange={e => handleArrayChange('facilities', idx, 'pincode', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium leading-none" htmlFor={`facility_address_${idx}`}>Address</label>
                        <textarea
                          id={`facility_address_${idx}`}
                          placeholder="Full address"
                          className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={f.address}
                          onChange={e => handleArrayChange('facilities', idx, 'address', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
    
            {/* Footer */}
            <div className="flex justify-between pt-4 border-t border-gray-300">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-gray-300 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                onClick={prev}
              >
                Previous
              </button>
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-10 px-4 py-2"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <SyncLoader size={8} color="#fff" /> : (isEdit ? 'Edit Doctor' : 'Create Doctor')}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }
  }

  // Not a doctor: simple info or skip
  if (!isDoctor && currentStep === 1) {
    return (
      <Modal>
        <h2 className="text-lg font-bold mb-2">Welcome Setup</h2>
        <div className="mb-4">Thank you! You can now use the dashboard.</div>
        <div className="flex justify-between pt-4 border-t border-gray-300">
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-gray-300 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" onClick={prev}>
            Previous
            </button>
          <button 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-10 px-4 py-2" 
            onClick={handleSubmit} 
            disabled={loading}>
            {loading ? <SyncLoader size={8} color="#fff" /> : 'Complete Setup'}
          </button>
        </div>
      </Modal>
    );
  }

  return null;
}

// Simple modal wrapper
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in max-h-[90vh] flex flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}