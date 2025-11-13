'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Phone, RefreshCw, Search, Users, Bot, Edit, CheckCircle, XCircle, PhoneCall, MessageSquare, User, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getAgentDisplayName } from '../../lib/utils/agentNameUtils';
import { useAuthInfo } from '@propelauth/react';
import { SMSService } from '../../service/smsService';
import { getAgentsByOrganization, getPhoneNumbersByOrganization, getAvailablePhoneNumbersFromBackend } from '../../service/phoneNumberService';
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

interface SMSAssignment {
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

interface InboundSMSNumbersProps {
    refreshTrigger?: number;
}

export default function InboundSMSNumbers({ refreshTrigger }: InboundSMSNumbersProps) {
    const { isDarkMode } = useTheme();
    const { user, userClass } = useAuthInfo();
    const getOrganizationId = useOrganizationId();

    // State management
    const [assignments, setAssignments] = useState<SMSAssignment[]>([]);
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
    const [organizationName, setOrganizationName] = useState<string>('');
    const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState<PhoneNumber[]>([]);

    const loadPhoneNumbers = useCallback(async () => {
        setLoadingOrgPhoneNumbers(true);
        try {
            const orgId = getOrganizationId();
            if (!orgId) {
                setOrganizationPhoneNumbers([]);
                return;
            }
            const response = await getPhoneNumbersByOrganization(orgId);
            if (response.success && response.data) {
                const phoneNumbersData = response.data;
                // Check if we have phone_numbers array in the response
                if (phoneNumbersData.phone_numbers && Array.isArray(phoneNumbersData.phone_numbers) && phoneNumbersData.phone_numbers.length > 0) {
                    setOrganizationPhoneNumbers(phoneNumbersData.phone_numbers);
                } else {
                    setOrganizationPhoneNumbers([]);
                }
            } else {
                setOrganizationPhoneNumbers([]);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setOrganizationPhoneNumbers([]);
        } finally {
            setLoadingOrgPhoneNumbers(false);
        }
    }, [getOrganizationId]);

    const loadAgentMappings = useCallback(async () => {
        try {
            const response = await SMSService.getReceivingNumberAgentMappings();
            if (response.success && response.data) {
                const mappingsData = response.data;
                if (mappingsData.receiving_number_mappings) {
                    // Store the mappings to use when converting phone numbers to assignments
                    setAgentMappings(mappingsData.receiving_number_mappings);
                } else {
                    setAgentMappings({});
                }

                // Store total mappings count for filtering logic
                const mappingsCount = mappingsData.total_mappings || 0;
                setTotalMappings(mappingsCount);
                setMappingsLoaded(true);
            } else {
                setAgentMappings({});
                setTotalMappings(0);
                setMappingsLoaded(true);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
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
            const response: ApiResponse<{ agents: Record<string, unknown> }> = await getAgentsByOrganization(orgId);
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
                    setAgents(agentList);
                } else {
                    setAgents([]);
                }
            } else {
                setAgents([]);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setAgents([]);
        } finally {
            setLoadingAgents(false);
        }
    }, [getOrganizationId]);

    const loadAvailablePhoneNumbers = useCallback(async () => {
        try {
const response = await getAvailablePhoneNumbersFromBackend();
            if (response.success && response.data) {
                let phoneNumbersArray: PhoneNumber[] = [];
                const raw = (response.data as any);
                const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.phone_numbers) ? raw.phone_numbers : []);
                phoneNumbersArray = (list as unknown[]).map((phone: unknown) => {
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
                    } as PhoneNumber;
                });
                setAvailablePhoneNumbers(phoneNumbersArray);
            } else {
                setAvailablePhoneNumbers([]);
            }
        } catch (err) {
            setAvailablePhoneNumbers([]);
        }
    }, []);

    // Get organization name from user context
    useEffect(() => {
        if (userClass) {
            const orgs = userClass.getOrgs?.() || [];
            if (orgs.length > 0) {
                const org = orgs[0] as any;
                const orgName = org.orgName || org.name || '';
                setOrganizationName(orgName);
            } else {
            }
        } else {
        }
    }, [userClass]);

    // Load data on component mount
    useEffect(() => {
        loadPhoneNumbers();
        loadAgents();
        loadAgentMappings();
        loadAvailablePhoneNumbers();
        // Deliberately use empty deps to keep array size constant and avoid re-renders
    }, []);

    // Reload data when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            loadPhoneNumbers();
            loadAgents();
            loadAgentMappings();
            loadAvailablePhoneNumbers();
        }
    }, [refreshTrigger]);

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

    // Convert organization and available phone numbers to assignments format
    useEffect(() => {
        const isAgentFromCurrentOrg = (candidate: string | null | undefined): boolean => {
            if (!candidate) return false;
            return agents.some(a => a.agent_prefix === candidate || a.name === candidate || a.agent_prefix === (candidate as string).trim());
        };

        const orgSmsAssignments: SMSAssignment[] = (organizationPhoneNumbers || [])
            .filter((orgPhone: any) => orgPhone.sms_enabled === true)
            .map((orgPhone: any, index: number) => {
                const phoneNumber = orgPhone.number || orgPhone.phone_number || '';
                const agentIdOrName = orgPhone.agent_id || orgPhone.agent_name || '';
                const isAssigned = !!(agentIdOrName && agentIdOrName !== 'unassigned' && agentIdOrName !== null && agentIdOrName !== '');
                const inCurrentOrg = isAssigned ? isAgentFromCurrentOrg(orgPhone.agent_prefix || orgPhone.agent_id || orgPhone.agent_name) : false;

                return {
                    id: orgPhone.phone_id || orgPhone._id || `phone_${index}`,
                    phone_number: phoneNumber,
                    friendly_name: getFriendlyName(phoneNumber),
                    agent_name: isAssigned ? (orgPhone.agent_name || agentIdOrName) : '',
                    agent_prefix: isAssigned ? (orgPhone.agent_prefix || agentIdOrName) : '',
                    assigned_at: isAssigned ? (orgPhone.assigned_at || orgPhone.updated_at || new Date().toISOString()) : '',
                    status: isAssigned ? 'assigned' as const : 'unassigned' as const,
                    voice_enabled: orgPhone.voice_enabled || false,
                    sms_enabled: orgPhone.sms_enabled || true,
                    whatsapp_enabled: orgPhone.whatsapp_enabled || false,
                    agent_id: isAssigned ? (orgPhone.agent_id || orgPhone.agent_prefix || orgPhone.agent_name) : null,
                    mapping_data: null,
                } as SMSAssignment & { is_agent_from_current_org?: boolean };
            })
            .map((a) => ({ ...a, is_agent_from_current_org: a.status === 'assigned' ? isAgentFromCurrentOrg(a.agent_id || a.agent_prefix || a.agent_name) : false }));

        const orgAssignedForCurrentOrg = orgSmsAssignments.filter(a => a.status === 'assigned' && (a as any).is_agent_from_current_org === true);

        const orgNumbersSet = new Set((organizationPhoneNumbers || []).map((orgPhone: any) => (orgPhone.number || orgPhone.phone_number)));

        const availableSmsAssignments: SMSAssignment[] = (availablePhoneNumbers || [])
            .filter((available: PhoneNumber) => available.sms_enabled === true)
            .filter((available: PhoneNumber) => {
                const phone = available.phone_number || '';
                return !orgNumbersSet.has(phone);
            })
            .map((available: PhoneNumber, index: number) => {
                const phone = available.phone_number || '';
                return {
                    id: available.phone_id || `available_${index}_${phone}`,
                    phone_number: phone,
                    friendly_name: getFriendlyName(phone),
                    agent_name: '',
                    agent_prefix: '',
                    assigned_at: '',
                    status: 'unassigned' as const,
                    voice_enabled: available.voice_enabled || false,
                    sms_enabled: available.sms_enabled || true,
                    whatsapp_enabled: available.whatsapp_enabled || false,
                    agent_id: null,
                    mapping_data: null
                };
            });

        const finalList = orgAssignedForCurrentOrg.length > 0 ? orgAssignedForCurrentOrg : availableSmsAssignments;
        setAssignments(finalList);
    }, [organizationPhoneNumbers, availablePhoneNumbers, agents]);

    // Assignment functions
    const handleAssignAgent = async () => {
        if (!selectedAgent || !selectedPhoneNumber) return;

        const agent = agents.find(a => a.agent_prefix === selectedAgent);
        if (!agent) return;

        setIsAssigning(true);
        try {
            // Find the phone number ID for the selected phone number
            const selectedPhoneDataOrg = organizationPhoneNumbers.find(
                phone => (phone.number || phone.phone_number) === selectedPhoneNumber
            );
            const selectedPhoneDataAvailable = availablePhoneNumbers.find(
                phone => (phone.phone_number) === selectedPhoneNumber
            );
            const phoneNumberId = selectedPhoneDataOrg?.phone_id || selectedPhoneDataOrg?._id || selectedPhoneDataAvailable?.phone_id || '';

            if (!phoneNumberId) {
                alert('Phone number ID not found. Please refresh and try again.');
                return;
            }

            // Use the new assignment function with agent name
            const result = await SMSService.assignPhoneNumberToAgent(
                phoneNumberId,
                agent.name || agent.agent_prefix
            );

            if (result.success) {
                // Refresh agent mappings to get updated data
                await loadAgentMappings();
                // Reload phone numbers to reflect assignment changes
                await loadPhoneNumbers();
                await loadAvailablePhoneNumbers();

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
            } else {
                alert(`Failed to assign agent: ${result.message}`);
            }
        } catch (error) {
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
            // Find the phone number ID for the assignment
            const selectedPhoneData = organizationPhoneNumbers.find(
                phone => (phone.number || phone.phone_number) === assignment.phone_number
            );
            const phoneNumberId = selectedPhoneData?.phone_id || selectedPhoneData?._id || '';

            if (!phoneNumberId) {
                alert('Phone number ID not found. Please refresh and try again.');
                return;
            }

            // Use the new unassign function with agent name
            const result = await SMSService.unassignPhoneNumberFromAgent(
                phoneNumberId,
                assignment.agent_name || assignment.agent_prefix
            );

            if (result.success) {
                // Reload agent mappings to get updated data
                await loadAgentMappings();
                // Reload phone numbers to reflect unassignment
                await loadPhoneNumbers();
                await loadAvailablePhoneNumbers();

                // Update local state
                const updatedAssignments = assignments.map(assignment => {
                    if (assignment.id === assignmentId) {
                        return {
                            ...assignment,
                            agent_name: '',
                            agent_prefix: '',
                            assigned_at: '',
                            status: 'unassigned' as const,
                            mapping_data: null
                        };
                    }
                    return assignment;
                });
                setAssignments(updatedAssignments);
            } else {
                alert(`Failed to unassign agent: ${result.message}`);
            }
        } catch (error) {
            alert(`Error unassigning agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUnassigning(null);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setAgentSearchTerm('');
    };

    // Filter assignments based on search terms and agent assignment status
    const filteredAssignments = assignments.filter(assignment => {
        const matchesSearch = assignment.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.friendly_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAgent = assignment.agent_name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
            assignment.agent_prefix.toLowerCase().includes(agentSearchTerm.toLowerCase());

        // Show all SMS-enabled numbers (both assigned and unassigned)
        // This matches the InboundPhoneNumbers behavior
        const matchesAssignmentFilter = true;
        return matchesSearch && matchesAgent && matchesAssignmentFilter;
    });
// Check if any agents are assigned in the filtered assignments
    const hasAssignedAgents = filteredAssignments.some(assignment =>
        assignment.status === 'assigned' &&
        assignment.agent_id &&
        assignment.agent_id !== 'unassigned' &&
        assignment.agent_id !== null
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header with Search, Filters and Assign Agent Button */}
            <div className="p-4 border-b border-gray-200/50 space-y-4">
                {/* Top Row: Search and Assign Button */}
                <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-orange-400' : 'text-gray-400 group-focus-within:text-orange-500'}`} />
                            <input
                                type="text"
                                placeholder="Search phone numbers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search phone numbers"
                                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 backdrop-blur-sm transition-all duration-300 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Refresh Button (replaces organization name) */}
                        <button
                            onClick={() => {
                                loadPhoneNumbers();
                                loadAgents();
                                loadAgentMappings();
                                loadAvailablePhoneNumbers();
                            }}
                            className="group relative px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span className="text-sm font-semibold">Refresh</span>
                        </button>
                        {/* Assign Agent Button */}
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="group relative px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
                                className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all w-64 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 hover:bg-gray-600' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 hover:bg-gray-50'}`}
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
                            <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
                            <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Loading SMS data...
                            </span>
                        </div>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="text-center py-12">
                        <Phone className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No SMS numbers found
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {searchTerm ? 'Try adjusting your search' : 'No SMS-enabled phone numbers available'}
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
                                    {assignments.some(a => a.status === 'assigned' && a.agent_id && a.agent_id !== 'unassigned' && a.agent_id !== null) && (
                                        <th className="text-left py-4 px-6 font-semibold text-sm">
                                            Unassign
                                        </th>
                                    )}
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
                                                <Phone className={`h-4 w-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
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
                                                    {assignment.status === 'assigned'
                                                        ? getAgentDisplayName({ name: assignment.agent_name, id: assignment.agent_id }) || 'SMS Agent'
                                                        : 'Unassigned'
                                                    }
                                                </span>
                                                {assignment.status === 'assigned' ? (
                                                    <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                                                ) : (
                                                    <XCircle className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                )}
                                            </div>
                                        </td>

                                        {/* Unassign Column */}
                                        {assignments.some(a => a.status === 'assigned' && a.agent_id && a.agent_id !== 'unassigned' && a.agent_id !== null) && (
                                            <td className="py-4 px-6">
                                                {assignment.status === 'assigned' && (
                                                    <button
                                                        onClick={() => handleUnassignAgent(assignment.id)}
                                                        disabled={isUnassigning === assignment.id}
                                                        className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                                                            ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                                                            : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                                                            }`}
                                                        title="Unassign agent"
                                                    >
                                                        {isUnassigning === assignment.id ? (
                                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3 w-3" />
                                                        )}
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

            {/* Assign Agent Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-orange-500/10 rounded-lg">
                                    <Users className="h-6 w-6 text-orange-500" />
                                </div>
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Assign Agent
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {/* Agent Selection */}
                                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bot className={`h-4 w-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
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
                                        {(() => {
                                            const orgNumbersSet = new Set((organizationPhoneNumbers || []).map((p: any) => (p.number || p.phone_number)));
                                            const unassignedOrg = (organizationPhoneNumbers || [])
                                                .filter((phone: any) => {
                                                    const phoneNumber = phone.number || phone.phone_number || '';
                                                    const cleanNumber = phoneNumber.replace(/\D/g, '');
                                                    const mapping = agentMappings[cleanNumber] || agentMappings[phoneNumber];
                                                    return !mapping; // Only show unassigned org numbers
                                                });
                                            const availableExtras = (availablePhoneNumbers || [])
                                                .filter(p => p.sms_enabled === true)
                                                .filter(p => !orgNumbersSet.has(p.phone_number));
                                            const combined = [...unassignedOrg, ...availableExtras];
                                            return combined.map((phone: any, index: number) => {
                                                const value = phone.number || phone.phone_number || '';
                                                return (
                                                    <option key={phone.phone_id || phone._id || `phone_${index}`} value={value}>
                                                        {value}
                                                    </option>
                                                );
                                            });
                                        })()}
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
                                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
