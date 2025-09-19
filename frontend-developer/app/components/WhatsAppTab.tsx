'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Activity, Phone, RefreshCw, Search, Users, Bot, Check, Edit } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthInfo } from '@propelauth/react';
import { WhatsAppService } from '../../service/whatsappService';
import { getAgentsByOrganization } from '../../service/phoneNumberService';
import { useOrganizationId } from './utils/phoneNumberUtils';
import {
  PhoneNumber,
  ApiResponse
} from './types/phoneNumbers';


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

// Backend-aligned interfaces
interface Agent {
  agent_prefix: string;
  name: string;
  organization_id: string;
  api_key?: string;
}

interface WhatsAppAssignment {
  id: string;
  phone_number: string;
  friendly_name: string;
  agent_name: string;
  agent_prefix: string;
  assigned_at: string;
  status: 'assigned' | 'unassigned';
}

interface WhatsAppConversation {
  conversation_id: string;
  user_phone: string;
  last_message: string;
  ai_agent: string;
  status: 'active' | 'pending' | 'resolved';
  last_activity: string;
  message_count: number;
  agent_url: string;
  api_key: string;
}

interface WhatsAppMessage {
  type: 'user' | 'ai';
  message: string;
  timestamp: string;
  conversation_id: string;
}

interface WhatsAppConfig {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  phone_number: string;
  provider: string;
  webhook_url: string;
  agent_url: string;
  api_key: string;
  description?: string;
}

// Sample data matching backend structure
const sampleWhatsAppConfigs: WhatsAppConfig[] = [
  {
    id: '1',
    name: 'Customer Support WhatsApp',
    status: 'active',
    phone_number: 'whatsapp:+15558207167',
    provider: 'Twilio WhatsApp Business API',
    webhook_url: '/whatsapp/webhook',
    agent_url: process.env.NEXT_PUBLIC_CHATBOT_API_URL || '',
    api_key: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '',
    description: '24/7 customer support via WhatsApp'
  }
];

const sampleConversations: WhatsAppConversation[] = [
  {
    conversation_id: 'conv_abc123',
    user_phone: '+1234567890',
    last_message: 'Hello, how can you help me?',
    ai_agent: 'Riley',
    status: 'active',
    last_activity: '2024-01-15T10:30:00',
    message_count: 5,
    agent_url: process.env.NEXT_PUBLIC_CHATBOT_API_URL || '',
    api_key: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || ''
  },
  {
    conversation_id: 'conv_def456',
    user_phone: '+1987654321',
    last_message: 'I need help with my appointment',
    ai_agent: 'Elliot',
    status: 'pending',
    last_activity: '2024-01-15T09:15:00',
    message_count: 3,
    agent_url: process.env.NEXT_PUBLIC_CHATBOT_API_URL || '',
    api_key: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || ''
  }
];

const sampleMessages: WhatsAppMessage[] = [
  {
    type: 'user',
    message: 'Hello, how can you help me?',
    timestamp: '2024-01-15T10:30:00',
    conversation_id: 'conv_abc123'
  },
  {
    type: 'ai',
    message: 'Hi! I\'m here to help you with any questions or assistance you need. What can I do for you today?',
    timestamp: '2024-01-15T10:30:05',
    conversation_id: 'conv_abc123'
  }
];

interface WhatsAppTabProps { }

export default function WhatsAppTab({ }: WhatsAppTabProps) {
  const { isDarkMode } = useTheme();
  const { user, userClass } = useAuthInfo();
  const getOrganizationId = useOrganizationId();

  // State management
  const [assignments, setAssignments] = useState<WhatsAppAssignment[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [organizationPhoneNumbers, setOrganizationPhoneNumbers] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingOrgPhoneNumbers, setLoadingOrgPhoneNumbers] = useState(false);

  const loadPhoneNumbers = useCallback(async () => {
    setLoadingOrgPhoneNumbers(true);
    try {
      console.log('🚀 Loading WhatsApp-enabled phone numbers...');
      const response = await WhatsAppService.getWhatsAppEnabledPhoneNumbers();
      console.log('🚀 API response received:', response);

      if (response.success && response.data) {
        const phoneNumbersData = response.data;
        console.log('✅ Phone numbers data:', phoneNumbersData);

        // Check if we have phone_numbers array in the response
        if (phoneNumbersData.phone_numbers && Array.isArray(phoneNumbersData.phone_numbers) && phoneNumbersData.phone_numbers.length > 0) {
          console.log('✅ Found phone_numbers array:', phoneNumbersData.phone_numbers);
          setOrganizationPhoneNumbers(phoneNumbersData.phone_numbers);
        } else {
          console.log('❌ No phone numbers found in response');
          setOrganizationPhoneNumbers([]);
        }
      } else {
        console.log('❌ API response failed:', response);
        setOrganizationPhoneNumbers([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error loading WhatsApp-enabled phone numbers:', errorMessage);
      setOrganizationPhoneNumbers([]);
    } finally {
      setLoadingOrgPhoneNumbers(false);
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

      console.log('🚀 Loading agents for org:', orgId);
      const response: ApiResponse<{ agents: Record<string, unknown> }> = await getAgentsByOrganization(orgId);
      console.log('🚀 Agents API response:', response);

      if (response.success && response.data) {
        const agentsData = response.data;

        // Extract agent_prefix from the agents object
        if (agentsData.agents && typeof agentsData.agents === 'object') {
          const agentList: Agent[] = Object.keys(agentsData.agents).map(agentPrefix => {
            const agentData = agentsData.agents[agentPrefix] as Record<string, unknown>;
            return {
              agent_prefix: agentPrefix,
              name: agentPrefix,
              organization_id: orgId,
              api_key: (agentData.chatbot_key || agentData.api_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '') as string,
              ...agentData
            };
          });

          console.log('✅ Agents loaded:', agentList);
          setAgents(agentList);
        } else {
          console.log('❌ No agents found in response');
          setAgents([]);
        }
      } else {
        console.log('❌ Agents API response failed:', response);
        setAgents([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error loading agents:', errorMessage);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, [getOrganizationId]);

  // Load data on component mount
  useEffect(() => {
    console.log('🔍 useEffect triggered, loading phone numbers and agents');
    loadPhoneNumbers();
    loadAgents();
  }, [loadPhoneNumbers, loadAgents]);

  // Convert organization phone numbers to assignments format
  useEffect(() => {
    if (organizationPhoneNumbers.length > 0) {
      console.log('🔄 Converting phone numbers to assignments:', organizationPhoneNumbers);
      const whatsappAssignments: WhatsAppAssignment[] = organizationPhoneNumbers.map((orgPhone: any, index: number) => ({
        id: orgPhone.phone_id || orgPhone._id || `phone_${index}`,
        phone_number: orgPhone.number || orgPhone.phone_number || '',
        friendly_name: orgPhone.number || orgPhone.phone_number || '',
        agent_name: orgPhone.agent_name || '',
        agent_prefix: '',
        assigned_at: orgPhone.updated_at || '',
        status: (orgPhone.agent_id && orgPhone.agent_id !== 'unassigned' && orgPhone.agent_id !== '' && orgPhone.agent_id !== null) ? 'assigned' as const : 'unassigned' as const
      }));

      console.log('✅ WhatsApp assignments created:', whatsappAssignments);
      setAssignments(whatsappAssignments);
    } else {
      console.log('❌ No phone numbers to convert to assignments');
      setAssignments([]);
    }
  }, [organizationPhoneNumbers]);

  // Assignment functions
  const handleAssignAgent = async () => {
    if (!selectedAgent || !selectedPhoneNumber) return;

    const agent = agents.find(a => a.agent_prefix === selectedAgent);
    if (!agent) return;

    setIsAssigning(true);
    try {
      console.log('🚀 Assigning agent:', { agent, phoneNumber: selectedPhoneNumber });

      const agentApiKey = agent.api_key;
      const phoneNumberId = organizationPhoneNumbers.find(phone =>
        (phone.number || phone.phone_number) === selectedPhoneNumber
      )?.phone_id || selectedPhoneNumber;

      const result = await WhatsAppService.mapReceivingNumberAgent(
        selectedPhoneNumber,
        agentApiKey,
        phoneNumberId
      );

      if (result.success) {
        // Update local state
        const updatedAssignments = assignments.map(assignment => {
          if (assignment.phone_number === selectedPhoneNumber) {
            return {
              ...assignment,
              agent_name: agent.name,
              agent_prefix: agent.agent_prefix,
              assigned_at: new Date().toISOString(),
              status: 'assigned' as const
            };
          }
          return assignment;
        });

        setAssignments(updatedAssignments);
        setShowAssignModal(false);
        setSelectedAgent('');
        setSelectedPhoneNumber('');

        console.log('✅ Agent assigned successfully:', result);
      } else {
        console.error('❌ Failed to assign agent:', result.message);
        alert(`Failed to assign agent: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error assigning agent:', error);
      alert(`Error assigning agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignAgent = async (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    setIsUnassigning(assignmentId);
    try {
      console.log('🚀 Unassigning WhatsApp agent for phone number:', assignment.phone_number);

      const result = await WhatsAppService.unassignReceivingNumberAgent(assignment.phone_number);

      if (result.success) {
        // Update local state
        const updatedAssignments = assignments.map(assignment => {
          if (assignment.id === assignmentId) {
            return {
              ...assignment,
              agent_name: '',
              agent_prefix: '',
              assigned_at: '',
              status: 'unassigned' as const
            };
          }
          return assignment;
        });
        setAssignments(updatedAssignments);

        console.log('✅ WhatsApp agent unassigned successfully:', result);
      } else {
        console.error('❌ Failed to unassign WhatsApp agent:', result.message);
        alert(`Failed to unassign agent: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error unassigning WhatsApp agent:', error);
      alert(`Error unassigning agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUnassigning(null);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setAgentSearchTerm('');
  };

  // Filter assignments based on search terms
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.friendly_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = assignment.agent_name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
      assignment.agent_prefix.toLowerCase().includes(agentSearchTerm.toLowerCase());
    return matchesSearch && matchesAgent;
  });

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
      <div className={`rounded-xl sm:rounded-2xl border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 lg:p-8 border-b rounded-t-xl sm:rounded-t-2xl ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' : 'border-gray-200/50 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg sm:rounded-xl">
                  <WhatsAppIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  WhatsApp Configuration
                </h2>
              </div>
              <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your WhatsApp messaging services</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gray-500 text-white rounded-lg sm:rounded-xl hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-sm sm:text-base font-semibold">Xpectrum</span>
              </button>
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadPhoneNumbers();
                  loadAgents();
                }}
                className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
              >
                <RefreshCw className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span className="text-sm sm:text-base font-semibold">Refresh</span>
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <Plus className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span className="text-sm sm:text-base font-semibold">+ Assign Agent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`p-4 sm:p-6 lg:p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          {loadingOrgPhoneNumbers || loadingAgents ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Loading WhatsApp data...
                </span>
              </div>
            </div>
          ) : (
            <div>

              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Search phone numbers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Users className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <input
                        type="text"
                        placeholder="Enter agent name or prefix..."
                        value={agentSearchTerm}
                        onChange={(e) => setAgentSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className={`px-4 py-3 border rounded-lg hover:bg-opacity-10 transition-colors ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              {/* Assignments Table */}
              <div className={`rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Number
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Friendly Name
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Agent
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Unassign
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {filteredAssignments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Phone className={`h-8 w-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {assignments.length === 0 ? 'No phone numbers found' : 'No phone numbers match your search'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredAssignments.map((assignment) => (
                          <tr key={assignment.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Phone className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {assignment.phone_number}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {assignment.friendly_name}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {assignment.status === 'assigned' ? (
                                <div className="flex items-center">
                                  <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    {assignment.agent_name}
                                  </span>
                                  <Check className="h-4 w-4 ml-2 text-green-500" />
                                </div>
                              ) : (
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {assignment.status === 'assigned' && (
                                <button
                                  onClick={() => handleUnassignAgent(assignment.id)}
                                  disabled={isUnassigning === assignment.id}
                                  className={`p-2 rounded-lg hover:bg-opacity-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'text-gray-400 hover:bg-red-600 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
                                >
                                  {isUnassigning === assignment.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Edit className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assign Agent Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Assign Agent
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Agent Selection */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <label className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        Agent
                      </label>
                    </div>
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="">Select an agent</option>
                      {agents.map((agent) => (
                        <option key={agent.agent_prefix} value={agent.agent_prefix}>
                          {agent.name} ({agent.agent_prefix})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Number Selection */}
                  <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <label className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                        Phone Number
                      </label>
                    </div>
                    <select
                      value={selectedPhoneNumber}
                      onChange={(e) => setSelectedPhoneNumber(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="">Select a phone number</option>
                      {organizationPhoneNumbers
                        .filter(phone => !phone.agent_id || phone.agent_id === 'unassigned' || phone.agent_id === '' || phone.agent_id === null)
                        .map((phone, index) => (
                          <option key={phone.phone_id || phone._id || `phone_${index}`} value={phone.number || phone.phone_number}>
                            {phone.number || phone.phone_number}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedAgent('');
                      setSelectedPhoneNumber('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignAgent}
                    disabled={!selectedAgent || !selectedPhoneNumber || isAssigning}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isAssigning ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Agent'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
