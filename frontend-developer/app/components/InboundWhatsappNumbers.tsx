'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Phone, RefreshCw, Search, Users, Bot, Edit, CheckCircle, XCircle, PhoneCall, MessageSquare, User, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthInfo } from '@propelauth/react';
import { WhatsAppService } from '../../service/whatsappService';
import { getAgentsByOrganization } from '../../service/phoneNumberService';
import { useOrganizationId } from './utils/phoneNumberUtils';
import {
    PhoneNumber,
    ApiResponse
} from './types/phoneNumbers';

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
    voice_enabled?: boolean;
    sms_enabled?: boolean;
    whatsapp_enabled?: boolean;
    agent_id?: string | null;
    mapping_data?: any;
}

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

interface InboundWhatsappNumbersProps {
    refreshTrigger?: number;
}

export default function InboundWhatsappNumbers({ refreshTrigger }: InboundWhatsappNumbersProps) {
    const { isDarkMode } = useTheme();
    const { user, userClass } = useAuthInfo();
    const getOrganizationId = useOrganizationId();

    // State management
    const [assignments, setAssignments] = useState<WhatsAppAssignment[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [organizationPhoneNumbers, setOrganizationPhoneNumbers] = useState<any[]>([]);
    const [agentMappings, setAgentMappings] = useState<Record<string, any>>({});
    const [totalMappings, setTotalMappings] = useState<number>(0);
    const [mappingsLoaded, setMappingsLoaded] = useState<boolean>(false);
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

    const loadAgentMappings = useCallback(async () => {
        try {
            console.log('🚀 Loading WhatsApp agent mappings...');
            const response = await WhatsAppService.getReceivingNumberAgentMappings();
            console.log('🚀 Agent mappings response:', response);

            if (response.success && response.data) {
                const mappingsData = response.data;
                console.log('✅ Agent mappings data:', mappingsData);

                if (mappingsData.receiving_number_mappings) {
                    console.log('✅ Found receiving number mappings:', mappingsData.receiving_number_mappings);
                    // Store the mappings to use when converting phone numbers to assignments
                    setAgentMappings(mappingsData.receiving_number_mappings);
                } else {
                    console.log('❌ No agent mappings found in response');
                    setAgentMappings({});
                }

                // Store total mappings count for filtering logic
                const mappingsCount = mappingsData.total_mappings || 0;
                console.log('✅ Total mappings count:', mappingsCount);
                setTotalMappings(mappingsCount);
                setMappingsLoaded(true);
            } else {
                console.log('❌ Agent mappings API response failed:', response);
                setAgentMappings({});
                setTotalMappings(0);
                setMappingsLoaded(true);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('❌ Error loading WhatsApp agent mappings:', errorMessage);
            setAgentMappings({});
            setTotalMappings(0);
            setMappingsLoaded(true);
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
        console.log('🔍 useEffect triggered, loading phone numbers, agents, and mappings');
        loadPhoneNumbers();
        loadAgents();
        loadAgentMappings();
    }, [loadPhoneNumbers, loadAgents, loadAgentMappings]);

    // Reload data when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            console.log('🔄 Refresh trigger activated, reloading data');
            loadPhoneNumbers();
            loadAgents();
            loadAgentMappings();
        }
    }, [refreshTrigger, loadPhoneNumbers, loadAgents, loadAgentMappings]);

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

    // Convert organization phone numbers to assignments format
    useEffect(() => {
        if (organizationPhoneNumbers.length > 0) {
            console.log('🔄 Converting phone numbers to assignments:', organizationPhoneNumbers);
            console.log('🔄 Using agent mappings:', agentMappings);

            const whatsappAssignments: WhatsAppAssignment[] = organizationPhoneNumbers.map((orgPhone: any, index: number) => {
                const phoneNumber = orgPhone.number || orgPhone.phone_number || '';
                const cleanNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits for comparison

                // Check if this phone number has an agent mapping
                const mapping = agentMappings[cleanNumber] || agentMappings[phoneNumber];
                const isAssigned = !!mapping;

                return {
                    id: orgPhone.phone_id || orgPhone._id || `phone_${index}`,
                    phone_number: phoneNumber,
                    friendly_name: getFriendlyName(phoneNumber),
                    agent_name: isAssigned ? 'WhatsApp Agent' : '',
                    agent_prefix: isAssigned ? 'whatsapp_agent' : '',
                    assigned_at: isAssigned ? (mapping.last_activity || new Date().toISOString()) : '',
                    status: isAssigned ? 'assigned' as const : 'unassigned' as const,
                    voice_enabled: orgPhone.voice_enabled || false,
                    sms_enabled: orgPhone.sms_enabled || false,
                    whatsapp_enabled: orgPhone.whatsapp_enabled || true, // WhatsApp numbers are WhatsApp enabled by default
                    agent_id: isAssigned ? 'whatsapp_agent' : null,
                    mapping_data: mapping || null
                };
            });

            console.log('✅ WhatsApp assignments created with mappings:', whatsappAssignments);
            setAssignments(whatsappAssignments);
        } else {
            console.log('❌ No phone numbers to convert to assignments');
            setAssignments([]);
        }
    }, [organizationPhoneNumbers, agentMappings]);

    // Assignment functions
    const handleAssignAgent = async () => {
        if (!selectedAgent || !selectedPhoneNumber) return;

        const agent = agents.find(a => a.agent_prefix === selectedAgent);
        if (!agent) return;

        setIsAssigning(true);
        try {
            console.log('🚀 Assigning agent:', { agent, phoneNumber: selectedPhoneNumber });

            const agentApiKey = agent.api_key;

            // Find the phone number ID for the selected phone number
            const selectedPhoneData = organizationPhoneNumbers.find(
                phone => (phone.number || phone.phone_number) === selectedPhoneNumber
            );
            const phoneNumberId = selectedPhoneData?.phone_id || selectedPhoneData?._id || '';

            // Call the actual WhatsApp service to assign the agent
            const result = await WhatsAppService.mapReceivingNumberAgent(
                selectedPhoneNumber,
                agentApiKey,
                phoneNumberId
            );

            if (result.success) {
                // Refresh data after successful assignment
                await loadPhoneNumbers();
                await loadAgentMappings();

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
            console.log('🚀 Unassigning agent for phone number:', assignment.phone_number);

            // Call the actual WhatsApp service to unassign the agent
            const result = await WhatsAppService.unassignReceivingNumberAgent(assignment.phone_number);

            if (result.success) {
                // Refresh data after successful unassignment
                await loadPhoneNumbers();
                await loadAgentMappings();

                console.log('✅ Agent unassigned successfully:', result);
            } else {
                console.error('❌ Failed to unassign agent:', result.message);
                alert(`Failed to unassign agent: ${result.message}`);
            }
        } catch (error) {
            console.error('❌ Error unassigning agent:', error);
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
        <div className="flex flex-col h-full">
            {/* Header with Search, Filters and Assign Agent Button */}
            <div className="p-4 border-b border-gray-200/50 space-y-4">
                {/* Top Row: Search and Assign Button */}
                <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-green-400' : 'text-gray-400 group-focus-within:text-green-500'}`} />
                            <input
                                type="text"
                                placeholder="Search phone numbers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search phone numbers"
                                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Assign Agent Button */}
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="group relative px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-semibold">Assign Agent</span>
                        </button>
                    </div>
                </div>

                {/* Filter Row */}
                <div className="space-y-3">
                    {/* Agent Filter and Clear Button Row */}
                    <div className="flex flex-wrap items-center gap-6">
                        {/* Agent Filter */}
                        <div className="flex items-center gap-3">
                            <Users className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                placeholder="Enter agent name or prefix..."
                                value={agentSearchTerm}
                                onChange={(e) => setAgentSearchTerm(e.target.value)}
                                className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all w-64 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 hover:bg-gray-600' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 hover:bg-gray-50'}`}
                            />
                        </div>

                        {/* Clear Filters Button */}
                        <button
                            onClick={handleClearFilters}
                            className={`px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-200 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-hidden">
                {loadingOrgPhoneNumbers || loadingAgents ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="h-6 w-6 animate-spin text-green-500" />
                            <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Loading WhatsApp data...
                            </span>
                        </div>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="text-center py-12">
                        <WhatsAppIcon className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No WhatsApp-enabled phone numbers found
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {searchTerm ? 'Try adjusting your search' : 'No WhatsApp-enabled phone numbers found for this organization'}
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
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.map((assignment, index) => (
                                    <tr
                                        key={assignment.id}
                                        className={`border-b transition-colors duration-200 ${isDarkMode
                                            ? 'border-gray-700 hover:bg-gray-800/50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            } ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-900/30' : 'bg-white') : (isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50')}`}
                                    >
                                        {/* Number Column */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Phone className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {assignment.phone_number}
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
                                                {assignment.friendly_name}
                                            </span>
                                        </td>

                                        {/* Enabled Column */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                {/* Voice */}
                                                <div className="flex items-center gap-1">
                                                    <PhoneCall
                                                        className={`h-4 w-4 ${assignment.voice_enabled
                                                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                            }`}
                                                    />
                                                    <span className={`text-xs font-medium ${assignment.voice_enabled
                                                        ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                                        : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                        }`}>
                                                        Voice
                                                    </span>
                                                </div>

                                                {/* SMS */}
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare
                                                        className={`h-4 w-4 ${assignment.sms_enabled
                                                            ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                                                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                            }`}
                                                    />
                                                    <span className={`text-xs font-medium ${assignment.sms_enabled
                                                        ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                                                        : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                        }`}>
                                                        SMS
                                                    </span>
                                                </div>

                                                {/* WhatsApp */}
                                                <div className="flex items-center gap-1">
                                                    <WhatsAppIcon
                                                        className={`h-4 w-4 ${assignment.whatsapp_enabled
                                                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                            }`}
                                                    />
                                                    <span className={`text-xs font-medium ${assignment.whatsapp_enabled
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
                                                    {assignment.agent_id && assignment.agent_id !== 'unassigned' && assignment.agent_id !== null
                                                        ? (assignment.agent_name || assignment.agent_id)
                                                        : 'Unassigned'
                                                    }
                                                </span>
                                                {assignment.status === 'assigned' ? (
                                                    <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                                                ) : (
                                                    <XCircle className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                )}
                                                {assignment.status === 'assigned' && (
                                                    <button
                                                        onClick={() => handleUnassignAgent(assignment.id)}
                                                        disabled={isUnassigning === assignment.id}
                                                        className={`p-1 rounded-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                                                            ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                                                            : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                                                            }`}
                                                        title="Unassign agent"
                                                    >
                                                        {isUnassigning === assignment.id ? (
                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assign Agent Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Users className="h-6 w-6 text-green-500" />
                                </div>
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Assign Agent
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {/* Agent Selection */}
                                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bot className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
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
                                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
    );
}
