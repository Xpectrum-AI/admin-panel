'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Phone, RefreshCw, Search, Users, Bot, Edit, CheckCircle, XCircle, PhoneCall, MessageSquare, User, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { WhatsAppService } from '../../service/whatsappService';
import { getAgentsByOrganization, getPhoneNumbersByOrganization, getAvailablePhoneNumbersFromBackend, unassignPhoneNumberFromAgent } from '../../service/phoneNumberService';
import { useOrganizationId } from './utils/phoneNumberUtils';
import { getAgentDisplayName } from '../../lib/utils/agentNameUtils';
import { ApiResponse, OrganizationData, PhoneNumber } from './types/phoneNumbers';

// Custom WhatsApp icon component (same as InboundPhoneNumbers)
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
    </svg>
);

interface WhatsAppPhoneNumber {
    _id: string;
    phone_id: string;
    number: string;
    status: 'assigned' | 'unassigned' | 'available';
    agent_id?: string | null;
    environment: string;
    voice_enabled: boolean;
    sms_enabled: boolean;
    whatsapp_enabled: boolean;
    inbound_enabled: boolean;
    outbound_enabled: boolean;
    created_at: string;
    updated_at: string;
    // Computed fields for display
    friendly_name?: string;
    agent_name?: string;
    is_agent_from_current_org?: boolean;
    is_assigned?: boolean;
}


interface InboundWhatsappNumbersProps {
    refreshTrigger?: number;
}

export default function InboundWhatsappNumbers({ refreshTrigger }: InboundWhatsappNumbersProps) {
    const { isDarkMode } = useTheme();
    const getOrganizationId = useOrganizationId();

    // State management
    const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppPhoneNumber[]>([]);
    const [organizationPhoneNumbers, setOrganizationPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState<PhoneNumber[]>([]);
    const [agents, setAgents] = useState<string[]>([]); // Simple list of agent names
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingOrgPhoneNumbers, setLoadingOrgPhoneNumbers] = useState(false);
    const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(false);
    const [loadingAgents, setLoadingAgents] = useState(false);

    // Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string>('');
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Unassign state
    const [unassigningPhoneId, setUnassigningPhoneId] = useState<string | null>(null);
    const [unassigningAgentId, setUnassigningAgentId] = useState<string | null>(null);
    const [isUnassigning, setIsUnassigning] = useState(false);

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

    // Load organization phone numbers (assigned numbers)
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
                    // Try alternative data extraction methods (same as inbound phone numbers)
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
            setOrganizationPhoneNumbers([]);
        } finally {
            setLoadingOrgPhoneNumbers(false);
        }
    }, [getOrganizationId]);

    // Load available phone numbers (unassigned numbers)
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
                setAvailablePhoneNumbers(phoneNumbersArray);
            } else {
                setAvailablePhoneNumbers([]);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setAvailablePhoneNumbers([]);
        } finally {
            setLoadingPhoneNumbers(false);
        }
    }, []);

    // Load agents for the organization
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

                // Extract agent names from the agents object
                if (agentsData.agents && typeof agentsData.agents === 'object') {
                    const agentNames = Object.keys(agentsData.agents);
                    setAgents(agentNames);
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

    // Process and combine phone numbers - show ALL WhatsApp-enabled numbers (assigned + unassigned)
    const allPhoneNumbers: PhoneNumber[] = [
        // First, add all organization phone numbers (assigned)
        ...organizationPhoneNumbers.map(orgPhone => ({
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
        })),
        // Then, add available phone numbers that are NOT already assigned
        ...availablePhoneNumbers
            .filter(availablePhone =>
                // Filter out phone numbers that are already assigned in organization
                !organizationPhoneNumbers.some(orgPhone =>
                    (orgPhone.number || orgPhone.phone_number) === availablePhone.phone_number
                )
            )
            .map(availablePhone => ({
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
            }))
    ];

    // Filter for WhatsApp-enabled numbers and process them
    const whatsappNumbers = allPhoneNumbers.filter((phone: any) => {
        const isWhatsappEnabled = phone.whatsapp_enabled === true || phone.whatsapp_enabled === 'true' || phone.whatsapp_enabled === 1;
        return isWhatsappEnabled;
    });
    // Process WhatsApp numbers for display
    const processedNumbers = whatsappNumbers.map((phone: any) => {
        const agentId = phone.agent_id;
        // More robust assignment detection
        const isAssigned = agentId &&
            agentId !== 'unassigned' &&
            agentId !== null &&
            agentId !== '' &&
            (phone.status === 'assigned' || phone.status === 'active' || phone.agent_id);

        // Check if the assigned agent exists in current organization's agents
        const isAgentFromCurrentOrg = isAssigned && agents.includes(agentId);

        // For agents not in current org, try to extract the base agent name
        let agentDisplayName = agentId;
        if (isAssigned && !isAgentFromCurrentOrg) {
            // Try to extract base agent name (before any suffixes)
            const baseAgentName = agentId.split('_')[0];
            agentDisplayName = baseAgentName;
        }

        return {
            _id: phone._id || phone.phone_id || `phone_${Date.now()}`,
            phone_id: phone.phone_id || phone._id || '',
            number: phone.phone_number || '',
            status: phone.status || (isAssigned ? 'assigned' : 'unassigned'),
            agent_id: agentId || null,
            environment: phone.environment || 'production',
            voice_enabled: phone.voice_enabled || false,
            sms_enabled: phone.sms_enabled || false,
            whatsapp_enabled: phone.whatsapp_enabled || true,
            inbound_enabled: phone.inbound_enabled || false,
            outbound_enabled: phone.outbound_enabled || false,
            created_at: phone.created_at || new Date().toISOString(),
            updated_at: phone.updated_at || new Date().toISOString(),
            friendly_name: getFriendlyName(phone.phone_number || ''),
            agent_name: isAssigned ? agentDisplayName : '',
            is_agent_from_current_org: isAgentFromCurrentOrg,
            is_assigned: isAssigned
        };
    });


    // Update phone numbers when data changes
    useEffect(() => {
        setPhoneNumbers(processedNumbers);
    }, [organizationPhoneNumbers, availablePhoneNumbers, agents]);

    // Load data on component mount
    useEffect(() => {
        loadOrganizationPhoneNumbers();
        loadAgents();
        loadAvailablePhoneNumbers(); // Always load available numbers
    }, [loadOrganizationPhoneNumbers, loadAgents]);

    // Reload data when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            loadOrganizationPhoneNumbers();
            loadAvailablePhoneNumbers();
        }
    }, [refreshTrigger, loadOrganizationPhoneNumbers]);

    const handleClearFilters = () => {
        setSearchTerm('');
    };

    // Refresh data function
    const refreshData = async () => {
        try {
            await Promise.all([
                loadOrganizationPhoneNumbers(),
                loadAvailablePhoneNumbers()
            ]);
        } catch (error) {
        }
    };

    const handleAssignAgent = async () => {
        if (!selectedAgent || !selectedPhoneNumber) return;

        setIsAssigning(true);
        try {
            // Find the phone number data
            const phoneData = phoneNumbers.find(phone => phone.number === selectedPhoneNumber);
            if (!phoneData) {
                alert('Phone number not found. Please refresh and try again.');
                return;
            }

            // Use the WhatsApp service to assign the agent
            const result = await WhatsAppService.assignPhoneNumberToAgent(
                phoneData.phone_id,
                selectedAgent
            );

            if (result.success) {
                // Refresh data after successful assignment
                await refreshData();

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

    const handleUnassignAgent = async (phoneId: string, agentId: string) => {
        if (!phoneId || !agentId) return;

        setIsUnassigning(true);
        setUnassigningPhoneId(phoneId);
        setUnassigningAgentId(agentId);

        try {
            const result = await unassignPhoneNumberFromAgent(phoneId, agentId);

            if (result.success) {
                // Refresh data after successful unassignment
                await refreshData();
            } else {
                alert(`Failed to unassign agent: ${result.message}`);
            }
        } catch (error) {
            alert(`Error unassigning agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUnassigning(false);
            setUnassigningPhoneId(null);
            setUnassigningAgentId(null);
        }
    };

    // Filter phone numbers based on search terms
    const filteredPhoneNumbers = phoneNumbers.filter(phone => {
        const matchesSearch = phone.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (phone.friendly_name && phone.friendly_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });



    return (
        <div className="flex flex-col h-full">
            {/* Header with Search, Filters and Assign Agent Button */}
            <div className="p-4 border-b border-gray-200/50 space-y-4">
                {/* Top Row: Search and Action Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">


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
                        <button
                            onClick={handleClearFilters}
                            className={`px-4 py-2 border rounded-lg transition-all duration-300 hover:scale-105 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 hover:bg-gray-700/80' : 'border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Clear Filters
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Refresh Button */}
                        <button
                            onClick={refreshData}
                            className="group relative px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span className="text-sm font-semibold">Refresh</span>
                        </button>

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

            </div>


            {/* Table Container */}
            <div className="flex-1 overflow-hidden">
                {(loadingOrgPhoneNumbers || loadingPhoneNumbers || loadingAgents) ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="h-6 w-6 animate-spin text-green-500" />
                            <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {loadingOrgPhoneNumbers ? 'Loading organization phone numbers...' :
                                    loadingPhoneNumbers ? 'Loading available phone numbers...' :
                                        loadingAgents ? 'Loading agents...' : 'Loading...'}
                            </span>
                        </div>
                    </div>
                ) : filteredPhoneNumbers.length === 0 ? (
                    <div className="text-center py-12">
                        <WhatsAppIcon className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No WhatsApp-enabled phone numbers found
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {searchTerm ? 'Try adjusting your search' :
                                organizationPhoneNumbers.length === 0 ?
                                    'No WhatsApp-enabled phone numbers found. Check if there are available phone numbers to assign.' :
                                    'No WhatsApp-enabled phone numbers found for this organization'}
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
                                {filteredPhoneNumbers.map((phone, index) => (
                                    <tr
                                        key={phone._id}
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
                                                        {phone.number}
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
                                                {phone.friendly_name}
                                            </span>
                                        </td>

                                        {/* Enabled Column */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                {/* Voice */}
                                                <div className="flex items-center gap-1">
                                                    <PhoneCall
                                                        className={`h-4 w-4 ${phone.voice_enabled
                                                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                            }`}
                                                    />
                                                    <span className={`text-xs font-medium ${phone.voice_enabled
                                                        ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                                        : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                        }`}>
                                                        Voice
                                                    </span>
                                                </div>

                                                {/* SMS */}
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare
                                                        className={`h-4 w-4 ${phone.sms_enabled
                                                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                            }`}
                                                    />
                                                    <span className={`text-xs font-medium ${phone.sms_enabled
                                                        ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                                                        : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                        }`}>
                                                        SMS
                                                    </span>
                                                </div>

                                                {/* WhatsApp */}
                                                <div className="flex items-center gap-1">
                                                    <WhatsAppIcon
                                                        className={`h-4 w-4 ${phone.whatsapp_enabled
                                                            ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                                                            }`}
                                                    />
                                                    <span className={`text-xs font-medium ${phone.whatsapp_enabled
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
                                                    {phone.agent_id && phone.agent_id !== 'unassigned' && phone.agent_id !== null
                                                        ? getAgentDisplayName({ name: phone.agent_name, id: phone.agent_id })
                                                        : 'Unassigned'
                                                    }
                                                </span>
                                                {phone.is_assigned ? (
                                                    <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                                                ) : (
                                                    <XCircle className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                )}
                                            </div>
                                        </td>

                                        {/* Unassign Column (only show if there are organization phone numbers) */}
                                        {organizationPhoneNumbers.length > 0 && (
                                            <td className="py-4 px-6">
                                                {phone.is_assigned ? (
                                                    <button
                                                        onClick={() => {
                                                            if (phone.phone_id && phone.agent_id) {
                                                                handleUnassignAgent(phone.phone_id, phone.agent_id);
                                                            }
                                                        }}
                                                        disabled={isUnassigning && unassigningPhoneId === phone.phone_id}
                                                        className={`p-2 rounded-lg transition-colors ${isUnassigning && unassigningPhoneId === phone.phone_id
                                                            ? 'text-gray-400 cursor-not-allowed'
                                                            : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                            }`}
                                                        title="Unassign agent"
                                                    >
                                                        {isUnassigning && unassigningPhoneId === phone.phone_id ? (
                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        -
                                                    </span>
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
                                            <option key={agent} value={agent}>
                                                {agent}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Phone Number Selection */}
                                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Phone className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                                            WhatsApp Phone Number
                                        </label>
                                    </div>
                                    <select
                                        value={selectedPhoneNumber}
                                        onChange={(e) => setSelectedPhoneNumber(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="">Select a phone number</option>
                                        {phoneNumbers
                                            .filter(phone => phone.whatsapp_enabled && phone.status !== 'assigned')
                                            .map((phone) => (
                                                <option key={phone._id} value={phone.number}>
                                                    {phone.number} - {phone.friendly_name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedAgent('');
                                        setSelectedPhoneNumber('');
                                    }}
                                    className={`px-4 py-2 rounded-lg border transition-all duration-200 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignAgent}
                                    disabled={!selectedAgent || !selectedPhoneNumber || isAssigning}
                                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${!selectedAgent || !selectedPhoneNumber || isAssigning
                                        ? (isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {isAssigning ? (
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Assigning...
                                        </div>
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
