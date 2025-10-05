'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Mail, RefreshCw, Search, Users, Bot, Edit, CheckCircle, XCircle, PhoneCall, MessageSquare, User, Settings, BarChart3, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthInfo } from '@propelauth/react';
import { GmailService, GmailAccount, GmailMessage, GmailAssignment, AgentMappingsResponse, AgentMapping } from '../../service/gmailService';
import { getAgentsByOrganization } from '../../service/phoneNumberService';
import { useOrganizationId } from './utils/phoneNumberUtils';

interface Agent {
    id?: string;
    name: string;
    chatbot_key?: string;
    agent_prefix: string;
    organization_id?: string;
    api_key?: string;
}

interface GmailAccountAssignment {
    id: string;
    email_address: string;
    friendly_name: string;
    agent_name: string;
    agent_prefix: string;
    assigned_at: string;
    status: 'assigned' | 'unassigned';
    is_active?: boolean;
    agent_id?: string;
}

interface InboundGmailProps {
    refreshTrigger?: number;
}

export default function InboundGmail({ refreshTrigger }: InboundGmailProps) {
    const { isDarkMode } = useTheme();
    const { user, userClass } = useAuthInfo();
    const getOrganizationId = useOrganizationId();

    // State management
    const [assignments, setAssignments] = useState<GmailAccountAssignment[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [gmailAccounts, setGmailAccounts] = useState<GmailAccount[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string>('');
    const [selectedGmailAccount, setSelectedGmailAccount] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [agentSearchTerm, setAgentSearchTerm] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isUnassigning, setIsUnassigning] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingAgents, setLoadingAgents] = useState(false);
    const [loadingGmailAccounts, setLoadingGmailAccounts] = useState(false);

    const loadGmailAccounts = useCallback(async () => {
        setLoadingGmailAccounts(true);
        try {
            console.log('🚀 Loading Gmail accounts from getAgentMappings...');

            // Get Gmail accounts from getAgentMappings API
            const response = await GmailService.getAgentMappings();
            console.log('🚀 Gmail agent mappings API response:', response);

            if (response && response.mappings && Array.isArray(response.mappings) && response.mappings.length > 0) {
                const accountsData = response.mappings.map((mapping: AgentMapping) => ({
                    id: mapping.email_address,
                    email: mapping.email_address,
                    name: mapping.description || mapping.email_address,
                    status: 'active' as const,
                    assignedAgent: mapping.agent_url,
                    lastSync: mapping.updated_at || mapping.created_at || new Date().toISOString(),
                    messageCount: 0,
                    unreadCount: 0
                }));
                console.log('✅ Gmail accounts data loaded from API:', accountsData);
                setGmailAccounts(accountsData);
            } else {
                console.log('❌ No Gmail accounts found in API response');
                setGmailAccounts([]);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('❌ Error loading Gmail accounts:', errorMessage);
            setGmailAccounts([]);
        } finally {
            setLoadingGmailAccounts(false);
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
            const response = await getAgentsByOrganization(orgId);
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
        console.log('🔍 useEffect triggered, loading Gmail accounts and agents');
        loadGmailAccounts();
        loadAgents();
    }, [loadGmailAccounts, loadAgents]);

    // Debug logging for agents and gmail accounts
    useEffect(() => {
        console.log('🔍 Current agents state:', agents);
        console.log('🔍 Current gmail accounts state:', gmailAccounts);
    }, [agents, gmailAccounts]);

    // Reload data when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            console.log('🔄 Refresh trigger activated, reloading data');
            loadGmailAccounts();
            loadAgents();
        }
    }, [refreshTrigger, loadGmailAccounts, loadAgents]);

    // Get friendly name from email address
    const getFriendlyName = (emailAddress: string) => {
        const [localPart, domain] = emailAddress.split('@');
        return `${localPart}@${domain}`;
    };

    // Convert Gmail accounts to assignments format
    useEffect(() => {
        if (gmailAccounts.length > 0) {
            console.log('🔄 Converting Gmail accounts to assignments:', gmailAccounts);
            const gmailAssignments: GmailAccountAssignment[] = gmailAccounts.map((account: GmailAccount, index: number) => ({
                id: account.id || `gmail_${index}`,
                email_address: account.email || '',
                friendly_name: getFriendlyName(account.email || ''),
                agent_name: account.assignedAgent || '',
                agent_prefix: account.assignedAgent || '',
                assigned_at: account.lastSync || '',
                status: (account.assignedAgent && account.assignedAgent !== 'unassigned' && account.assignedAgent !== '' && account.assignedAgent !== null) ? 'assigned' as const : 'unassigned' as const,
                is_active: account.status === 'active',
                agent_id: account.assignedAgent || null
            }));

            console.log('✅ Gmail assignments created:', gmailAssignments);
            setAssignments(gmailAssignments);
        } else {
            console.log('❌ No Gmail accounts to convert to assignments');
            setAssignments([]);
        }
    }, [gmailAccounts]);

    // Assignment functions
    const handleAssignAgent = async () => {
        console.log('🔍 Assign button clicked:', { selectedAgent, selectedGmailAccount, agents });

        if (!selectedAgent || !selectedGmailAccount) {
            console.log('❌ Missing required fields:', { selectedAgent, selectedGmailAccount });
            return;
        }

        const agent = agents.find(a => a.agent_prefix === selectedAgent || a.id === selectedAgent);
        console.log('🔍 Found agent:', agent);

        if (!agent) {
            console.log('❌ Agent not found for selectedAgent:', selectedAgent);
            return;
        }

        setIsAssigning(true);
        try {
            console.log('🚀 Assigning agent:', {
                agent,
                gmailAccount: selectedGmailAccount,
                apiKey: agent.api_key ? `${agent.api_key.substring(0, 10)}...` : 'No API key'
            });

            // Call the actual Gmail service to assign the agent
            const result = await GmailService.createAgentMappingCurl(
                selectedGmailAccount,
                agent.api_key || '',
                `${agent.name || agent.agent_prefix} Agent`
            );

            console.log('🔍 API result:', result);

            if (result.status === 'success') {
                // Refresh data after successful assignment
                await loadGmailAccounts();
                await loadAgents();

                setShowAssignModal(false);
                setSelectedAgent('');
                setSelectedGmailAccount('');

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
            console.log('🚀 Unassigning agent for Gmail account:', assignment.email_address);

            // Call the actual Gmail service to unassign the agent
            const result = await GmailService.unassignEmailAgent(assignment.email_address);

            if (result.success) {
                // Refresh data after successful unassignment
                await loadGmailAccounts();
                await loadAgents();

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

    // Email validation function
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Filter assignments based on search terms
    const filteredAssignments = assignments.filter(assignment => {
        const matchesSearch = assignment.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.friendly_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAgent = assignment.agent_name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
            assignment.agent_prefix.toLowerCase().includes(agentSearchTerm.toLowerCase());
        return matchesSearch && matchesAgent;
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
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                            <input
                                type="text"
                                placeholder="Search Gmail accounts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search Gmail accounts"
                                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Assign Agent Button */}
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="group relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
                                className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-64 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500 hover:bg-gray-600' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 hover:bg-gray-50'}`}
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
                {loadingGmailAccounts || loadingAgents ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                            <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Loading Gmail data...
                            </span>
                        </div>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="text-center py-12">
                        <Mail className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            No Gmail accounts found
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {searchTerm ? 'Try adjusting your search' : 'No Gmail accounts found. Add Gmail accounts to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto h-full">
                        <table className={`w-full ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}`}>
                                <tr>
                                    <th className="text-left py-4 px-6 font-semibold text-sm">
                                        Email Address
                                    </th>
                                    <th className="text-left py-4 px-6 font-semibold text-sm">
                                        Status
                                    </th>
                                    {hasAssignedAgents && (
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
                                        {/* Email Address Column */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Mail className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {assignment.email_address}
                                                    </div>
                                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {assignment.friendly_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status Column */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {assignment.is_active ? (
                                                    <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                                                ) : (
                                                    <XCircle className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                )}
                                                <span className={`text-sm ${assignment.is_active ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                                                    {assignment.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Unassign Column - Only show when there are assigned agents */}
                                        {hasAssignedAgents && (
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => {
                                                        if (assignment.status === 'assigned') {
                                                            handleUnassignAgent(assignment.id);
                                                        } else {
                                                            setShowAssignModal(true);
                                                        }
                                                    }}
                                                    disabled={isUnassigning === assignment.id}
                                                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                                                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                                        }`}
                                                    title={assignment.status === 'assigned' ? 'Unassign agent' : 'Assign agent'}
                                                >
                                                    {isUnassigning === assignment.id ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Edit className="h-4 w-4" />
                                                    )}
                                                </button>
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
                                        {Array.isArray(agents) && agents.length > 0 ? agents.map((agent) => (
                                            <option key={agent.agent_prefix || agent.id} value={agent.agent_prefix || agent.id}>
                                                {agent.name || agent.agent_prefix}
                                            </option>
                                        )) : (
                                            <option value="" disabled>No agents available</option>
                                        )}
                                    </select>
                                </div>

                                {/* Gmail Account Manual Entry */}
                                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                            Gmail Account Email
                                        </label>
                                    </div>
                                    <input
                                        type="email"
                                        value={selectedGmailAccount}
                                        onChange={(e) => setSelectedGmailAccount(e.target.value)}
                                        placeholder="Enter Gmail account email address"
                                        className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${selectedGmailAccount && !isValidEmail(selectedGmailAccount)
                                            ? isDarkMode
                                                ? 'bg-gray-700 border-red-500 text-white placeholder-gray-400'
                                                : 'bg-white border-red-500 text-gray-900 placeholder-gray-500'
                                            : isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                    />
                                    {selectedGmailAccount && !isValidEmail(selectedGmailAccount) && (
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                            Please enter a valid email address
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedAgent('');
                                        setSelectedGmailAccount('');
                                    }}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        console.log('🔍 Assign button clicked - button handler');
                                        handleAssignAgent();
                                    }}
                                    disabled={!selectedAgent || !selectedGmailAccount || !isValidEmail(selectedGmailAccount) || isAssigning}
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
    );
}
