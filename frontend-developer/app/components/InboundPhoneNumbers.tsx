'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Search, User, AlertCircle, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  assignPhoneNumberToAgent,
  unassignPhoneNumberFromAgent,
  getPhoneNumbersByOrganization,
  getAgentsByOrganization,
  getAvailablePhoneNumbersFromBackend,
  AgentPhoneNumber
} from '../../service/phoneNumberService';
import { 
  Agent, 
  PhoneNumber, 
  ApiResponse, 
  OrganizationData, 
  TIMEOUTS 
} from './types/phoneNumbers';
import { useOrganizationId, isAssigned } from './utils/phoneNumberUtils';

interface InboundPhoneNumbersProps {
  // No props needed for this component
}

export default function InboundPhoneNumbers({}: InboundPhoneNumbersProps) {
  // Use theme with fallback to prevent errors
  let isDarkMode = false;
  try {
    const theme = useTheme();
    isDarkMode = theme?.isDarkMode || false;
  } catch {
    isDarkMode = false;
  }
  
  // Get user info from PropelAuth
  const { user, userClass } = useAuthInfo();
  const getOrganizationId = useOrganizationId();
  
  // Phone numbers state
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(false);
  
  // State for organization phone numbers
  const [organizationPhoneNumbers, setOrganizationPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loadingOrgPhoneNumbers, setLoadingOrgPhoneNumbers] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadOrganizationPhoneNumbers();
    loadAgents();
  }, [getOrganizationId]);

  const loadOrganizationPhoneNumbers = useCallback(async () => {
    setLoadingOrgPhoneNumbers(true);
    try {
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setOrganizationPhoneNumbers([]);
        return;
      }

      const response: ApiResponse<OrganizationData> = await getPhoneNumbersByOrganization(orgId);
      
      if (response.success && response.data) {
        const orgData = response.data;
        
        // Check if we have phone_numbers in the response
        if (orgData.phone_numbers && Array.isArray(orgData.phone_numbers) && orgData.phone_numbers.length > 0) {
          setOrganizationPhoneNumbers(orgData.phone_numbers);
        } else {
          // Try alternative data extraction methods
          let phoneNumbersData: PhoneNumber[] | null = null;
          
          // Method 1: Direct access
          if (orgData.phone_numbers) {
            phoneNumbersData = orgData.phone_numbers;
          }
          // Method 2: Check if data is nested differently
          else if ((orgData as { data?: { phone_numbers?: PhoneNumber[] } }).data?.phone_numbers) {
            phoneNumbersData = (orgData as { data: { phone_numbers: PhoneNumber[] } }).data.phone_numbers;
          }
          // Method 3: Check if the entire response is the phone numbers array
          else if (Array.isArray(orgData)) {
            phoneNumbersData = orgData as PhoneNumber[];
          }
          
          if (phoneNumbersData && phoneNumbersData.length > 0) {
            setOrganizationPhoneNumbers(phoneNumbersData);
          } else {
            setOrganizationPhoneNumbers([]);
          }
        }
      } else {
        setOrganizationPhoneNumbers([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading organization phone numbers:', errorMessage);
      setOrganizationPhoneNumbers([]);
    } finally {
      setLoadingOrgPhoneNumbers(false);
    }
  }, [getOrganizationId]);

  const loadPhoneNumbers = useCallback(async () => {
    // This function is no longer needed since we use loadOrganizationPhoneNumbers
    // which loads phone numbers specific to the organization
    console.log('🔍 loadPhoneNumbers called - using organization phone numbers instead');
    setPhoneNumbers([]);
    setLoading(false);
  }, []);

  const loadAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setAgents([]);
        return;
      }
      
      const response: ApiResponse<{ agents: Record<string, unknown> }> = await getAgentsByOrganization(orgId);
      
      if (response.success && response.data) {
        const agentsData = response.data;
        
        // Extract agent_prefix from the agents object
        if (agentsData.agents && typeof agentsData.agents === 'object') {
          const agentList: Agent[] = Object.keys(agentsData.agents).map(agentPrefix => ({
            agent_prefix: agentPrefix,
            name: agentPrefix,
            organization_id: orgId,
            ...(agentsData.agents[agentPrefix] as Record<string, unknown>)
          }));
          
          setAgents(agentList);
        } else {
          setAgents([]);
        }
      } else {
        setAgents([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading agents:', errorMessage);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, [getOrganizationId]);

  const loadAvailablePhoneNumbers = useCallback(async () => {
    setLoadingPhoneNumbers(true);
    try {
      const response: ApiResponse<{ phone_numbers: PhoneNumber[] }> = await getAvailablePhoneNumbersFromBackend();
      
      if (response.success && response.data) {
        let phoneNumbersArray: PhoneNumber[] = [];
        
        if (response.data.phone_numbers && Array.isArray(response.data.phone_numbers)) {
          phoneNumbersArray = response.data.phone_numbers.map((phone: unknown) => {
            const phoneData = phone as Record<string, unknown>;
            return {
              phone_number: (phoneData.number as string) || (phoneData.phone_number as string) || '',
              agent_id: (phoneData.agent_id as string) || null,
              organization_id: (phoneData.organization_id as string) || '',
              status: (phoneData.status as string) || 'available',
              phone_id: (phoneData.phone_id as string) || '',
              voice_enabled: (phoneData.voice_enabled as boolean) || false,
              sms_enabled: (phoneData.sms_enabled as boolean) || false,
              whatsapp_enabled: (phoneData.whatsapp_enabled as boolean) || false,
              inbound_enabled: (phoneData.inbound_enabled as boolean) || false,
              outbound_enabled: (phoneData.outbound_enabled as boolean) || false,
            };
          });
        }
        
        // Filter out already assigned phone numbers
        const unassignedNumbers = phoneNumbersArray.filter(phone => 
          !phoneNumbers.some(existing => existing.phone_number === phone.phone_number)
        );
        
        setAvailablePhoneNumbers(unassignedNumbers);
      } else {
        setAvailablePhoneNumbers([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading available phone numbers:', errorMessage);
      setAvailablePhoneNumbers([]);
    } finally {
      setLoadingPhoneNumbers(false);
    }
  }, [phoneNumbers]);

  // Load agents and available phone numbers on component mount
  useEffect(() => {
    loadAgents();
    loadAvailablePhoneNumbers();
  }, [loadAgents, loadAvailablePhoneNumbers]);


  // Show ONLY organization phone numbers in the main list (assigned numbers in the organization)
  const allPhoneNumbers: PhoneNumber[] = organizationPhoneNumbers.map(orgPhone => ({
    phone_number: orgPhone.number || orgPhone.phone_number || orgPhone.phone || '',
    agent_id: orgPhone.agent_id || orgPhone.agent_name || '',
    organization_id: orgPhone.organization_id || '',
    status: orgPhone.status || 'assigned',
    created_at: orgPhone.created_at || new Date().toISOString(),
    updated_at: orgPhone.updated_at || new Date().toISOString(),
    // Add organization-specific fields
    phone_id: orgPhone.phone_id || '',
    voice_enabled: orgPhone.voice_enabled || false,
    sms_enabled: orgPhone.sms_enabled || false,
    whatsapp_enabled: orgPhone.whatsapp_enabled || false,
    inbound_enabled: orgPhone.inbound_enabled || false,
    outbound_enabled: orgPhone.outbound_enabled || false,
    agent_name: orgPhone.agent_name || ''
  }));

  const filteredPhoneNumbers = allPhoneNumbers.filter(phone =>
    (phone.agent_id && phone.agent_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    phone.phone_number.includes(searchTerm) ||
    (phone.agent_name && phone.agent_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, TIMEOUTS.MESSAGE_DISPLAY);
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

  const handleSelectPhoneNumber = (phoneNumber: AgentPhoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
  };

  const handleEditPhoneNumber = (phoneNumber: AgentPhoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
    setAssigningPhoneNumber(phoneNumber.phone_number);
    setAssigningAgent(phoneNumber.agent_id || '');
    setShowAssignModal(true);
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
        // Unassign the phone number using real backend API
        const selectedPhone = allPhoneNumbers.find((phone: PhoneNumber) => 
          phone.phone_number === assigningPhoneNumber
        );
        
        if (!selectedPhone || !selectedPhone.phone_id || !selectedPhone.agent_id) {
          setError('Phone ID or current agent not found. Please refresh and try again.');
          return;
        }
        
        response = await unassignPhoneNumberFromAgent(selectedPhone.phone_id as string, selectedPhone.agent_id as string);
        
        if (response.success) {
          setSuccess(`Phone number ${assigningPhoneNumber} unassigned successfully!`);
        } else {
          setError(response.message || 'Failed to unassign phone number.');
          return;
        }
      } else {
        // Assign the phone number to an agent using real backend API
        const selectedPhone = availablePhoneNumbers.find((phone: PhoneNumber) => 
          phone.phone_number === assigningPhoneNumber
        );
        
        if (!selectedPhone || !selectedPhone.phone_id) {
          setError('Phone ID not found. Please refresh and try again.');
          return;
        }
        
        response = await assignPhoneNumberToAgent(selectedPhone.phone_id as string, assigningAgent);
        
        if (response.success) {
          // Success handled below
        } else {
          setError(response.message || 'Failed to assign phone number.');
          return;
        }
      }
      
      // Close modal and refresh data on success
      setShowAssignModal(false);
      setAssigningAgent('');
      setAssigningPhoneNumber('');
      
      // Refresh all phone number lists to reflect the status change
      setSuccess(`Phone number ${assigningPhoneNumber} assigned to ${assigningAgent} successfully! Refreshing lists...`);
      
      // Small delay to ensure backend has updated the status
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.REFRESH_DELAY));
      
      await Promise.all([
        loadAvailablePhoneNumbers(), // Refresh available numbers (status: available)
        loadOrganizationPhoneNumbers() // Refresh organization numbers (status: assigned)
      ]);
      
      // Update success message after refresh
      setSuccess(`Phone number ${assigningPhoneNumber} assigned to ${assigningAgent} successfully! Lists updated.`);
      
    } catch (err: unknown) {
      const action = !assigningAgent.trim() || assigningAgent.trim() === 'None' ? 'unassign' : 'assign';
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error ${action}ing phone number: ` + errorMessage);
      console.error(`Error ${action}ing phone number:`, err);
    } finally {
      setAssigning(false);
    }
  };


  return (
    <div className="flex h-full">
      {/* Header with Assign Agent Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => {
            setAssigningAgent('');
            setAssigningPhoneNumber('');
            setShowAssignModal(true);
          }}
          className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm sm:text-base font-semibold">Assign Agent</span>
        </button>
      </div>

      {/* Left Sidebar - Phone Numbers List */}
      <div className="w-80 border-r border-gray-200/50 flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
            <input
              type="text"
              placeholder="Search phone numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search phone numbers"
              className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
            />
          </div>
        </div>
        
        {/* Phone Numbers List */}
        <div className="flex-1 overflow-y-auto p-4">
          {(loading || loadingOrgPhoneNumbers) && filteredPhoneNumbers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading phone numbers...
              </span>
            </div>
          ) : filteredPhoneNumbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No phone numbers found
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {searchTerm ? 'Try adjusting your search' : 'No phone numbers assigned to this organization'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPhoneNumbers.map((phoneNumber) => (
                <div
                  key={phoneNumber.phone_number}
                  onClick={() => handleSelectPhoneNumber(phoneNumber)}
                  className={`p-4 rounded-xl text-left transition-all duration-300 cursor-pointer border ${
                    selectedPhoneNumber?.phone_number === phoneNumber.phone_number
                      ? isDarkMode 
                        ? 'bg-blue-600/20 border-blue-500/50 shadow-lg'
                        : 'bg-blue-50 border-blue-200 shadow-lg'
                      : isDarkMode
                        ? 'bg-gray-800/80 hover:bg-gray-700/80 border-gray-600/50 hover:border-gray-500/50'
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                          <Phone className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {phoneNumber.phone_number || 'No phone number'}
                        </h3>
                      </div>
                      <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {phoneNumber.agent_id && phoneNumber.agent_id !== 'unassigned' 
                          ? `Agent: ${phoneNumber.agent_name || phoneNumber.agent_id}` 
                          : 'Agent: None'
                        }
                      </p>
                      {(phoneNumber.voice_enabled || phoneNumber.sms_enabled || phoneNumber.whatsapp_enabled) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {phoneNumber.voice_enabled && (
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                            }`}>
                              Voice
                            </span>
                          )}
                          {phoneNumber.sms_enabled && (
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                            }`}>
                              SMS
                            </span>
                          )}
                          {phoneNumber.whatsapp_enabled && (
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                            }`}>
                              WhatsApp
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {isAssigned(phoneNumber) ? (
                        <CheckCircle className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                      ) : (
                        <XCircle className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6" onClick={(e) => e.stopPropagation()}>
        {selectedPhoneNumber ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Phone className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedPhoneNumber.phone_number}
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Phone Number Details
                </p>
              </div>
            </div>
            
            {isAssigned(selectedPhoneNumber) ? (
              // Show agent details if assigned
              <div className="space-y-4 sm:space-y-6">
                <div className="p-4 sm:p-6 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    <h4 className="text-base sm:text-lg font-semibold text-green-800">Assigned to Agent</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-green-700">
                        Agent Prefix
                      </label>
                      <input
                        type="text"
                        value={selectedPhoneNumber.agent_id || 'Unassigned'}
                        readOnly
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl bg-green-50 text-green-800 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-green-700">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={selectedPhoneNumber.organization_id || 'Not specified'}
                        readOnly
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-green-200 rounded-lg sm:rounded-xl bg-green-50 text-green-800 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  
                  {/* Edit Button */}
                  <div className="mt-4 sm:mt-6">
                    <button
                      onClick={() => handleEditPhoneNumber(selectedPhoneNumber)}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Plus className="h-4 w-4" />
                      Edit Assignment
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Show assignment prompt if unassigned
              <div className="space-y-4 sm:space-y-6">
                <div className="p-4 sm:p-6 bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    <h4 className="text-base sm:text-lg font-semibold text-yellow-800">Unassigned Phone Number</h4>
                  </div>
                  <p className="text-yellow-700 mb-3 sm:mb-4 text-sm sm:text-base">
                    This phone number is not assigned to any agent. Click the button below to assign it.
                  </p>
                  <button
                    onClick={() => {
                      setAssigningPhoneNumber(selectedPhoneNumber.phone_number);
                      setShowAssignModal(true);
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4" />
                    Assign to Agent
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 transition-all duration-300 transform animate-in fade-in">
            <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block mb-4 sm:mb-6 ${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50' : 'bg-gradient-to-r from-blue-100 to-indigo-100'}`}>
              <Phone className={`h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Select a Phone Number
            </h3>
            <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Choose a phone number from the sidebar to view its details
            </p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowAssignModal(false)}>
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {selectedPhoneNumber ? 'Edit Assignment' : 'Assign Agent'}
            </h3>
            
            {!selectedPhoneNumber && (
              <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select an agent prefix and phone number to create a new assignment.
              </p>
            )}
            
            {error && (
              <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-xs sm:text-sm">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
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
                      Currently assigned to: {selectedPhoneNumber.agent_id || 'Unassigned'}
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
                      {agents.map((agent, index) => (
                        <option key={agent.id || agent.name || agent.agent_prefix || `agent-${index}`} value={agent.name || agent.agent_prefix}>
                          {agent.name || agent.agent_prefix}
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
                      {agents.map((agent, index) => (
                        <option key={agent.id || agent.name || agent.agent_prefix || `agent-${index}`} value={agent.name || agent.agent_prefix}>
                          {agent.name || agent.agent_prefix}
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
                      {availablePhoneNumbers.length > 0 ? (
                        availablePhoneNumbers.map((phoneNumber, index) => {
                          const displayText = phoneNumber.agent_id ? `${phoneNumber.agent_id} - ${phoneNumber.phone_number}` : phoneNumber.phone_number;
                          return (
                            <option key={phoneNumber.phone_number || `phone-${index}`} value={phoneNumber.phone_number}>
                              {displayText}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>
                          {loadingPhoneNumbers ? 'Loading phone numbers...' : 'No available phone numbers found'}
                        </option>
                      )}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPhoneNumber(null);
                  setAssigningAgent('');
                  setAssigningPhoneNumber('');
                  setError(null);
                  setSuccess(null);
                }}
                className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPhoneNumber}
                className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                disabled={assigning || (selectedPhoneNumber ? false : (!assigningAgent.trim() || !assigningPhoneNumber.trim()))}
              >
                {assigning ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mx-auto mr-2" /> : null}
                {selectedPhoneNumber 
                  ? (!assigningAgent.trim() ? 'Unassign Number' : 'Update Assignment')
                  : 'Assign Agent'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowAssignModal(false)}>
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {selectedPhoneNumber ? 'Edit Assignment' : 'Assign Agent'}
            </h3>
            
            {!selectedPhoneNumber && (
              <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select an agent prefix and phone number to create a new assignment.
              </p>
            )}
            
            {error && (
              <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-xs sm:text-sm">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
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
                      Currently assigned to: {selectedPhoneNumber.agent_id || 'Unassigned'}
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
                      {agents.map((agent, index) => (
                        <option key={agent.id || agent.name || agent.agent_prefix || `agent-${index}`} value={agent.name || agent.agent_prefix}>
                          {agent.name || agent.agent_prefix}
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
                      {agents.map((agent, index) => (
                        <option key={agent.id || agent.name || agent.agent_prefix || `agent-${index}`} value={agent.name || agent.agent_prefix}>
                          {agent.name || agent.agent_prefix}
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
                      {availablePhoneNumbers.length > 0 ? (
                        availablePhoneNumbers.map((phoneNumber, index) => {
                          const displayText = phoneNumber.agent_id ? `${phoneNumber.agent_id} - ${phoneNumber.phone_number}` : phoneNumber.phone_number;
                          return (
                            <option key={phoneNumber.phone_number || `phone-${index}`} value={phoneNumber.phone_number}>
                              {displayText}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>
                          {loadingPhoneNumbers ? 'Loading phone numbers...' : 'No available phone numbers found'}
                        </option>
                      )}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPhoneNumber(null);
                  setAssigningAgent('');
                  setAssigningPhoneNumber('');
                  setError(null);
                  setSuccess(null);
                }}
                className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPhoneNumber}
                className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                disabled={assigning || (selectedPhoneNumber ? false : (!assigningAgent.trim() || !assigningPhoneNumber.trim()))}
              >
                {assigning ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mx-auto mr-2" /> : null}
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
