'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MessageSquare, User, Phone, Loader2, AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getAgentsByOrganization
} from '../../service/phoneNumberService';
import { 
  Agent, 
  ScheduledEvent, 
  ApiResponse, 
  SchedulerFormData, 
  FormErrors,
  TIMEOUTS,
  VALIDATION_LIMITS 
} from './types/phoneNumbers';
import { useOrganizationId } from './utils/phoneNumberUtils';

interface OutboundSMSSchedulerProps {
    refreshTrigger?: number;
}

export default function OutboundSMSScheduler({ refreshTrigger }: OutboundSMSSchedulerProps) {
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
  
  // State for scheduled events
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [selectedScheduledEvent, setSelectedScheduledEvent] = useState<ScheduledEvent | null>(null);
  const [loadingScheduledEvents, setLoadingScheduledEvents] = useState(false);
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
    flexible_time_minutes: 0,
    max_retries: 3
  });
  const [scheduling, setScheduling] = useState(false);
  const [schedulerError, setSchedulerError] = useState<string | null>(null);
  const [schedulerSuccess, setSchedulerSuccess] = useState<string | null>(null);
  
  // Agents state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const orgId = getOrganizationId();
    setSchedulerForm(prev => ({ ...prev, organization_id: orgId }));
    
    loadScheduledEvents();
    loadAgents();
  }, [getOrganizationId]);

  // Reload data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadScheduledEvents();
      loadAgents();
    }
  }, [refreshTrigger]);

  const loadScheduledEvents = useCallback(async () => {
    setLoadingScheduledEvents(true);
    try {
      // TODO: Implement SMS scheduled events API call
      // For now, we'll use empty array as placeholder
      setScheduledEvents([]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading scheduled SMS events:', errorMessage);
      setScheduledEvents([]);
    } finally {
      setLoadingScheduledEvents(false);
    }
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
    setSchedulerForm({
      organization_id: event.organization_id,
      agent_prefix: event.agent_id,
      recipient_phone: event.recipient_phone,
      scheduled_time: event.scheduled_time,
      flexible_time_minutes: event.flexible_time_minutes,
      max_retries: event.max_retries
    });
    setShowEditSchedulerModal(true);
  };

  const handleDeleteScheduledEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled SMS event?')) {
      return;
    }

    try {
      // TODO: Implement SMS scheduled event deletion API call
      setSchedulerSuccess('Scheduled SMS event deleted successfully!');
      await loadScheduledEvents(); // Refresh the list
      if (selectedScheduledEvent?.scheduled_id === eventId) {
        setSelectedScheduledEvent(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSchedulerError('Failed to delete scheduled SMS event: ' + errorMessage);
    }
  };

  // Outbound scheduler functions
  const handleScheduleOutboundSMS = async () => {
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
      // TODO: Implement SMS scheduling API call
      setSchedulerSuccess('Outbound SMS scheduled successfully!');
      
      // Reset form
      const orgId = getOrganizationId();
      setSchedulerForm({
        organization_id: orgId,
        agent_prefix: '',
        recipient_phone: '',
        scheduled_time: '',
        flexible_time_minutes: 0,
        max_retries: 3
      });
      
      // Close modal and refresh scheduled events
      setShowCreateSchedulerModal(false);
      await loadScheduledEvents();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSchedulerError('Failed to schedule outbound SMS: ' + errorMessage);
      console.error('Error scheduling outbound SMS:', err);
    } finally {
      setScheduling(false);
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

  // Filter scheduled events based on search term
  const filteredScheduledEvents = scheduledEvents.filter(event =>
    event.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.recipient_phone.includes(searchTerm) ||
    event.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Scheduled Events List */}
      <div className="w-80 border-r border-gray-200/50 flex flex-col">
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Scheduled SMS Events
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm ? `${filteredScheduledEvents.length} of ${scheduledEvents.length} events` : `${scheduledEvents.length} scheduled events`}
              </p>
            </div>
            
            {/* Create Schedule Button */}
            <button
              onClick={() => setShowCreateSchedulerModal(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-semibold">Create Schedule</span>
            </button>
          </div>
          
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-orange-400' : 'text-gray-400 group-focus-within:text-orange-500'}`} />
            <input
              type="text"
              placeholder="Search scheduled SMS events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search scheduled SMS events"
              className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loadingScheduledEvents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading scheduled SMS events...
              </span>
            </div>
          ) : filteredScheduledEvents.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className={`h-8 w-8 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm ? 'No SMS events match your search' : 'No scheduled SMS events found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScheduledEvents.map((event) => (
                <div
                  key={event.scheduled_id}
                  onClick={() => handleSelectScheduledEvent(event)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedScheduledEvent?.scheduled_id === event.scheduled_id
                      ? isDarkMode
                        ? 'bg-orange-600/20 border border-orange-500/50'
                        : 'bg-orange-50 border border-orange-200'
                      : isDarkMode
                        ? 'bg-gray-700/50 hover:bg-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {event.agent_id}
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
                    {event.recipient_phone}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {new Date(event.scheduled_time).toLocaleString()}
                  </p>
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
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                <MessageSquare className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedScheduledEvent.agent_id}
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Scheduled SMS Event Details
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Agent
                </label>
                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedScheduledEvent.agent_id}
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
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Scheduled Time
                </label>
                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(selectedScheduledEvent.scheduled_time).toLocaleString()}
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
                  Flexible Time
                </label>
                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedScheduledEvent.flexible_time_minutes} minutes
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <MessageSquare className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select a Scheduled SMS Event
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Choose a scheduled SMS event from the sidebar to view its details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Scheduler Modal */}
      {showCreateSchedulerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowCreateSchedulerModal(false)}>
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Create Scheduled SMS Event
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
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                    disabled={loadingAgents}
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent, index) => (
                      <option key={agent.id || agent.name || agent.agent_prefix || `agent_${index}`} value={agent.name || agent.agent_prefix}>
                        {agent.name || agent.agent_prefix}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Phone */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Phone className="h-4 w-4" />
                    Recipient Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={schedulerForm.recipient_phone}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, recipient_phone: e.target.value});
                    }}
                    aria-label="Recipient phone number"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              {/* Second Row - Scheduled Time and Flexible Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>

                {/* Flexible Time */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Clock className="h-4 w-4" />
                    Flexible Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={schedulerForm.flexible_time_minutes}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, flexible_time_minutes: parseInt(e.target.value) || 0});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Third Row - Max Retries */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Clock className="h-4 w-4" />
                  Maximum Retries
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={schedulerForm.max_retries}
                  onChange={(e) => {
                    setSchedulerForm({...schedulerForm, max_retries: parseInt(e.target.value) || 3});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                />
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
                onClick={handleScheduleOutboundSMS}
                disabled={scheduling || !schedulerForm.agent_prefix || !schedulerForm.recipient_phone || !schedulerForm.scheduled_time}
                className="group relative px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg sm:rounded-xl hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
              >
                {scheduling ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="text-sm sm:text-base font-semibold">
                  {scheduling ? 'Creating...' : 'Schedule SMS Event'}
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
              Edit Scheduled SMS Event
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
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                    disabled={loadingAgents}
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent, index) => (
                      <option key={agent.id || agent.name || agent.agent_prefix || `agent_${index}`} value={agent.name || agent.agent_prefix}>
                        {agent.name || agent.agent_prefix}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Phone */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Phone className="h-4 w-4" />
                    Recipient Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={schedulerForm.recipient_phone}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, recipient_phone: e.target.value});
                    }}
                    aria-label="Recipient phone number"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              {/* Second Row - Scheduled Time and Flexible Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>

                {/* Flexible Time */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Clock className="h-4 w-4" />
                    Flexible Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={schedulerForm.flexible_time_minutes}
                    onChange={(e) => {
                      setSchedulerForm({...schedulerForm, flexible_time_minutes: parseInt(e.target.value) || 0});
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Third Row - Max Retries */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Clock className="h-4 w-4" />
                  Maximum Retries
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={schedulerForm.max_retries}
                  onChange={(e) => {
                    setSchedulerForm({...schedulerForm, max_retries: parseInt(e.target.value) || 3});
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                />
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
                    // TODO: Implement SMS scheduled event update API call
                    setSchedulerSuccess('Scheduled SMS event updated successfully!');
                    
                    // Update the selected event with new data
                    if (selectedScheduledEvent && selectedScheduledEvent.scheduled_id === editingScheduledEvent.scheduled_id) {
                      setSelectedScheduledEvent({
                        ...selectedScheduledEvent,
                        scheduled_time: schedulerForm.scheduled_time,
                        flexible_time_minutes: schedulerForm.flexible_time_minutes,
                        max_retries: schedulerForm.max_retries,
                        recipient_phone: schedulerForm.recipient_phone,
                        agent_id: schedulerForm.agent_prefix
                      });
                    }
                    
                    setShowEditSchedulerModal(false);
                    setEditingScheduledEvent(null);
                    await loadScheduledEvents();
                  } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    setSchedulerError('Failed to update scheduled SMS event: ' + errorMessage);
                  } finally {
                    setScheduling(false);
                  }
                }}
                disabled={scheduling || !schedulerForm.agent_prefix || !schedulerForm.recipient_phone || !schedulerForm.scheduled_time}
                className="group relative px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
              >
                {scheduling ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="text-sm sm:text-base font-semibold">
                  {scheduling ? 'Updating...' : 'Update SMS Event'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}