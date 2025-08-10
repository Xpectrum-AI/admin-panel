'use client';

import { useState } from 'react';
import { useAuthInfo } from '@propelauth/react';
import axios from 'axios';
import { SyncLoader } from 'react-spinners';
import {UserPen, UserCheck, Trash, Plus} from "lucide-react";
import Module from 'module';

const API_BASE_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || '';

const initialDoctorProfile = {
  first_name: '',
  last_name: '',
  gender: '',
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
};

export default function WelcomeSetupModal({ onComplete }: { onComplete: () => void }) {
  const { accessToken } = useAuthInfo();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0: Role selection
  const [isDoctor, setIsDoctor] = useState<boolean | null>(null);

  // Doctor profile state
  const [doctorProfile, setDoctorProfile] = useState<any>(initialDoctorProfile);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Validation functions
  const validateAge = (age: string) => {
    const ageNum = parseInt(age);
    const currentYear = new Date().getFullYear();
    
    if (age && (ageNum < 18 || ageNum > 100)) {
      return 'Age must be between 18 and 100 years (doctor must be at least 23 when starting practice)';
    }
    return '';
  };

  const validateQualificationYear = (qualYear: string, age: string) => {
    const qualYearNum = parseInt(qualYear);
    const ageNum = parseInt(age);
    const currentYear = new Date().getFullYear();
    
    if (qualYear && age) {
      const minQualYear = currentYear - ageNum + 23;
      if (qualYearNum < minQualYear) {
        return `Qualification year must be at least ${minQualYear} (doctor must be at least 23 when qualifying)`;
      }
    }
    return '';
  };

  const validateQualificationYearConsistency = (qualifications: any[]) => {
    if (qualifications.length < 2) return '';
    
    const years = qualifications.map(q => q.year).filter(year => year.trim() !== '');
    if (years.length < 2) return '';
    
    const uniqueYears = [...new Set(years)];
    if (uniqueYears.length > 1) {
      return 'All qualification years must be the same';
    }
    return '';
  };

  const validateRegistrationYear = (regYear: string, qualYear: string) => {
    const regYearNum = parseInt(regYear);
    const qualYearNum = parseInt(qualYear);
    const currentYear = new Date().getFullYear();
    
    if (regYear && qualYear && regYearNum < qualYearNum) {
      return 'Registration year must be after or equal to qualification year';
    }
    
    if (regYear && regYearNum > currentYear) {
      return 'Registration year cannot be in the future';
    }
    return '';
  };

  const validateExperience = (experience: string, age: string, regYear: string) => {
    const expNum = parseInt(experience);
    const ageNum = parseInt(age);
    const regYearNum = parseInt(regYear);
    const currentYear = new Date().getFullYear();
    
    if (experience && age && expNum > ageNum - 23) {
      return `Experience cannot exceed ${ageNum - 23} years (doctor must be at least 23 when starting practice)`;
    }
    
    if (experience && regYear) {
      const maxExpFromReg = currentYear - regYearNum;
      if (expNum > maxExpFromReg) {
        return `Experience cannot exceed ${maxExpFromReg} years based on registration year`;
      }
    }
    return '';
  };

  // Helper function to get error message for a field
  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName] || '';
  };

  // Handlers for dynamic fields
  const handleChange = (field: string, value: any) => {
    setDoctorProfile((prev: any) => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Validate last name
    if (field === 'last_name') {
      if (value.trim().length > 0 && value.trim().length < 2) {
        setValidationErrors(prev => ({ ...prev, last_name: 'Last name must be at least 2 characters' }));
      }
    }
    
    // Validate age
    if (field === 'age') {
      const ageError = validateAge(value);
      setValidationErrors(prev => ({
        ...prev,
        age: ageError
      }));
    }
    
    // Validate experience
    if (field === 'experience') {
      const expError = validateExperience(value, doctorProfile.age, doctorProfile.registration_year);
      setValidationErrors(prev => ({
        ...prev,
        experience: expError
      }));
    }
    
    // Validate registration year
    if (field === 'registration_year') {
      const yearError = validateRegistrationYear(value, doctorProfile.qualifications?.[0]?.year || '');
      setValidationErrors(prev => ({ ...prev, registration_year: yearError }));
    }
  };

  // For array fields (qualifications, specializations, aliases, facilities)
  const handleArrayChange = (field: string, idx: number, subfield: string, value: any) => {
    setDoctorProfile((prev: any) => {
      const arr = [...prev[field]];
      arr[idx][subfield] = value;
      return { ...prev, [field]: arr };
    });

    // Validate qualification year consistency when qualification years change
    if (field === 'qualifications' && subfield === 'year') {
      const updatedQualifications = [...doctorProfile.qualifications];
      updatedQualifications[idx][subfield] = value;
      const consistencyError = validateQualificationYearConsistency(updatedQualifications);
      
      if (consistencyError) {
        setValidationErrors(prev => ({ ...prev, qualification_consistency: consistencyError }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.qualification_consistency;
          return newErrors;
        });
      }
    }
  };

  const addArrayItem = (field: string, template: any) => {
    setDoctorProfile((prev: any) => ({
      ...prev,
      [field]: [
        ...prev[field],
        field === 'aliases' ? '' : { ...template }
      ],
    }));
  };

  const removeArrayItem = (field: string, idx: number) => {
    setDoctorProfile((prev: any) => {
      const arr = [...prev[field]];
      arr.splice(idx, 1);
      return { ...prev, [field]: arr };
    });
  };

  // Step validation function
  const validateCurrentStep = () => {
    const errors: {[key: string]: string} = {};
    
    if (step === 1) {
      // Step 1: Basic Info validation
      if (!doctorProfile.first_name.trim()) errors.first_name = 'First name is required';
      if (!doctorProfile.last_name.trim()) errors.last_name = 'Last name is required';
      if (doctorProfile.last_name.trim().length < 2) errors.last_name = 'Last name must be at least 2 characters';
      if (!doctorProfile.gender) errors.gender = 'Gender is required';
      if (!doctorProfile.age) errors.age = 'Age is required';
      
      // Validate age
      const ageError = validateAge(doctorProfile.age);
      if (ageError) {
        errors.age = ageError;
      }
    }
    
    if (step === 2) {
      // Step 2: Registration Details validation
      if (!doctorProfile.registration_number.trim()) errors.registration_number = 'Registration number is required';
      if (!doctorProfile.registration_year) errors.registration_year = 'Registration year is required';
      if (!doctorProfile.experience) errors.experience = 'Experience is required';
      
      // Validate experience
      if (doctorProfile.experience && doctorProfile.age && doctorProfile.registration_year) {
        const expError = validateExperience(doctorProfile.experience, doctorProfile.age, doctorProfile.registration_year);
        if (expError) {
          errors.experience = expError;
        }
      }
    }

    if (step === 3) {
      // Step 3: Qualifications validation
      const qualifications = doctorProfile.qualifications;
      qualifications.forEach((qual: any, idx: number) => {
        if (!qual.degree.trim()) errors[`qualifications_${idx}_degree`] = 'Degree name is required';
        if (!qual.year.trim()) errors[`qualifications_${idx}_year`] = 'Qualification year is required';
        if (!qual.university.trim()) errors[`qualifications_${idx}_university`] = 'University name is required';
      });

      // Validate qualification year consistency
      const consistencyError = validateQualificationYearConsistency(qualifications);
      if (consistencyError) {
        errors.qualification_consistency = consistencyError;
      }
    }
    return errors;
  };

  // Step navigation
  const next = () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setStep((s) => s + 1);
  };
  const prev = () => setStep((s) => s - 1);

  // Submit handler
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/welcome-form/submit`,
        {
          is_doctor: isDoctor,
          ...doctorProfile,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      onComplete();
    } catch (e) {
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Step Renderers ---

  // Step 0: Role selection
  if (step === 0) {
    return (
      <Modal>
        <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
        tabIndex={-1}
        style={{ pointerEvents: "auto" }}
      >
        
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            Welcome Setup
          </h2>
        </div>

        {/* Content */}
        <div className="py-4">
          <div className="space-y-6">
            <div className="text-center">
              <UserCheck className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">
                Welcome to the Dashboard!
              </h3>
              <p className="text-muted-foreground">Are you a doctor?</p>
            </div>
            <div
              role="radiogroup"
              aria-required="false"
              className="grid gap-2"
              tabIndex={0}
              style={{ outline: "none" }}
            >
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={isDoctor === true}
                  data-state={isDoctor === true ? "checked" : "unchecked"}
                  className={`aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isDoctor === true ? "bg-primary" : ""}`}
                  id="yes"
                  tabIndex={-1}
                  onClick={() => setIsDoctor(true)}
                >
                  {isDoctor === true && (
                    <span className="flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={10}
                        height={10}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-2.5 w-2.5 fill-current text-current"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    </span>
                  )}
                </button>
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor="yes"
                  onClick={() => setIsDoctor(true)}
                >
                  Yes, I am a doctor
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={isDoctor === false}
                  data-state={isDoctor === false ? "checked" : "unchecked"}
                  className={`aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isDoctor === false ? "bg-primary" : ""}`}
                  id="no"
                  tabIndex={-1}
                  onClick={() => setIsDoctor(false)}
                >
                  {isDoctor === false && (
                    <span className="flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={10}
                        height={10}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-2.5 w-2.5 fill-current text-current"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    </span>
                  )}
                </button>
                <label
                  className="text-sm font-medium leading-none"
                  htmlFor="no"
                  onClick={() => setIsDoctor(false)}
                >
                  No, I am not a doctor
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-gray-300">
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm text-gray-700 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-gray-300 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            disabled
          >
            Previous
          </button>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-black text-white hover:bg-gray-900 h-10 px-4 py-2"
              disabled={isDoctor === null}
              onClick={next}
            >
              {isDoctor ? "Continue as Doctor" : "Continue as Non-Doctor"}
            </button>
          </div>
        </div>
      </div>
      </Modal>
    );
  }

  // Doctor steps
  if (isDoctor) {
    // Step 1: Basic Info
    if (step === 1) {
      return (
        <Modal>
          <div
          role="dialog"
          aria-modal="true"
          className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
          tabIndex={-1}
          style={{ pointerEvents: "auto" }}
        >

          {/* Header */}
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              Doctor Profile Setup - Step 1 of 5
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
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      getFieldError('first_name') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={doctorProfile.first_name}
                    onChange={e => handleChange('first_name', e.target.value)}
                  />
                  {getFieldError('first_name') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('first_name')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name"
                    placeholder="Enter last name"
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      getFieldError('last_name') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={doctorProfile.last_name}
                    onChange={e => handleChange('last_name', e.target.value)}
                  />
                  {getFieldError('last_name') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('last_name')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      getFieldError('gender') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={doctorProfile.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  {getFieldError('gender') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('gender')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="age">Age</label>
                  <input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      getFieldError('age') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={doctorProfile.age}
                    onChange={e => handleChange('age', e.target.value)}
                  />
                  {getFieldError('age') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('age')}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium leading-none" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    placeholder="Enter phone number"
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={doctorProfile.phone}
                    onChange={e => handleChange('phone', e.target.value)}
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
    // Step 2: Registration Details
    if (step === 2) {
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x h-4 w-4"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
    
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Doctor Profile Setup - Step 2 of 5
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
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        getFieldError('registration_number') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={doctorProfile.registration_number}
                      onChange={e => handleChange('registration_number', e.target.value)}
                    />
                    {getFieldError('registration_number') && (
                      <p className="text-sm text-red-500 mt-1">{getFieldError('registration_number')}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_year">Registration Year</label>
                    <input
                      id="reg_year"
                      type="number"
                      placeholder="Year"
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        getFieldError('registration_year') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={doctorProfile.registration_year}
                      onChange={e => handleChange('registration_year', e.target.value)}
                    />
                    {getFieldError('registration_year') && (
                      <p className="text-sm text-red-500 mt-1">{getFieldError('registration_year')}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_state">State</label>
                    <input
                      id="reg_state"
                      placeholder="State"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={doctorProfile.registration_state}
                      onChange={e => handleChange('registration_state', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_country">Country</label>
                    <input
                      id="reg_country"
                      placeholder="Country"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={doctorProfile.registration_country}
                      onChange={e => handleChange('registration_country', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="reg_board">Board</label>
                    <input
                      id="reg_board"
                      placeholder="Medical board"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={doctorProfile.registration_board}
                      onChange={e => handleChange('registration_board', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none" htmlFor="experience">Experience (Years)</label>
                    <input
                      id="experience"
                      type="number"
                      placeholder="Years of experience"
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        getFieldError('experience') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={doctorProfile.experience}
                      onChange={e => handleChange('experience', e.target.value)}
                      required
                    />
                    {getFieldError('experience') && (
                      <p className="text-sm text-red-500 mt-1">{getFieldError('experience')}</p>
                    )}
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
    // Step 3: Qualifications
    if (step === 3) {
      return (
        <Modal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
            tabIndex={-1}
            style={{ pointerEvents: "auto" }}
          >
            
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Doctor Profile Setup - Step 3 of 5
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
                {doctorProfile.qualifications.map((q: any, idx: number) => (
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
                          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            validationErrors[`qualifications_${idx}_degree`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={q.degree}
                          onChange={e => handleArrayChange('qualifications', idx, 'degree', e.target.value)}
                        />
                        {validationErrors[`qualifications_${idx}_degree`] && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors[`qualifications_${idx}_degree`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`year_${idx}`}>Year</label>
                        <input
                          id={`year_${idx}`}
                          type="number"
                          placeholder="Year"
                          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            validationErrors[`qualifications_${idx}_year`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={q.year}
                          onChange={e => handleArrayChange('qualifications', idx, 'year', e.target.value)}
                        />
                        {validationErrors[`qualifications_${idx}_year`] && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors[`qualifications_${idx}_year`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium leading-none" htmlFor={`university_${idx}`}>University</label>
                        <input
                          id={`university_${idx}`}
                          placeholder="University name"
                          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            validationErrors[`qualifications_${idx}_university`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={q.university}
                          onChange={e => handleArrayChange('qualifications', idx, 'university', e.target.value)}
                        />
                        {validationErrors[`qualifications_${idx}_university`] && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors[`qualifications_${idx}_university`]}</p>
                        )}
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
                {validationErrors.qualification_consistency && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{validationErrors.qualification_consistency}</p>
                  </div>
                )}
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
    // Step 4: Specializations & Aliases
    if (step === 4) {
      return (
        <Modal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
            tabIndex={-1}
            style={{ pointerEvents: "auto" }}
          >
    
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
                {doctorProfile.specializations.map((s: any, idx: number) => (
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
                {doctorProfile.aliases.map((a: string, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      placeholder="e.g., Dr. Smith, Doc"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={a}
                      onChange={e => {
                        const arr = [...doctorProfile.aliases];
                        arr[idx] = e.target.value;
                        setDoctorProfile((prev: any) => ({ ...prev, aliases: arr }));
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
    // Step 5: Practice Facilities
    if (step === 5) {
      return (
        <Modal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg overflow-y-auto"
            tabIndex={-1}
            style={{ pointerEvents: "auto" }}
          >
      
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Doctor Profile Setup - Step 5 of 5
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
                {doctorProfile.facilities.map((f: any, idx: number) => (
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
                  {loading ? <SyncLoader size={8} color="#fff" /> : 'Complete Setup'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }
  }

  // Not a doctor: simple info or skip
  if (!isDoctor && step === 1) {
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