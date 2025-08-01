"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Eye, EyeOff, Phone, MapPin, User2, Save, Plus, Trash, GraduationCap, Stethoscope, Building, Lock, UserCheck } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { useAuthFrontendApis } from '@propelauth/frontend-apis-react';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useRouter } from 'next/navigation';

export default function AccountSettings() {
  const { user } = useAuthInfo();
  const { showError, showSuccess } = useErrorHandler();
  const router = useRouter();

  // Mock data for phone and location
  const phone = '+1 (555) 123-4567';
  const location = 'San Francisco, CA';
  const role = 'Account Member';

  const [formData, setFormData] = useState({
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: phone,
    location: location,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { updateUserMetadata, updatePassword } = useAuthFrontendApis();
  const [editing, setEditing] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [savedData, setSavedData] = useState({
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: phone,
    location: location,
  });

  // Doctor profile state (similar to WelcomeSetupModel)
  const [doctorProfile, setDoctorProfile] = useState({
    first_name: user?.firstName || 'Meena',
    last_name: user?.lastName || 'Desai',
    gender: 'Female',
    age: '30',
    experience: '10',
    phone: '9876543210',
    registration_number: '1234567890',
    registration_year: '2010',
    registration_state: 'Karnataka',
    registration_country: 'India',
    registration_board: 'MCI',
    qualifications: [
      { degree: 'MBBS', university: 'University of Mumbai', year: '2010', place: 'Mumbai' },
      { degree: 'MD', university: 'University of Mumbai', year: '2012', place: 'Mumbai' }
    ],
    specializations: [
      { specialization: 'gynecologist', level: 'Senior' },
      { specialization: 'obstetrician', level: 'Senior' }
    ],
    aliases: ['Dr. Meena', 'Dr. Desai'],
    facilities: [
      { 
        name: 'Fortis Hospital', 
        type: 'Hospital', 
        area: 'Bannerghatta', 
        city: 'Bangalore', 
        state: 'Karnataka', 
        pincode: '560076', 
        address: '154, Bannerghatta Road, Bangalore' 
      },
      { 
        name: 'Desai Skin Clinic', 
        type: 'Clinic', 
        area: 'Jayanagar', 
        city: 'Bangalore', 
        state: 'Karnataka', 
        pincode: '560076', 
        address: '123, Main Road, Jayanagar' 
      }
    ],
  });

  // Handlers for dynamic fields (similar to WelcomeSetupModel)
  const handleDoctorChange = (field: string, value: any) => {
    setDoctorProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: string, idx: number, subfield: string, value: any) => {
    setDoctorProfile((prev: any) => {
      const arr = [...prev[field]];
      arr[idx][subfield] = value;
      return { ...prev, [field]: arr };
    });
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

  useEffect(() => {
    if (user) {
      const newData = {
        firstName: user.firstName || 'John',
        lastName: user.lastName || 'Doe',
        email: user.email || 'john.doe@example.com',
        phone: phone,
        location: location,
      };
      setFormData(newData);
      setSavedData(newData);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setFormData(savedData);
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData(savedData);
    setEditing(false);
  };

  const handlePasswordEdit = () => {
    setPasswordEditing(true);
  };

  const handlePasswordCancel = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setPasswordEditing(false);
  };

  const hasChanges = () => {
    return (
      formData.firstName !== savedData.firstName ||
      formData.lastName !== savedData.lastName ||
      formData.phone !== savedData.phone ||
      formData.location !== savedData.location
    );
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges()) {
      showError('No changes detected. Please make changes before saving.');
      return;
    }
    try {
      const response = await updateUserMetadata({
        first_name: formData.firstName,
        last_name: formData.lastName,
      });
      await response.handle({
        success: () => {
          showSuccess('Account information updated successfully!');
          setSavedData(formData);
          setEditing(false);
        },
        badRequest: () => {
          showError('Error updating account information.');
        },
        unexpectedOrUnhandled: () => {
          showError('An unexpected error occurred. Please try again.');
        },
      });
    } catch {
      showError('Failed to update account information. Please try again.');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New password and confirm password do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showError('New password must be at least 8 characters long');
      return;
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      showError('New password cannot be the same as the current password');
      return;
    }
    try {
      const response = await updatePassword({
        current_password: passwordData.currentPassword,
        password: passwordData.newPassword,
      });
      await response.handle({
        success: () => {
          showSuccess('Password updated successfully!');
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setShowCurrent(false);
          setShowNew(false);
          setShowConfirm(false);
          setPasswordEditing(false);
        },
        badRequest: () => {
          showError('Error updating password.');
        },
        unexpectedOrUnhandled: () => {
          showError('An unexpected error occurred. Please try again.');
        },
      });
    } catch {
      showError('Failed to update password. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8fafc]">
        {/* Header */}
        <div className="flex items-center px-8 py-6 border-b border-gray-200 mb-10">
          <button
            onClick={() => router.push("/dashboard")}
            className="group mr-3"
            aria-label="Back"
          >
            <span className="inline-flex items-center justify-center rounded-lg transition bg-transparent group-hover:bg-gray-100 h-9 w-9">
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
            </span>
          </button>
          <h1 className="text-2xl md:text-2xl font-bold text-gray-900">Account Settings</h1>
        </div>
        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {savedData.firstName?.[0]}{savedData.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{savedData.firstName} {savedData.lastName}</div>
              <div className="text-gray-500 text-sm mb-2">{savedData.email}</div>
            </div>
            <div className="w-full space-y-2 text-gray-700 text-sm">
            <div className="flex items-center gap-2"><User2 className="h-4 w-4" />{role}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{savedData.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{savedData.phone}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{savedData.location}</div>
            </div>
          </div>

          {/* Multi-Card Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.first_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.last_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Age</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.age}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.phone}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Experience (Years)</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.experience}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.gender}</div>
                </div>
              </div>
            </div>

            {/* Registration Details Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Registration Number</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.registration_number}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Registration Year</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.registration_year}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">State</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.registration_state}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.registration_country}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Board</label>
                  <div className="text-sm text-gray-900 mt-1">{doctorProfile.registration_board}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="text-sm text-green-600 mt-1">Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Qualifications Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Qualifications</h3>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-medium bg-black text-white hover:bg-gray-900 h-9 rounded-md px-3">
                <Plus className="h-4 w-4" />
                Add Qualification
              </button>
            </div>
            {doctorProfile.qualifications.map((q: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Qualification {idx + 1}</h4>
                  <button className="text-red-500 hover:text-red-700">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Degree</label>
                    <div className="text-sm text-gray-900 mt-1">{q.degree}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">University</label>
                    <div className="text-sm text-gray-900 mt-1">{q.university}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Year</label>
                    <div className="text-sm text-gray-900 mt-1">{q.year}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Place</label>
                    <div className="text-sm text-gray-900 mt-1">{q.place}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Specializations Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Specializations</h3>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-medium bg-black text-white hover:bg-gray-900 h-9 rounded-md px-3">
                <Plus className="h-4 w-4" />
                Add Specialization
              </button>
            </div>
            {doctorProfile.specializations.map((s: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Specialization {idx + 1}</h4>
                  <button className="text-red-500 hover:text-red-700">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Specialization</label>
                    <div className="text-sm text-gray-900 mt-1">{s.specialization}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Level</label>
                    <div className="text-sm text-gray-900 mt-1">{s.level}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Professional Aliases Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Aliases</h3>
            <div className="space-y-2">
              {doctorProfile.aliases.map((alias: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{alias}</span>
                  <button className="text-red-500 hover:text-red-700">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Facilities Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Practice Facilities</h3>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-medium bg-black text-white hover:bg-gray-900 h-9 rounded-md px-3">
                <Plus className="h-4 w-4" />
                Add Facility
              </button>
            </div>
            {doctorProfile.facilities.map((f: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Facility {idx + 1}</h4>
                  <button className="text-red-500 hover:text-red-700">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Facility Name</label>
                    <div className="text-sm text-gray-900 mt-1">{f.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <div className="text-sm text-gray-900 mt-1">{f.type}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Area</label>
                    <div className="text-sm text-gray-900 mt-1">{f.area}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <div className="text-sm text-gray-900 mt-1">{f.city}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">State</label>
                    <div className="text-sm text-gray-900 mt-1">{f.state}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pincode</label>
                    <div className="text-sm text-gray-900 mt-1">{f.pincode}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <div className="text-sm text-gray-900 mt-1">{f.address}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                </div>
                {!passwordEditing && (
                  <button
                    type="button"
                    onClick={handlePasswordEdit}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800"
                  >
                    Change Password
                  </button>
                )}
              </div>
              {passwordEditing && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-12"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-900 focus:outline-none transition group"
                        onClick={() => setShowCurrent((v) => !v)}
                        aria-label={showCurrent ? 'Hide password' : 'Show password'}
                        style={{ top: 0, bottom: 0 }}
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-gray-100 transition">
                          {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-12"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-900 focus:outline-none transition group"
                        onClick={() => setShowNew((v) => !v)}
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                        style={{ top: 0, bottom: 0 }}
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-gray-100 transition">
                          {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-12"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-900 focus:outline-none transition group"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        style={{ top: 0, bottom: 0 }}
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-gray-100 transition">
                          {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 gap-2">
                    <button
                      type="button"
                      onClick={handlePasswordCancel}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 shadow"
                    >
                      <Save className="h-5 w-5" />
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 