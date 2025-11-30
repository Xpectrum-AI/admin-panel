'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, PhoneCall, User, Phone, Loader2, AlertCircle, CheckCircle, XCircle, Search, Trash2 } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  scheduleOutboundCall,
  SchedulerRequest,
  getScheduledEventsByOrganization,
  deleteScheduledEvent,
  updateScheduledEvent,
  getAgentsByOrganization,
  getPhoneNumbersByOrganization,
  getAvailablePhoneNumbersFromBackend,
  makeOutboundCall,
  CallRequest
} from '../../service/phoneNumberService';
import { 
  Agent, 
  ScheduledEvent, 
  ApiResponse, 
  SchedulerFormData, 
  CallFormData,
  FormErrors,
  TIMEOUTS,
  VALIDATION_LIMITS 
} from './types/phoneNumbers';
import { useOrganizationId } from './utils/phoneNumberUtils';
import { getAgentDisplayName } from '../../lib/utils/agentNameUtils';
import { useTabPersistence } from '../../hooks/useTabPersistence';

// Import new hooks and components
import { useScheduledEvents } from './OutboundPhoneScheduler/hooks/useScheduledEvents';
import { useTrunks } from './OutboundPhoneScheduler/hooks/useTrunks';
import { useOutboundData } from './OutboundPhoneScheduler/hooks/useOutboundData';
import TabNavigation from './OutboundPhoneScheduler/components/TabNavigation';

interface OutboundSchedulerProps {
  // No props needed for this component
}

export default function OutboundScheduler({}: OutboundSchedulerProps) {
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
  
  // Use new hooks for data management
  const {
    scheduledEvents,
    selectedScheduledEvent,
    setSelectedScheduledEvent,
    loadingScheduledEvents,
    deletingEvent,
    deleteError,
    deleteSuccess,
    loadScheduledEvents,
    handleDeleteScheduledEvent
  } = useScheduledEvents();
  
  const {
    trunks,
    loadingTrunks,
    trunkError,
    trunkSuccess,
    creatingTrunk,
    deletingTrunk,
    loadTrunks,
    handleDeleteTrunk,
    handleCreateTrunk: createTrunk
  } = useTrunks();
  
  const {
    agents,
    phoneNumbers,
    loadingAgents,
    loadingPhoneNumbers,
    loadAgents,
    loadPhoneNumbers
  } = useOutboundData();
  
  // Local UI state
  const [showCreateSchedulerModal, setShowCreateSchedulerModal] = useState(false);
  const [showEditSchedulerModal, setShowEditSchedulerModal] = useState(false);
  const [editingScheduledEvent, setEditingScheduledEvent] = useState<ScheduledEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Outbound scheduler state
  const [schedulerForm, setSchedulerForm] = useState<SchedulerFormData>({
    organization_id: '',
    agent_prefix: '',
    recipient_phone: '',
    scheduled_time: '',
    caller_number: '',
    flexible_time_minutes: 0,
    max_retries: 3
  });
  const [scheduling, setScheduling] = useState(false);
  const [schedulerError, setSchedulerError] = useState<string | null>(null);
  const [schedulerSuccess, setSchedulerSuccess] = useState<string | null>(null);
  const [callForm, setCallForm] = useState<CallFormData>({
    caller_number: '',
    callee_number: '',
    agent_name: '',
  });
  const [isCalling, setIsCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callSuccess, setCallSuccess] = useState<string | null>(null);
  
  // Trunk UI state
  const [showCreateTrunkModal, setShowCreateTrunkModal] = useState(false);
  const [trunkForm, setTrunkForm] = useState({
    phone_number: '',
    transport: 'udp'
  });
  
  // Tab state - persist across page refreshes
  const [activeTab, handleTabChange] = useTabPersistence<'trunk' | 'scheduler' | 'call'>('outboundScheduler', 'trunk');

  const getPhoneNumberValue = useCallback((phone: any) => {
    if (!phone) return '';
    return (
      phone.phone_number ||
      phone.number ||
      phone.phone ||
      phone.recipient_phone ||
      phone.to_number ||
      ''
    );
  }, []);

  const availableCallerNumbers = useMemo(() => {
    const uniqueNumbers = new Set<string>();
    phoneNumbers.forEach((phone) => {
      const value = getPhoneNumberValue(phone);
      if (value) {
        uniqueNumbers.add(value);
      }
    });
    return Array.from(uniqueNumbers);
  }, [phoneNumbers, getPhoneNumberValue]);

  // Load data on component mount
  useEffect(() => {
    const orgId = getOrganizationId();
    setSchedulerForm(prev => ({ ...prev, organization_id: orgId }));
    
    loadScheduledEvents();
    loadAgents();
    loadTrunks();
    loadPhoneNumbers();
  }, [getOrganizationId, loadScheduledEvents, loadAgents, loadTrunks, loadPhoneNumbers]);

  useEffect(() => {
    if (!callForm.caller_number && availableCallerNumbers.length > 0) {
      setCallForm(prev => ({
        ...prev,
        caller_number: prev.caller_number || availableCallerNumbers[0],
      }));
    }
  }, [availableCallerNumbers, callForm.caller_number]);

  useEffect(() => {
    if (!callForm.agent_name && agents.length > 0) {
      const defaultAgent = agents[0]?.agent_prefix || agents[0]?.name || '';
      if (defaultAgent) {
        setCallForm(prev => ({
          ...prev,
          agent_name: prev.agent_name || defaultAgent,
        }));
      }
    }
  }, [agents, callForm.agent_name]);

  // Create trunk - using hook function
  const handleCreateTrunk = async () => {
    if (!trunkForm.phone_number) {
      return;
    }
    await createTrunk(trunkForm.phone_number, trunkForm.transport);
    if (trunkSuccess) {
      setTrunkForm({ phone_number: '', transport: 'udp' });
      setShowCreateTrunkModal(false);
    }
  };


  // Form validation function
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    
    // Agent validation
    if (!schedulerForm.agent_prefix.trim()) {
      errors.agent_prefix = 'Please select an agent';
    }
    
    // Phone number validation
    if (!schedulerForm.recipient_phone.trim()) {
      errors.recipient_phone = 'Recipient phone number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(schedulerForm.recipient_phone)) {
      errors.recipient_phone = 'Please enter a valid phone number (e.g., +1234567890)';
    }
    
    // Caller number validation
    if (!schedulerForm.caller_number.trim()) {
      errors.caller_number = 'Caller number is required';
    }
    
    // Scheduled time validation
    if (!schedulerForm.scheduled_time) {
      errors.scheduled_time = 'Scheduled time is required';
    } else {
      const scheduledDate = new Date(schedulerForm.scheduled_time);
      const now = new Date();
      if (scheduledDate <= now) {
        errors.scheduled_time = 'Scheduled time must be in the future';
      }
    }
    
    // Flexible time validation
    if (schedulerForm.flexible_time_minutes < 0 || schedulerForm.flexible_time_minutes > VALIDATION_LIMITS.FLEXIBLE_TIME_MAX) {
      errors.flexible_time_minutes = `Flexible time must be between 0 and ${VALIDATION_LIMITS.FLEXIBLE_TIME_MAX} minutes`;
    }
    
    // Max retries validation
    if (schedulerForm.max_retries < VALIDATION_LIMITS.MAX_RETRIES_MIN || schedulerForm.max_retries > VALIDATION_LIMITS.MAX_RETRIES_MAX) {
      errors.max_retries = `Max retries must be between ${VALIDATION_LIMITS.MAX_RETRIES_MIN} and ${VALIDATION_LIMITS.MAX_RETRIES_MAX}`;
    }
    
    return Object.keys(errors).length === 0;
  }, [schedulerForm]);

  const handleSelectScheduledEvent = (event: ScheduledEvent) => {
    setSelectedScheduledEvent(event);
  };


  const handleEditScheduledEvent = (event: ScheduledEvent) => {
    setEditingScheduledEvent(event);
    
    // Convert Unix timestamp to datetime-local format
    const scheduledDate = new Date(parseInt(event.scheduled_time) * 1000);
    const formattedDate = scheduledDate.toISOString().slice(0, 16);
    
    setSchedulerForm({
      organization_id: event.organization_id,
      agent_prefix: event.agent_id,
      recipient_phone: event.recipient_phone,
      scheduled_time: formattedDate,
      caller_number: event.caller_number || '',
      flexible_time_minutes: event.flexible_time_minutes || 0,
      max_retries: event.max_retries || 3
    });
    setShowEditSchedulerModal(true);
  };



  // Outbound scheduler functions
  const handleScheduleOutboundCall = async () => {
    setSchedulerError(null);
    
    // Validate form
    if (!validateForm()) {
      setSchedulerError('Please fix the validation errors below.');
      return;
    }

    setScheduling(true);
    setSchedulerError(null);
    setSchedulerSuccess(null);

    try {
      // Convert scheduled_time to Unix timestamp
      const scheduledDate = new Date(schedulerForm.scheduled_time);
      const unixTimestamp = Math.floor(scheduledDate.getTime() / 1000);

      const schedulerData: SchedulerRequest = {
        organization_id: schedulerForm.organization_id,
        agent_id: schedulerForm.agent_prefix,
        call_type: 'outbound_call',
        recipient_phone: schedulerForm.recipient_phone,
        scheduled_time: unixTimestamp,
        caller_number: schedulerForm.caller_number,
        retry_interval_minutes: schedulerForm.flexible_time_minutes,
        max_retries: schedulerForm.max_retries
      };

      const result = await scheduleOutboundCall(schedulerData);
      
      if (result.success) {
        setSchedulerSuccess(result.message || 'Outbound call scheduled successfully!');
        
        // Reset form
        const orgId = getOrganizationId();
        setSchedulerForm({
          organization_id: orgId,
          agent_prefix: '',
          recipient_phone: '',
          scheduled_time: '',
          caller_number: '',
          flexible_time_minutes: 0,
          max_retries: 3
        });
        
        // Close modal and refresh scheduled events
        setShowCreateSchedulerModal(false);
        await loadScheduledEvents();
      } else {
        setSchedulerError(result.message || 'Failed to schedule outbound call');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSchedulerError('Failed to schedule outbound call: ' + errorMessage);
    } finally {
      setScheduling(false);
    }
  };

  const validateCallForm = () => {
    if (!callForm.caller_number) {
      return 'Please select a caller number.';
    }
    if (!callForm.callee_number) {
      return 'Please enter the callee number.';
    }
    if (!callForm.agent_name) {
      return 'Please select an agent.';
    }
    return null;
  };

  const handleInitiateCall = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    const validationError = validateCallForm();
    if (validationError) {
      setCallError(validationError);
      return;
    }

    setIsCalling(true);
    setCallError(null);
    setCallSuccess(null);

    try {
      // Ensure both numbers are in E.164 format (starts with +)
      const trimmedCallerNumber = callForm.caller_number.trim();
      const normalizedCallerNumber = trimmedCallerNumber.startsWith('+') 
        ? trimmedCallerNumber 
        : `+${trimmedCallerNumber}`;

      const trimmedCalleeNumber = callForm.callee_number.trim();
      const normalizedCalleeNumber = trimmedCalleeNumber.startsWith('+') 
        ? trimmedCalleeNumber 
        : `+${trimmedCalleeNumber}`;

      const callPayload: CallRequest = {
        caller_number: normalizedCallerNumber,
        callee_number: normalizedCalleeNumber,
        agent_name: callForm.agent_name.trim(),
      };

      const result = await makeOutboundCall(callPayload);
      if (result.success) {
        setCallSuccess(result.message || 'Outbound call initiated successfully!');
      } else {
        setCallError(result.message || 'Failed to initiate outbound call.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setCallError(`Failed to initiate outbound call: ${errorMessage}`);
    } finally {
      setIsCalling(false);
    }
  };

  const clearSchedulerMessages = () => {
    setSchedulerError(null);
    setSchedulerSuccess(null);
  };

  useEffect(() => {
    if (schedulerError || schedulerSuccess) {
      const timer = setTimeout(clearSchedulerMessages, TIMEOUTS.MESSAGE_DISPLAY);
      return () => clearTimeout(timer);
    }
  }, [schedulerError, schedulerSuccess]);

  useEffect(() => {
    if (callError || callSuccess) {
      const timer = setTimeout(() => {
        setCallError(null);
        setCallSuccess(null);
      }, TIMEOUTS.MESSAGE_DISPLAY);
      return () => clearTimeout(timer);
    }
  }, [callError, callSuccess]);

  // Filter scheduled events based on search term
  const filteredScheduledEvents = scheduledEvents.filter(event => {
    const agentDisplayName = getAgentDisplayName({ name: event.agent_name, id: event.agent_id });
    return event.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (event.agent_name && event.agent_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
           agentDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.recipient_phone.includes(searchTerm) ||
           event.status.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-full">
      {/* Main Container with Header */}
      <div className="flex-1 flex flex-col">
        {/* Header Section - Full Width */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Tabs - Using TabNavigation component */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <div className={`flex items-center gap-4 ${activeTab === 'call' ? 'justify-end' : 'justify-between'}`}>
            {/* Search Bar - Increased Width */}
            {activeTab !== 'call' && (
              <div className="w-98 relative group">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-green-400' : 'text-gray-400 group-focus-within:text-green-500'}`} />
                <input
                  type="text"
                  placeholder={activeTab === 'trunk' ? 'Search trunks...' : 'Search scheduled events...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label={activeTab === 'trunk' ? 'Search trunks' : 'Search scheduled events'}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            )}
            
            {/* Button Group - Right Most */}
            {activeTab !== 'call' && (
              <div className="flex items-center gap-3">
                {/* Create Button - Dynamic based on active tab */}
                {activeTab === 'trunk' ? (
                  <button
                    onClick={() => setShowCreateTrunkModal(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-sm font-semibold">Create Trunk</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreateSchedulerModal(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-semibold">Create Schedule</span>
                  </button>
                )}
              </div>
            )}
          </div>
      </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {activeTab === 'trunk' ? (
            // Full width trunk table
            <div className="flex-1 flex flex-col">
              {/* Trunk Table Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingTrunks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                    <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Loading trunks...
                    </span>
                  </div>
                ) : trunks.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className={`h-8 w-8 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No trunks found
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Trunk ID
                          </th>
                          <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Phone Number
                          </th>
                          <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Transport
                          </th>
                          <th className={`text-center py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {trunks.map((trunk, index) => (
                          <tr 
                            key={trunk.trunk_id || trunk.id || `trunk_${index}`}
                            className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                          >
                            <td className={`py-3 px-4 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              <div className="flex items-center gap-2">
                                <Phone className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                <span className="font-mono text-xs">
                                  {trunk.trunk_id || trunk.id}
                                </span>
                              </div>
                            </td>
                            <td className={`py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {trunk.phone_number}
                            </td>
                            <td className={`py-3 px-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                trunk.transport === 'udp' 
                                  ? isDarkMode 
                                    ? 'bg-green-900/30 text-green-300' 
                                    : 'bg-green-100 text-green-800'
                                  : isDarkMode 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {trunk.transport.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeleteTrunk(trunk.trunk_id || trunk.id)}
                                disabled={deletingTrunk === (trunk.trunk_id || trunk.id)}
                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                                  isDarkMode
                                    ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                                    : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                                }`}
                                title="Delete trunk"
                              >
                                {deletingTrunk === (trunk.trunk_id || trunk.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'scheduler' ? (
            // Scheduler layout with sidebar
            <>
              {/* Left Sidebar - Scheduled Events */}
              <div className="w-80 border-r border-gray-200/50 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Scheduled Events
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchTerm ? `${filteredScheduledEvents.length} of ${scheduledEvents.length} events` : `${scheduledEvents.length} scheduled events`}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Delete Messages */}
                {deleteError && (
                  <div className="p-3 mx-4 mb-3 rounded-lg bg-red-500/20 text-red-200 flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p>{deleteError}</p>
                    </div>
                    <button
                      onClick={() => {}}
                      className="text-red-300 hover:text-red-100 transition-colors duration-200"
                      title="Close message"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {deleteSuccess && (
                  <div className="p-3 mx-4 mb-3 rounded-lg bg-green-500/20 text-green-200 flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <p>{deleteSuccess}</p>
                    </div>
                    <button
                      onClick={() => {}}
                      className="text-green-300 hover:text-green-100 transition-colors duration-200"
                      title="Close message"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingScheduledEvents ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                      <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Loading scheduled events...
                      </span>
                    </div>
                  ) : filteredScheduledEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className={`h-8 w-8 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchTerm ? 'No events match your search' : 'No scheduled events found'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredScheduledEvents.map((event) => (
                        <div
                          key={event.scheduled_id}
                          className={`p-3 rounded-lg transition-all duration-200 ${
                            selectedScheduledEvent?.scheduled_id === event.scheduled_id
                              ? isDarkMode
                                ? 'bg-green-600/20 border border-green-500/50'
                                : 'bg-green-50 border border-green-200'
                              : isDarkMode
                                ? 'bg-gray-700/50 hover:bg-gray-700'
                                : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => handleSelectScheduledEvent(event)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {getAgentDisplayName({ name: event.agent_name, id: event.agent_id })}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  event.status === 'scheduled' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                To: {event.recipient_phone}
                              </p>
                              {event.caller_number && (
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  From: {event.caller_number}
                                </p>
                              )}
                              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {new Date(parseInt(event.scheduled_time) * 1000).toLocaleString()}
                              </p>
                            </div>
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScheduledEvent(event.scheduled_id);
                              }}
                              disabled={deletingEvent === event.scheduled_id}
                              className={`ml-2 p-1.5 rounded-lg transition-all duration-200 hover:scale-105 ${
                                isDarkMode
                                  ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                              }`}
                              title="Delete scheduled event"
                            >
                              {deletingEvent === event.scheduled_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Event Details */}
              <div className="flex-1 p-6">
                {selectedScheduledEvent ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                        <Calendar className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {getAgentDisplayName({ name: selectedScheduledEvent.agent_name, id: selectedScheduledEvent.agent_id })}
                        </h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Scheduled Event Details
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Agent
                        </label>
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {getAgentDisplayName({ name: selectedScheduledEvent.agent_name, id: selectedScheduledEvent.agent_id })}
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Recipient Phone
                        </label>
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedScheduledEvent.recipient_phone}
                        </p>
                      </div>
                      
                      {selectedScheduledEvent.caller_number && (
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Caller Number
                          </label>
                          <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {selectedScheduledEvent.caller_number}
                          </p>
                        </div>
                      )}
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Scheduled Time
                        </label>
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(parseInt(selectedScheduledEvent.scheduled_time) * 1000).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Status
                        </label>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          selectedScheduledEvent.status === 'scheduled' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedScheduledEvent.status}
                        </span>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Retry Interval
                        </label>
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedScheduledEvent.flexible_time_minutes || selectedScheduledEvent.retry_interval_minutes || 0} minutes
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Max Retries
                        </label>
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedScheduledEvent.max_retries}
                        </p>
                      </div>
                    </div>
                    
                    {selectedScheduledEvent.message_template && (
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Message Template
                        </label>
                        <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedScheduledEvent.message_template}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditScheduledEvent(selectedScheduledEvent)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteScheduledEvent(selectedScheduledEvent.scheduled_id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Calendar className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <h3 className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Select a Scheduled Event
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Choose a scheduled event from the sidebar to view its details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className={`rounded-2xl border ${isDarkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
                  <div className="p-6 sm:p-8">
                    <div className="mb-6">
                      <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Make Outbound Call
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Initiate an immediate outbound call using a provisioned trunk number and AI agent persona.
                      </p>
                    </div>

                    {(callError || callSuccess) && (
                      <div className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                        callError
                          ? isDarkMode
                            ? 'border-red-500/40 bg-red-500/10 text-red-200'
                            : 'border-red-200 bg-red-50 text-red-700'
                          : isDarkMode
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}>
                        {callError ? (
                          <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        )}
                        <div className="text-sm font-medium">
                          {callError || callSuccess}
                        </div>
                      </div>
                    )}

                    <form className="space-y-6" onSubmit={handleInitiateCall}>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Caller Number (From)
                          </label>
                          <div className="relative">
                            <Phone className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <select
                              value={callForm.caller_number}
                              onChange={(e) => setCallForm(prev => ({ ...prev, caller_number: e.target.value }))}
                              required
                              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/60 ${
                                isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
                              }`}
                            >
                              <option value="">Select caller number</option>
                              {availableCallerNumbers.length === 0 && (
                                <option value="" disabled>
                                  No caller numbers available
                                </option>
                              )}
                              {availableCallerNumbers.map((number) => (
                                <option key={number} value={number}>
                                  {number}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Callee Number (To)
                          </label>
                          <div className="relative">
                            <PhoneCall className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <input
                              type="tel"
                              value={callForm.callee_number}
                              onChange={(e) => setCallForm(prev => ({ ...prev, callee_number: e.target.value }))}
                              required
                              placeholder="+1XXXXXXXXXX"
                              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/60 ${
                                isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Agent Persona
                          </label>
                          <div className="relative">
                            <User className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <select
                              value={callForm.agent_name}
                              onChange={(e) => setCallForm(prev => ({ ...prev, agent_name: e.target.value }))}
                              required
                              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500/60 ${
                                isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
                              }`}
                            >
                              <option value="">Select agent persona</option>
                              {agents.map((agent) => (
                                <option key={agent.agent_prefix} value={agent.agent_prefix}>
                                  {agent.agent_prefix}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end">
                          <button
                            type="submit"
                            disabled={isCalling || availableCallerNumbers.length === 0}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                              isCalling || availableCallerNumbers.length === 0
                                ? isDarkMode
                                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : isDarkMode
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {isCalling ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Initiating...
                              </>
                            ) : (
                              <>
                                <PhoneCall className="h-4 w-4" />
                                Initiate Call
                              </>
                            )}
                          </button>
                          {availableCallerNumbers.length === 0 && (
                            <p className={`text-xs mt-2 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                              Add a trunk with a caller number before placing calls.
                            </p>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Scheduler Modal */}
      {showCreateSchedulerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowCreateSchedulerModal(false)}>
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Create Scheduled Event
            </h3>
            
            <div className="space-y-4">
              {/* First Row - Agent and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Agent Selection */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <User className="h-4 w-4" />
                    Agent *
                  </label>
                  <select
                    value={schedulerForm.agent_prefix}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, agent_prefix: e.target.value});
                    }}
                    aria-label="Select an agent"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                    disabled={loadingAgents}
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent, index) => (
                      <option key={agent.id || agent.name || agent.agent_prefix || `agent_${index}`} value={agent.agent_prefix}>
                        {getAgentDisplayName({ name: agent.name, id: agent.agent_prefix })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Phone */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Phone className="h-4 w-4" />
                    To *
                  </label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={schedulerForm.recipient_phone}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, recipient_phone: e.target.value});
                    }}
                    aria-label="Recipient phone number"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              {/* Second Row - Caller Number and Scheduled Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Caller Number */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Phone className="h-4 w-4" />
                    From *
                  </label>
                  <select
                    value={schedulerForm.caller_number}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, caller_number: e.target.value});
                    }}
                    aria-label="Select caller number"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  >
                    <option value="">Select caller number</option>
                    {trunks.map((trunk, index) => (
                      <option key={trunk.id || trunk.phone_number || `trunk_${index}`} value={trunk.phone_number}>
                        {trunk.phone_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scheduled Time */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Calendar className="h-4 w-4" />
                    Scheduled Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={schedulerForm.scheduled_time}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, scheduled_time: e.target.value});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>
                </div>

              {/* Third Row - Retry Interval and Max Retries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Retry Interval */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Clock className="h-4 w-4" />
                    Retry Interval (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={schedulerForm.flexible_time_minutes || 0}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, flexible_time_minutes: parseInt(e.target.value) || 0});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
              </div>

                {/* Max Retries */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Clock className="h-4 w-4" />
                  Maximum Retries
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={schedulerForm.max_retries || 3}
                  onChange={(e) => {
                    setSchedulerForm({...schedulerForm, max_retries: parseInt(e.target.value) || 3});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                />
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {schedulerError && (
              <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-xs sm:text-sm">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p>{schedulerError}</p>
              </div>
            )}

            {schedulerSuccess && (
              <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p>{schedulerSuccess}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 sm:mt-8 flex justify-center sticky bottom-0 bg-inherit pt-4">
              <button
                onClick={handleScheduleOutboundCall}
                disabled={scheduling || !schedulerForm.agent_prefix || !schedulerForm.recipient_phone || !schedulerForm.caller_number || !schedulerForm.scheduled_time}
                className="group relative px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
              >
                {scheduling ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="text-sm sm:text-base font-semibold">
                  {scheduling ? 'Creating...' : 'Scheduled Event'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Scheduler Modal */}
      {showEditSchedulerModal && editingScheduledEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowEditSchedulerModal(false)}>
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Edit Scheduled Event
            </h3>
            
            <div className="space-y-4">
              {/* First Row - Agent and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Agent Selection */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <User className="h-4 w-4" />
                    Agent *
                  </label>
                  <select
                    value={schedulerForm.agent_prefix}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, agent_prefix: e.target.value});
                    }}
                    aria-label="Select an agent"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                    disabled={loadingAgents}
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent, index) => (
                      <option key={agent.id || agent.name || agent.agent_prefix || `agent_${index}`} value={agent.agent_prefix}>
                        {getAgentDisplayName({ name: agent.name, id: agent.agent_prefix })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Phone */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Phone className="h-4 w-4" />
                    To *
                  </label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={schedulerForm.recipient_phone}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, recipient_phone: e.target.value});
                    }}
                    aria-label="Recipient phone number"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              {/* Second Row - Caller Number and Scheduled Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Caller Number */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Phone className="h-4 w-4" />
                    From *
                  </label>
                  <select
                    value={schedulerForm.caller_number}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, caller_number: e.target.value});
                    }}
                    aria-label="Select caller number"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  >
                    <option value="">Select caller number</option>
                    {trunks.map((trunk, index) => (
                      <option key={trunk.id || trunk.phone_number || `trunk_${index}`} value={trunk.phone_number}>
                        {trunk.phone_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scheduled Time */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Calendar className="h-4 w-4" />
                    Scheduled Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={schedulerForm.scheduled_time}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, scheduled_time: e.target.value});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Third Row - Retry Interval and Max Retries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Retry Interval */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Clock className="h-4 w-4" />
                    Retry Interval (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={schedulerForm.flexible_time_minutes || 0}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, flexible_time_minutes: parseInt(e.target.value) || 0});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>

                {/* Max Retries */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Clock className="h-4 w-4" />
                    Maximum Retries
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={schedulerForm.max_retries || 3}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, max_retries: parseInt(e.target.value) || 3});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {schedulerError && (
              <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-xs sm:text-sm">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p>{schedulerError}</p>
              </div>
            )}

            {schedulerSuccess && (
              <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p>{schedulerSuccess}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 sm:mt-8 flex justify-center sticky bottom-0 bg-inherit pt-4">
              <button
                onClick={async () => {
                  if (!editingScheduledEvent) return;
                  
                  setScheduling(true);
                  setSchedulerError(null);
                  
                  try {
                    // Convert scheduled_time to Unix timestamp
                    const scheduledDate = new Date(schedulerForm.scheduled_time);
                    const unixTimestamp = Math.floor(scheduledDate.getTime() / 1000);

                    const updateData = {
                      scheduled_time: unixTimestamp,
                      retry_interval_minutes: schedulerForm.flexible_time_minutes,
                      max_retries: schedulerForm.max_retries,
                      recipient_phone: schedulerForm.recipient_phone,
                      agent_id: schedulerForm.agent_prefix,
                      caller_number: schedulerForm.caller_number
                    };
                    
                    const result = await updateScheduledEvent(editingScheduledEvent.scheduled_id, updateData);
                    
                    if (result.success) {
                      setSchedulerSuccess('Scheduled event updated successfully!');
                      
                      // Update the selected event with new data
                      if (selectedScheduledEvent && selectedScheduledEvent.scheduled_id === editingScheduledEvent.scheduled_id) {
                        setSelectedScheduledEvent({
                          ...selectedScheduledEvent,
                          scheduled_time: unixTimestamp.toString(),
                          flexible_time_minutes: schedulerForm.flexible_time_minutes,
                          max_retries: schedulerForm.max_retries,
                          recipient_phone: schedulerForm.recipient_phone,
                          agent_id: schedulerForm.agent_prefix,
                          caller_number: schedulerForm.caller_number
                        });
                      }
                      
                      setShowEditSchedulerModal(false);
                      setEditingScheduledEvent(null);
                      await loadScheduledEvents();
                    } else {
                      setSchedulerError(result.message || 'Failed to update scheduled event');
                    }
                  } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    setSchedulerError('Failed to update scheduled event: ' + errorMessage);
                  } finally {
                    setScheduling(false);
                  }
                }}
                disabled={scheduling || !schedulerForm.agent_prefix || !schedulerForm.recipient_phone || !schedulerForm.caller_number || !schedulerForm.scheduled_time}
                className="group relative px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
              >
                {scheduling ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="text-sm sm:text-base font-semibold">
                  {scheduling ? 'Updating...' : 'Update Event'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}


        {/* Create Trunk Modal */}
        {showCreateTrunkModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Phone className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Create Trunk
                  </h3>
                </div>

                {/* Trunk Messages */}
                {trunkError && (
                  <div className="p-3 mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>{trunkError}</p>
                  </div>
                )}

                {trunkSuccess && (
                  <div className="p-3 mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <p>{trunkSuccess}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Phone Number Selection */}
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Phone className="h-4 w-4" />
                      Phone Number *
                    </label>
                    <select
                      value={trunkForm.phone_number}
                      onChange={(e) => setTrunkForm({...trunkForm, phone_number: e.target.value})}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                      disabled={loadingPhoneNumbers}
                    >
                      <option value="">Select a phone number</option>
                      {loadingPhoneNumbers ? (
                        <option value="" disabled>Loading phone numbers...</option>
                      ) : phoneNumbers.length > 0 ? (
                        phoneNumbers.map((phone, index) => {
                          // Handle different possible field names for phone number
                          const phoneNumber = phone.phone_number || phone.number || phone.phone || phone;
                          const phoneId = phone.phone_id || phone.id || `phone_${index}`;
                          const friendlyName = phone.friendly_name || phone.name || '';
                          
                          return (
                            <option key={phoneId} value={phoneNumber}>
                              {phoneNumber} {friendlyName ? `(${friendlyName})` : ''}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>No phone numbers available</option>
                      )}
                    </select>
                  </div>

                  {/* Transport */}
                  <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Phone className="h-4 w-4" />
                      Transport
                    </label>
                    <select
                      value={trunkForm.transport}
                      onChange={(e) => setTrunkForm({...trunkForm, transport: e.target.value})}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                    >
                      <option value="udp">UDP</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateTrunkModal(false)}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTrunk}
                    disabled={creatingTrunk || !trunkForm.phone_number}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {creatingTrunk ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                    {creatingTrunk ? 'Creating...' : 'Create Trunk'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
