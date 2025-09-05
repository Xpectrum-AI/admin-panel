'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Search, User, AlertCircle, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getAllAgentsPhoneNumbers,
  addUpdateAgentPhoneNumber,
  getAvailablePhoneNumbersByOrg,
  AgentPhoneNumber,
  unassignPhoneNumber
} from '../../service/phoneNumberService';
import { agentConfigService } from '../../service/agentConfigService';

interface PhoneNumbersTabProps {}

export default function PhoneNumbersTab({}: PhoneNumbersTabProps) {
  // Use theme with fallback to prevent errors
  let isDarkMode = false;
  try {
    const theme = useTheme();
    isDarkMode = theme?.isDarkMode || false;
  } catch (error) {
    isDarkMode = false;
  }
  const [phoneNumbers, setPhoneNumbers] = useState<AgentPhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<AgentPhoneNumber | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningAgent, setAssigningAgent] = useState('');
  const [assigningPhoneNumber, setAssigningPhoneNumber] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for organization-based assignment
  const [agents, setAgents] = useState<any[]>([]);
  const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(false);

  // Load phone numbers on component mount
  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  // Load agents and available phone numbers on component mount
  useEffect(() => {
    loadAgents();
    loadAvailablePhoneNumbers();
  }, []);

  const loadPhoneNumbers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllAgentsPhoneNumbers();
      
      // Handle different response formats - check both success and status fields
      const isSuccess = response.success || (response as any).status === 'success';
      
      if (isSuccess) {
        let phoneNumbersArray: AgentPhoneNumber[] = [];
        
        // Check if data exists in response.data or response directly
        const responseData = response.data || response;
        
        if (Array.isArray(responseData)) {
          // If data is already an array, use it directly
          phoneNumbersArray = responseData;
        } else if ((responseData as any).phonenumbers && typeof (responseData as any).phonenumbers === 'object') {
          // Transform the object format to array format
          phoneNumbersArray = Object.entries((responseData as any).phonenumbers).map(([prefix, data]: [string, any]) => ({
            prefix: prefix,
            phone_number: data.phone_number || '',
            organization_id: data.organization_id || 'developer',
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString()
          }));
        } else if ((response as any).phonenumbers && typeof (response as any).phonenumbers === 'object') {
          // Handle case where phonenumbers is at the top level
          phoneNumbersArray = Object.entries((response as any).phonenumbers).map(([prefix, data]: [string, any]) => ({
            prefix: prefix,
            phone_number: data.phone_number || '',
            organization_id: data.organization_id || 'developer',
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString()
          }));
        }
        
        setPhoneNumbers(phoneNumbersArray);
      } else {
        setError(response.message || 'Failed to load phone numbers');
      }
    } catch (err: any) {
      setError('Failed to load phone numbers: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await agentConfigService.getAgentsByOrg('developer');
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setAgents(response.data);
      } else {
        setAgents([]);
      }
    } catch (err) {
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const loadAvailablePhoneNumbers = async () => {
    setLoadingPhoneNumbers(true);
    try {
      const response = await getAvailablePhoneNumbersByOrg('developer');
      
      if (response.success && response.data) {
        let phoneNumbersArray: any[] = [];
        
        if (Array.isArray(response.data)) {
          phoneNumbersArray = response.data;
        } else if ((response.data as any).phonenumbers && typeof (response.data as any).phonenumbers === 'object') {
          // Transform the object format to array format
          phoneNumbersArray = Object.entries((response.data as any).phonenumbers).map(([prefix, data]: [string, any]) => ({
            prefix: prefix,
            phone_number: data.phone_number || '',
            organization_id: data.organization_id || 'developer',
          }));
        }
        
        // Filter out already assigned phone numbers
        const unassignedNumbers = phoneNumbersArray.filter(phone => 
          !phoneNumbers.some(existing => existing.phone_number === phone.phone_number)
        );
        
        setAvailablePhoneNumbers(unassignedNumbers);
      } else {
        setAvailablePhoneNumbers([]);
      }
    } catch (err) {
      setAvailablePhoneNumbers([]);
    } finally {
      setLoadingPhoneNumbers(false);
    }
  };

  const handleAssignPhoneNumber = async () => {
    if (!assigningPhoneNumber.trim()) {
      setError('Please select a phone number.');
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      if (!assigningAgent.trim() || assigningAgent.trim() === 'None') {
        // Unassign the phone number
        response = await unassignPhoneNumber(assigningPhoneNumber);
        if (response.success) {
          setSuccess(`Phone number ${assigningPhoneNumber} unassigned successfully!`);
        } else {
          setError(response.message || 'Failed to unassign phone number.');
          return;
        }
      } else {
        // Assign the phone number to an agent
        response = await addUpdateAgentPhoneNumber(assigningAgent, assigningPhoneNumber);
        if (response.success) {
          setSuccess(`Phone number ${assigningPhoneNumber} assigned to ${assigningAgent} successfully!`);
        } else {
          setError(response.message || 'Failed to assign phone number.');
          return;
        }
      }
      
      // Close modal and refresh data on success
      setShowAssignModal(false);
      setAssigningAgent('');
      setAssigningPhoneNumber('');
      loadPhoneNumbers(); // Refresh the list
      loadAvailablePhoneNumbers(); // Refresh available numbers
      
    } catch (err: any) {
      const action = !assigningAgent.trim() || assigningAgent.trim() === 'None' ? 'unassign' : 'assign';
      setError(`Error ${action}ing phone number: ` + (err.message || 'Unknown error'));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignPhoneNumber = async () => {
    if (!selectedPhoneNumber?.phone_number) {
      setError('No phone number selected for unassignment.');
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await unassignPhoneNumber(selectedPhoneNumber.phone_number);
      
      if (response.success) {
        setSuccess(`Phone number ${selectedPhoneNumber.phone_number} unassigned successfully!`);
        setShowAssignModal(false);
        setAssigningAgent('');
        setAssigningPhoneNumber('');
        loadPhoneNumbers(); // Refresh the list
        loadAvailablePhoneNumbers(); // Refresh available numbers
      } else {
        setError(response.message || 'Failed to unassign phone number.');
      }
    } catch (err: any) {
      setError('Error unassigning phone number: ' + (err.message || 'Unknown error'));
    } finally {
      setAssigning(false);
    }
  };

  const filteredPhoneNumbers = phoneNumbers.filter(phone =>
    phone.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phone.phone_number.includes(searchTerm)
  );

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPhoneNumber(null);
        setShowAssignModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAssigned = (phoneNumber: AgentPhoneNumber) => {
    return phoneNumber.prefix && phoneNumber.prefix !== 'unassigned';
  };

  const handleSelectPhoneNumber = (phoneNumber: AgentPhoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
  };

  const handleEditPhoneNumber = (phoneNumber: AgentPhoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
    setAssigningPhoneNumber(phoneNumber.phone_number);
    setAssigningAgent(phoneNumber.prefix || '');
    setShowAssignModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6" onClick={() => setSelectedPhoneNumber(null)}>
      <div className={`rounded-2xl border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        
        {/* Header */}
        <div className={`p-8 border-b rounded-t-2xl ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-blue-900/20 to-indigo-900/20' : 'border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <h2 className={`text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  Phone Numbers Management
                </h2>
              </div>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                View and manage phone number assignments to agents
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Organization: Developer
                </span>
            </div>
              <button
                onClick={() => {
                  setAssigningAgent('');
                  setAssigningPhoneNumber('');
                  setShowAssignModal(true);
                }}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3"
              >
                <Plus className="h-5 w-4" />
                <span className="font-semibold">Assign Number</span>
            </button>
          </div>
        </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
                <button onClick={clearMessages} className="ml-auto">
                  <XCircle className="h-4 w-4" />
            </button>
          </div>
            )}
            {success && (
              <div className="flex items-center gap-3 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>{success}</span>
                <button onClick={clearMessages} className="ml-auto">
                  <XCircle className="h-4 w-4" />
              </button>
            </div>
            )}
        </div>
        )}
        
        {/* Search and Content */}
        <div className={`p-8 ${isDarkMode ? 'bg-gray-900' : ''}`}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Phone Numbers List */}
            <div className="w-full lg:w-96" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6">
                <div className="relative group">
                  <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                  <input
                    type="text"
                    placeholder="Search phone numbers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredPhoneNumbers.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No phone numbers found
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {searchTerm ? 'Try adjusting your search' : 'No phone numbers available'}
                  </p>
                </div>
              ) : (
                        <div className="space-y-2">
                          {filteredPhoneNumbers.map((phoneNumber) => (
                            <div
                              key={phoneNumber.phone_number}
                              onClick={() => handleSelectPhoneNumber(phoneNumber)}
                                                             className={`w-full p-4 rounded-xl text-left transition-all duration-300 cursor-pointer ${
                                 selectedPhoneNumber?.phone_number === phoneNumber.phone_number
                      ? isDarkMode
                                     ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-2 border-blue-700/50 shadow-lg ring-2 ring-blue-500/30'
                                     : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg ring-2 ring-blue-400/30'
                      : isDarkMode
                                     ? 'border border-white/20 shadow-sm'
                                     : 'border border-gray-200 shadow-sm'
                               }`}
                            >
                                                             <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-3 mb-2">
                                     <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                       <Phone className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                                     <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                       {phoneNumber.phone_number}
                                     </h3>
                        </div>
                                   <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                     {phoneNumber.prefix && phoneNumber.prefix !== 'unassigned' 
                                       ? `Agent: ${phoneNumber.prefix}` 
                                       : 'Agent: None'
                                     }
                        </p>
                      </div>
                                 <div className="flex items-center gap-4">
                                   <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                                     phoneNumber.prefix && phoneNumber.prefix !== 'unassigned'
                                       ? isDarkMode 
                                         ? 'bg-green-900/40 text-green-300 border border-green-600/50 shadow-sm'
                                         : 'bg-green-100 text-green-700 border border-green-300 shadow-sm'
                                       : isDarkMode
                                         ? 'bg-gray-700/50 text-gray-300 border border-gray-600/50 shadow-sm'
                                         : 'bg-gray-100 text-gray-600 border border-gray-300 shadow-sm'
                                   }`}>
                                     {phoneNumber.prefix && phoneNumber.prefix !== 'unassigned' ? (
                                       <>
                                         <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                         <span>Assigned</span>
                                       </>
                                     ) : (
                                       <>
                                         <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                         <span>Unassigned</span>
                                       </>
                                     )}
                    </div>
                                   {phoneNumber.prefix && phoneNumber.prefix !== 'unassigned' && (
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleEditPhoneNumber(phoneNumber);
                                       }}
                                       className={`p-2.5 rounded-xl transition-all duration-200 ${
                                         isDarkMode 
                                           ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border border-blue-500/30' 
                                           : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border border-blue-400/30'
                                       }`}
                                       title="Edit Assignment"
                                     >
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                       </svg>
                  </button>
                                   )}
              </div>
            </div>
          </div>
                          ))}
                    </div>
              )}
                  </div>

            {/* Details Panel */}
             <div className="flex-1 w-full lg:w-auto" onClick={(e) => e.stopPropagation()}>
              {selectedPhoneNumber ? (
                 <div className={`rounded-2xl p-8 border transition-all duration-300 transform animate-in slide-in-from-right-4 ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                   <div className="mb-8">
                     <div className="flex items-center gap-4 mb-4">
                       <div className={`text-3xl p-3 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50' : 'bg-gradient-to-r from-blue-100 to-indigo-100'}`}>
                         📞
                        </div>
                        <div>
                         <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Phone Number Details
                         </h3>
                        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedPhoneNumber.phone_number}
                        </p>
                        </div>
                        </div>
                      </div>

                  {isAssigned(selectedPhoneNumber) ? (
                    // Show agent details if assigned
                    <div className="space-y-6">
                      <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <User className="h-6 w-6 text-green-600" />
                          <h4 className="text-lg font-semibold text-green-800">Assigned to Agent</h4>
                           </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-green-700">
                              Agent Prefix
                            </label>
                              <input
                            type="text"
                              value={selectedPhoneNumber.prefix}
                              readOnly
                              className="w-full px-4 py-3 border border-green-200 rounded-xl bg-green-50 text-green-800"
                              />
                            </div>
                            <div>
                            <label className="block text-sm font-semibold mb-2 text-green-700">
                              Organization
                            </label>
                              <input
                              type="text"
                              value={selectedPhoneNumber.organization_id || 'Not specified'}
                              readOnly
                              className="w-full px-4 py-3 border border-green-200 rounded-xl bg-green-50 text-green-800"
                              />
                            </div>
                          </div>
                        </div>
                    </div>
                  ) : (
                    // Show assignment prompt if unassigned
                    <div className="space-y-6">
                      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <AlertCircle className="h-6 w-6 text-yellow-600" />
                          <h4 className="text-lg font-semibold text-yellow-800">Unassigned Phone Number</h4>
                          </div>
                        <p className="text-yellow-700 mb-4">
                          This phone number is not assigned to any agent. Click the button below to assign it.
                        </p>
                        <button
                          onClick={() => {
                            setAssigningPhoneNumber(selectedPhoneNumber.phone_number);
                            setShowAssignModal(true);
                          }}
                          className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Assign to Agent
                            </button>
                          </div>
                    </div>
                  )}
                </div>
                             ) : (
                 <div className="text-center py-12 transition-all duration-300 transform animate-in fade-in">
                   <div className={`p-6 rounded-2xl inline-block mb-6 ${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50' : 'bg-gradient-to-r from-blue-100 to-indigo-100'}`}>
                     <Phone className={`h-12 w-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                   </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Select a Phone Number
                  </h3>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Choose a phone number from the sidebar to view its details
                  </p>
                 </div>
               )}
                        </div>
                      </div>
                    </div>
                        </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
          <div className={`rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {selectedPhoneNumber ? 'Edit Assignment' : 'Assign Agent'}
            </h3>
            
            {!selectedPhoneNumber && (
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select an agent prefix and phone number to create a new assignment.
              </p>
            )}
            
            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                <p>{success}</p>
              </div>
            )}

            <div className="space-y-6">
              {selectedPhoneNumber ? (
                // Edit Assignment - Show current phone number and assignment
                <>
                        <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone Number
                    </label>
                          <input
                            type="text"
                      value={selectedPhoneNumber.phone_number}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-gray-100 text-gray-900'}`}
                      disabled
                          />
                        </div>

                        <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Current Assignment
                    </label>
                    <div className={`w-full px-4 py-3 border rounded-xl ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-gray-100 text-gray-900'}`}>
                      Currently assigned to: {selectedPhoneNumber.prefix}
                        </div>
                      </div>

                        <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      New Agent Prefix
                    </label>
                    <select
                      value={assigningAgent}
                      onChange={(e) => setAssigningAgent(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                      disabled={loadingAgents}
                    >
                      <option value="">None (Unassign)</option>
                      {Array.isArray(agents) && agents.map((agent, index) => (
                        <option key={agent.id || agent.prefix || agent.name || `agent-${index}`} value={agent.prefix || agent.name}>
                          {agent.name || agent.prefix} ({agent.prefix || agent.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                // New Assignment - Show only agent and phone number fields
                <>
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <User className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        Agent Prefix
                      </label>
                    </div>
                    <select
                      value={assigningAgent}
                      onChange={(e) => setAssigningAgent(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-blue-600 bg-gray-700 text-gray-200' : 'border-blue-200 bg-white text-gray-900'}`}
                      disabled={loadingAgents}
                    >
                      <option value="">Select an agent</option>
                      {Array.isArray(agents) && agents.map((agent, index) => (
                        <option key={agent.id || agent.prefix || agent.name || `agent-${index}`} value={agent.prefix || agent.name}>
                          {agent.name || agent.prefix} ({agent.prefix || agent.name})
                        </option>
                      ))}
                    </select>
                            </div>

                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                        Phone Number
                      </label>
                            </div>
                    <select
                      value={assigningPhoneNumber}
                      onChange={(e) => setAssigningPhoneNumber(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-green-600 bg-gray-700 text-gray-200' : 'border-green-200 bg-white text-gray-900'}`}
                      disabled={loadingPhoneNumbers}
                    >
                      <option value="">Select a phone number</option>
                      {Array.isArray(availablePhoneNumbers) && availablePhoneNumbers.map((phoneNumber, index) => {
                        const displayText = phoneNumber.prefix ? `${phoneNumber.prefix} - ${phoneNumber.phone_number}` : phoneNumber.phone_number;
                        return (
                          <option key={phoneNumber.phone_number || `phone-${index}`} value={phoneNumber.phone_number}>
                            {displayText}
                          </option>
                        );
                      })}
                    </select>
                          </div>
                </>
              )}
                        </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPhoneNumber(null);
                  setAssigningAgent('');
                  setAssigningPhoneNumber('');
                  setError(null);
                  setSuccess(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={assigning}
              >
                Cancel
                            </button>
              <button
                onClick={handleAssignPhoneNumber}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={assigning || (selectedPhoneNumber ? !assigningAgent.trim() : (!assigningAgent.trim() || !assigningPhoneNumber.trim()))}
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin mx-auto mr-2" /> : null}
                {selectedPhoneNumber 
                  ? (!assigningAgent.trim() ? 'Unassign Number' : 'Update Assignment')
                  : 'Assign Agent'
                }
                            </button>
                          </div>
                        </div>
                </div>
              )}
    </div>
  );
}
