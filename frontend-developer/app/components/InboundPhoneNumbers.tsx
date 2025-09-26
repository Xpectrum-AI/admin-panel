'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Search, User, AlertCircle, CheckCircle, XCircle, Loader2, Plus, MessageSquare, PhoneCall, Edit, Trash2 } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { getAgentDisplayName } from '../../lib/utils/agentNameUtils';
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

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

interface InboundPhoneNumbersTableProps {
  refreshTrigger?: number;
}

export default function InboundPhoneNumbersTable({ refreshTrigger }: InboundPhoneNumbersTableProps) {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningAgent, setAssigningAgent] = useState('');
  const [assigningPhoneNumber, setAssigningPhoneNumber] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Unassign modal state
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedPhoneForUnassign, setSelectedPhoneForUnassign] = useState<PhoneNumber | null>(null);
  const [unassigningAgent, setUnassigningAgent] = useState('');
  const [unassigning, setUnassigning] = useState(false);
  const [unassigningPhoneId, setUnassigningPhoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [smsFilter, setSmsFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [whatsappFilter, setWhatsappFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('');

  // Organization name state
  const [organizationName, setOrganizationName] = useState<string>('');

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

  // Get organization name from user context
  useEffect(() => {
    if (userClass) {
      const orgs = userClass.getOrgs?.() || [];
      console.log('🔍 Available organizations from userClass:', orgs);
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const orgName = org.orgName || org.name || '';
        console.log('🔍 Setting organization name:', orgName);
        setOrganizationName(orgName);
      } else {
        console.log('⚠️ No organizations found in userClass');
      }
    } else {
      console.log('⚠️ userClass is not available');
    }
  }, [userClass]);

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

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadOrganizationPhoneNumbers();
    }
  }, [refreshTrigger, loadOrganizationPhoneNumbers]);

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

  // Show organization phone numbers if available, otherwise show available phone numbers
  const allPhoneNumbers: PhoneNumber[] = organizationPhoneNumbers.length > 0
    ? organizationPhoneNumbers.map(orgPhone => ({
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
    }))
    : availablePhoneNumbers.map(availablePhone => ({
      phone_number: availablePhone.phone_number || '',
      agent_id: null, // No agent assigned for available numbers
      organization_id: availablePhone.organization_id || '',
      status: availablePhone.status || 'available',
      created_at: availablePhone.created_at || new Date().toISOString(),
      updated_at: availablePhone.updated_at || new Date().toISOString(),
      // Add organization-specific fields
      phone_id: availablePhone.phone_id || '',
      voice_enabled: availablePhone.voice_enabled || false,
      sms_enabled: availablePhone.sms_enabled || false,
      whatsapp_enabled: availablePhone.whatsapp_enabled || false,
      inbound_enabled: availablePhone.inbound_enabled || false,
      outbound_enabled: availablePhone.outbound_enabled || false,
      agent_name: null // No agent name for available numbers
    }));

  const filteredPhoneNumbers = allPhoneNumbers.filter(phone => {
    // Text search filter
    const matchesSearch = !searchTerm ||
      (phone.agent_id && phone.agent_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      phone.phone_number.includes(searchTerm) ||
      (phone.agent_name && phone.agent_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Voice capability filter
    const matchesVoice = voiceFilter === 'all' ||
      (voiceFilter === 'enabled' && phone.voice_enabled) ||
      (voiceFilter === 'disabled' && !phone.voice_enabled);

    // SMS capability filter
    const matchesSms = smsFilter === 'all' ||
      (smsFilter === 'enabled' && phone.sms_enabled) ||
      (smsFilter === 'disabled' && !phone.sms_enabled);

    // WhatsApp capability filter
    const matchesWhatsapp = whatsappFilter === 'all' ||
      (whatsappFilter === 'enabled' && phone.whatsapp_enabled) ||
      (whatsappFilter === 'disabled' && !phone.whatsapp_enabled);

    // Agent filter
    const matchesAgent = !agentFilter ||
      (phone.agent_id && phone.agent_id.toLowerCase().includes(agentFilter.toLowerCase())) ||
      (phone.agent_name && phone.agent_name.toLowerCase().includes(agentFilter.toLowerCase()));

    return matchesSearch && matchesVoice && matchesSms && matchesWhatsapp && matchesAgent;
  });

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
        setShowAssignModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUnassignPhoneNumber = async () => {
    if (!selectedPhoneForUnassign) {
      setError('No phone number selected.');
      return;
    }

    setUnassigning(true);
    setError(null);
    setSuccess(null);

    try {
      let response;

      if (!unassigningAgent.trim() || unassigningAgent.trim() === 'None') {
        // Unassign the phone number
        if (!selectedPhoneForUnassign.phone_id || !selectedPhoneForUnassign.agent_id) {
          setError('Phone ID or current agent not found. Please refresh and try again.');
          return;
        }

        response = await unassignPhoneNumberFromAgent(selectedPhoneForUnassign.phone_id as string, selectedPhoneForUnassign.agent_id as string);

        if (response.success) {
          setSuccess(`Phone number ${selectedPhoneForUnassign.phone_number} unassigned successfully!`);
        } else {
          setError(response.message || 'Failed to unassign phone number.');
          return;
        }
      } else {
        // Assign the phone number to a new agent
        if (!selectedPhoneForUnassign.phone_id) {
          setError('Phone ID not found. Please refresh and try again.');
          return;
        }

        response = await assignPhoneNumberToAgent(selectedPhoneForUnassign.phone_id as string, unassigningAgent);

        if (response.success) {
          // Success handled below
        } else {
          setError(response.message || 'Failed to assign phone number.');
          return;
        }
      }

      // Close modal and refresh data on success
      setShowUnassignModal(false);
      setSelectedPhoneForUnassign(null);
      setUnassigningAgent('');

      // Refresh only the relevant phone number list based on the action
      const action = !unassigningAgent.trim() || unassigningAgent.trim() === 'None' ? 'unassigned' : 'assigned';
      
      if (!unassigningAgent.trim() || unassigningAgent.trim() === 'None') {
        // Unassigning - refresh organization numbers immediately, available numbers in background
        setSuccess(`Phone number ${selectedPhoneForUnassign.phone_number} unassigned successfully!`);
        await loadOrganizationPhoneNumbers();
        loadAvailablePhoneNumbers().catch(err => 
          console.warn('Background refresh of available numbers failed:', err)
        );
      } else {
        // Assigning - only refresh organization numbers for immediate display
        setSuccess(`Phone number ${selectedPhoneForUnassign.phone_number} assigned successfully!`);
        await loadOrganizationPhoneNumbers();
      }

    } catch (err: unknown) {
      const action = !unassigningAgent.trim() || unassigningAgent.trim() === 'None' ? 'unassign' : 'assign';
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error ${action}ing phone number: ` + errorMessage);
      console.error(`Error ${action}ing phone number:`, err);
    } finally {
      setUnassigning(false);
    }
  };

  const handleDirectUnassign = async (phoneNumber: any) => {
    if (!phoneNumber.phone_id || !phoneNumber.agent_id) {
      setError('Phone ID or current agent not found. Please refresh and try again.');
      return;
    }

    setUnassigningPhoneId(phoneNumber.phone_id);
    setError(null);
    setSuccess(null);

    try {
      const response = await unassignPhoneNumberFromAgent(phoneNumber.phone_id as string, phoneNumber.agent_id as string);

      if (response.success) {
        setSuccess(`Phone number ${phoneNumber.phone_number} unassigned successfully!`);
        
        // Refresh organization phone numbers immediately to show the change
        await loadOrganizationPhoneNumbers();
        
        // Refresh available numbers in the background (non-blocking)
        loadAvailablePhoneNumbers().catch(err => 
          console.warn('Background refresh of available numbers failed:', err)
        );
      } else {
        setError(response.message || 'Failed to unassign phone number.');
      }
    } catch (error) {
      console.error('Error unassigning phone number:', error);
      setError('An error occurred while unassigning the phone number.');
    } finally {
      setUnassigningPhoneId(null);
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

      // Refresh only the relevant phone number list based on the action
      if (!assigningAgent.trim() || assigningAgent.trim() === 'None') {
        // Unassigning - refresh both lists
        setSuccess(`Phone number ${assigningPhoneNumber} unassigned successfully! Refreshing lists...`);
        await Promise.all([
          loadAvailablePhoneNumbers(), // Refresh available numbers
          loadOrganizationPhoneNumbers() // Refresh organization numbers
        ]);
        setSuccess(`Phone number ${assigningPhoneNumber} unassigned successfully! Lists updated.`);
      } else {
        // Assigning - only refresh organization numbers for immediate display
        setSuccess(`Phone number ${assigningPhoneNumber} assigned to ${assigningAgent} successfully!`);
        await loadOrganizationPhoneNumbers(); // Only refresh organization numbers
      }

    } catch (err: unknown) {
      const action = !assigningAgent.trim() || assigningAgent.trim() === 'None' ? 'unassign' : 'assign';
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error ${action}ing phone number: ` + errorMessage);
      console.error(`Error ${action}ing phone number:`, err);
    } finally {
      setAssigning(false);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Format as +1 XXX XXX XXXX
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `+1 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }

    return phoneNumber;
  };

  // Get friendly name from phone number
  const getFriendlyName = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const areaCode = cleaned.slice(1, 4);
      const number = cleaned.slice(4);
      return `(${areaCode}) ${number.slice(0, 3)}-${number.slice(3)}`;
    } else if (cleaned.length === 10) {
      const areaCode = cleaned.slice(0, 3);
      const number = cleaned.slice(3);
      return `(${areaCode}) ${number.slice(0, 3)}-${number.slice(3)}`;
    }
    return phoneNumber;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search, Filters and Assign Agent Button */}
      <div className="p-4 border-b border-gray-200/50 space-y-4">
        {/* Top Row: Search, Organization Name and Assign Button */}
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
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

          <div className="flex items-center gap-4">
            {/* Organization Name */}
            {organizationName && (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium px-3 py-2 rounded-lg ${isDarkMode
                  ? 'bg-gray-700 text-gray-200 border border-gray-600'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}>
                  {organizationName}
                </span>
              </div>
            )}

            {/* Assign Agent Button */}
            <button
              onClick={() => {
                setAssigningAgent('');
                setAssigningPhoneNumber('');
                setShowAssignModal(true);
              }}
              className="group relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-semibold">Add Agent</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="space-y-3">
          {/* Capability Filters Row */}
          <div className="flex flex-wrap items-center gap-6">
            {/* <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Filter by Capabilities:
            </span> */}

            {/* Voice Filter */}
            <div className="flex items-center gap-3">
              <PhoneCall className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <select
                value={voiceFilter}
                onChange={(e) => setVoiceFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
                className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600' : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                <option value="all">All Voice</option>
                <option value="enabled">Voice Enabled</option>
                <option value="disabled">Voice Disabled</option>
              </select>
            </div>

            {/* SMS Filter */}
            <div className="flex items-center gap-3">
              <MessageSquare className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <select
                value={smsFilter}
                onChange={(e) => setSmsFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
                className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600' : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                <option value="all">All SMS</option>
                <option value="enabled">SMS Enabled</option>
                <option value="disabled">SMS Disabled</option>
              </select>
            </div>

            {/* WhatsApp Filter */}
            <div className="flex items-center gap-3">
              <WhatsAppIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <select
                value={whatsappFilter}
                onChange={(e) => setWhatsappFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
                className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600' : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                <option value="all">All WhatsApp</option>
                <option value="enabled">WhatsApp Enabled</option>
                <option value="disabled">WhatsApp Disabled</option>
              </select>
            </div>
          </div>

          {/* Agent Filter and Clear Button Row */}
          <div className="flex flex-wrap items-center gap-6">
            {/* <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Filter by Agent:
            </span> */}

            {/* Agent Filter */}
            <div className="flex items-center gap-3">
              <User className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Enter agent name or prefix..."
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-64 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 hover:bg-gray-600' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 hover:bg-gray-50'}`}
              />
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setVoiceFilter('all');
                setSmsFilter('all');
                setWhatsappFilter('all');
                setAgentFilter('');
              }}
              className={`px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-200 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden">
        {(loading || loadingOrgPhoneNumbers) && filteredPhoneNumbers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
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
              {searchTerm ? 'Try adjusting your search' : 'No phone numbers found for this organization'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className={`w-full ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}`}>
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-sm">
                    Number
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">
                    Friendly Name
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">
                    Enabled
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">
                    Agent
                  </th>
                  {organizationPhoneNumbers.length > 0 && (
                    <th className="text-left py-4 px-6 font-semibold text-sm">
                      Unassign
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredPhoneNumbers.map((phoneNumber, index) => (
                  <tr
                    key={phoneNumber.phone_number}
                    className={`border-b transition-colors duration-200 ${isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800/50'
                        : 'border-gray-200 hover:bg-gray-50'
                      } ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-900/30' : 'bg-white') : (isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50')}`}
                  >
                    {/* Number Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Phone className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <div>
                          <div className="font-medium text-sm">
                            {formatPhoneNumber(phoneNumber.phone_number)}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {/* You can add location info here if available */}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Friendly Name Column */}
                    <td className="py-4 px-6">
                      <span className="text-sm">
                        {getFriendlyName(phoneNumber.phone_number)}
                      </span>
                    </td>

                    {/* Enabled Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        {/* Voice */}
                        <div className="flex items-center gap-1">
                          <PhoneCall
                            className={`h-4 w-4 ${phoneNumber.voice_enabled
                                ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                              }`}
                          />
                          <span className={`text-xs font-medium ${phoneNumber.voice_enabled
                              ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                              : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                            }`}>
                            Voice
                          </span>
                        </div>

                        {/* SMS */}
                        <div className="flex items-center gap-1">
                          <MessageSquare
                            className={`h-4 w-4 ${phoneNumber.sms_enabled
                                ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                                : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                              }`}
                          />
                          <span className={`text-xs font-medium ${phoneNumber.sms_enabled
                              ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                              : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                            }`}>
                            SMS
                          </span>
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center gap-1">
                          <WhatsAppIcon
                            className={`h-4 w-4 ${phoneNumber.whatsapp_enabled
                                ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                              }`}
                          />
                          <span className={`text-xs font-medium ${phoneNumber.whatsapp_enabled
                              ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                              : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                            }`}>
                            WhatsApp
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Agent Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className="text-sm">
                          {phoneNumber.agent_id && phoneNumber.agent_id !== 'unassigned' && phoneNumber.agent_id !== null
                            ? getAgentDisplayName({ name: phoneNumber.agent_name, id: phoneNumber.agent_id })
                            : 'Unassigned'
                          }
                        </span>
                        {isAssigned(phoneNumber) ? (
                          <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                        ) : (
                          <XCircle className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        )}
                      </div>
                    </td>

                    {/* Unassign Column - Only show when organization phone numbers exist */}
                    {organizationPhoneNumbers.length > 0 && (
                      <td className="py-4 px-6">
                        {phoneNumber.agent_id && phoneNumber.agent_id !== 'unassigned' && phoneNumber.agent_id !== null ? (
                          <button
                            onClick={() => handleDirectUnassign(phoneNumber)}
                            disabled={unassigningPhoneId === phoneNumber.phone_id}
                            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${unassigningPhoneId === phoneNumber.phone_id
                                ? 'opacity-50 cursor-not-allowed'
                                : isDarkMode
                                  ? 'hover:bg-red-700 text-red-400 hover:text-white'
                                  : 'hover:bg-red-100 text-red-500 hover:text-red-700'
                              }`}
                            title="Delete agent"
                          >
                            {unassigningPhoneId === phoneNumber.phone_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedPhoneForUnassign(phoneNumber);
                              setUnassigningAgent('');
                              setShowUnassignModal(true);
                            }}
                            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                              }`}
                            title="Add agent"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Add Agent
            </h3>

            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Select an agent prefix and phone number to create a new assignment.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div className="space-y-6">
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
                    <option key={agent.id || agent.name || agent.agent_prefix || `agent_${index}`} value={agent.name || agent.agent_prefix}>
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
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningAgent('');
                  setAssigningPhoneNumber('');
                  setError(null);
                  setSuccess(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPhoneNumber}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                disabled={assigning || !assigningAgent.trim() || !assigningPhoneNumber.trim()}
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin mx-auto mr-2" /> : null}
                Add Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassign/Assign Modal */}
      {showUnassignModal && selectedPhoneForUnassign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUnassignModal(false)}>
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {selectedPhoneForUnassign.agent_id && selectedPhoneForUnassign.agent_id !== 'unassigned' && selectedPhoneForUnassign.agent_id !== null ? 'Delete Agent' : 'Add Agent'}
            </h3>

            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedPhoneForUnassign.agent_id && selectedPhoneForUnassign.agent_id !== 'unassigned' && selectedPhoneForUnassign.agent_id !== null
                ? `Current agent: ${selectedPhoneForUnassign.agent_name || selectedPhoneForUnassign.agent_id}. Select a new agent or choose "None" to delete.`
                : 'This phone number is currently unassigned. Select an agent to add it to.'
              }
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Phone Number
                  </label>
                </div>
                <div className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-900 border border-gray-200'}`}>
                  {formatPhoneNumber(selectedPhoneForUnassign.phone_number)}
                </div>
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <User className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    Agent
                  </label>
                </div>
                <select
                  value={unassigningAgent}
                  onChange={(e) => setUnassigningAgent(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-green-600 bg-gray-700 text-gray-200' : 'border-green-200 bg-white text-gray-900'}`}
                  disabled={loadingAgents}
                >
                  <option value="None">None (Delete Agent)</option>
                  {agents.map((agent, index) => (
                    <option key={agent.id || agent.name || agent.agent_prefix || `agent_${index}`} value={agent.name || agent.agent_prefix}>
                      {agent.name || agent.agent_prefix}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowUnassignModal(false);
                  setSelectedPhoneForUnassign(null);
                  setUnassigningAgent('');
                  setError(null);
                  setSuccess(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                disabled={unassigning}
              >
                Cancel
              </button>
              <button
                onClick={handleUnassignPhoneNumber}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                disabled={unassigning}
              >
                {unassigning ? <Loader2 className="h-4 w-4 animate-spin mx-auto mr-2" /> : null}
                {selectedPhoneForUnassign.agent_id && selectedPhoneForUnassign.agent_id !== 'unassigned' && selectedPhoneForUnassign.agent_id !== null
                  ? (unassigningAgent === 'None' ? 'Delete Agent' : 'Update Assignment')
                  : 'Add Agent'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
