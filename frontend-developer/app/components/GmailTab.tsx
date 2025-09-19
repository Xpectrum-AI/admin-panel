'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Mail,
    Settings,
    BarChart3,
    Activity,
    Plus,
    Search,
    Filter,
    RefreshCw,
    User,
    Clock,
    AlertCircle,
    CheckCircle,
    MoreVertical,
    Send,
    Archive,
    Trash2,
    Star,
    StarOff,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronRight,
    Bot,
    Users,
    Calendar,
    Tag,
    MessageCircle,
    Check,
    Edit
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { GmailService, GmailAccount, GmailMessage, GmailAssignment, AgentMappingsResponse, AgentMapping, ConversationMappingsResponse, ConversationMapping, WebhookTestRequest, WebhookTestResponse } from '../../service/gmailService';
import { agentConfigService } from '../../service/agentConfigService';
import { useOrganizationId } from './utils/phoneNumberUtils';

interface Agent {
    id: string;
    name: string;
    chatbot_key?: string;
    // Minimal required fields for compatibility
    agent_prefix: string;
}

interface GmailTabProps { }

export default function GmailTab({ }: GmailTabProps) {
    const { isDarkMode } = useTheme();
    const getOrganizationId = useOrganizationId();
    const [agentMappings, setAgentMappings] = useState<AgentMappingsResponse | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingAgents, setLoadingAgents] = useState(false);
    const [showCreateMappingModal, setShowCreateMappingModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [agentSearchTerm, setAgentSearchTerm] = useState('');

    // Form state for creating new agent mapping
    const [newMapping, setNewMapping] = useState({
        emailAddress: '',
        description: '',
        selectedAgentId: ''
    });

    // Agent mapping result popup state
    const [showMappingResultModal, setShowMappingResultModal] = useState(false);
    const [mappingResult, setMappingResult] = useState<{
        success: boolean;
        message: string;
        timestamp: string;
        data?: any;
    } | null>(null);

    // Load data on component mount
    useEffect(() => {
        loadData();
        loadAgents();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [mappingsData] = await Promise.all([
                GmailService.getGmailAccounts()
            ]);
            setAgentMappings(mappingsData);

            if (mappingsData.mappings.length > 0) {
                // Handle successful data loading
                console.log('Loaded mappings:', mappingsData.mappings.length);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAgents = useCallback(async () => {
        setLoadingAgents(true);
        try {
            const orgId = getOrganizationId();

            if (!orgId) {
                setAgents([]);
                return;
            }

            console.log('🚀 Fetching agents for organization:', orgId);
            const result = await agentConfigService.getAllAgents(orgId);

            if (result.success && result.data) {
                // Transform agents to only include id, name, and chatbot_key
                const transformedAgents: Agent[] = result.data.map((agent: any) => ({
                    id: agent.name || agent.id || `agent-${Date.now()}`,
                    name: agent.name || 'Unnamed Agent',
                    chatbot_key: agent.chatbot_key || undefined,
                    // Set minimal required fields
                    agent_prefix: agent.name || agent.agent_prefix || ''
                }));

                setAgents(transformedAgents);
                console.log('✅ Loaded agents with chatbot keys:', transformedAgents.map(a => ({
                    id: a.id,
                    name: a.name,
                    hasKey: !!a.chatbot_key
                })));
            } else {
                setAgents([]);
                console.log('No agents found or error loading agents:', result.message);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error loading agents:', errorMessage);
            setAgents([]);
        } finally {
            setLoadingAgents(false);
        }
    }, [getOrganizationId]);

    const handleCreateMapping = async () => {
        try {
            if (!newMapping.selectedAgentId) {
                alert('Please select an agent');
                return;
            }

            // Find the selected agent
            const selectedAgent = agents.find(agent => agent.id === newMapping.selectedAgentId);
            if (!selectedAgent) {
                alert('Selected agent not found');
                return;
            }

            // Use the selected agent's chatbot_key as the API key
            const apiKey = selectedAgent.chatbot_key || '';

            console.log('🚀 Creating agent mapping with:', {
                emailAddress: newMapping.emailAddress,
                selectedAgent: {
                    id: selectedAgent.id,
                    name: selectedAgent.name,
                    chatbot_key: apiKey ? apiKey.substring(0, 20) + '...' : 'No API key'
                },
                description: newMapping.description
            });

            const result = await GmailService.createAgentMappingCurl(
                newMapping.emailAddress,
                apiKey,
                newMapping.description
            );

            console.log('✅ Agent mapping created successfully:', result);

            // Show success popup
            setMappingResult({
                success: true,
                message: result.message || 'Agent mapping created successfully!',
                timestamp: result.timestamp || new Date().toISOString(),
                data: result
            });
            setShowMappingResultModal(true);

            setShowCreateMappingModal(false);
            setNewMapping({ emailAddress: '', description: '', selectedAgentId: '' });
            await loadData(); // Refresh data
        } catch (error) {
            console.error('❌ Error creating agent mapping:', error);

            // Show error popup
            setMappingResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create agent mapping',
                timestamp: new Date().toISOString(),
                data: error
            });
            setShowMappingResultModal(true);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setAgentSearchTerm('');
    };

    // Filter mappings based on search terms
    const filteredMappings = agentMappings?.mappings?.filter(mapping => {
        const matchesSearch = mapping.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mapping.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAgent = mapping.agent_url.toLowerCase().includes(agentSearchTerm.toLowerCase());
        return matchesSearch && matchesAgent;
    }) || [];

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
            <div className={`rounded-xl sm:rounded-2xl border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
                {/* Header */}
                <div className={`p-4 sm:p-6 lg:p-8 border-b rounded-t-xl sm:rounded-t-2xl ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-red-900/20 to-pink-900/20' : 'border-gray-200/50 bg-gradient-to-r from-red-50 to-pink-50'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg sm:rounded-xl">
                                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                                </div>
                                <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                                    Gmail-Enabled Email Accounts
                                </h2>
                            </div>
                            <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage Gmail-enabled email accounts and agent assignments</p>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <button className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gray-500 text-white rounded-lg sm:rounded-xl hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3">
                                <span className="text-sm sm:text-base font-semibold">Xpectrum</span>
                            </button>
                            <button
                                onClick={() => {
                                    console.log('🔄 Manual refresh triggered');
                                    loadData();
                                    loadAgents();
                                }}
                                className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-red-600 text-white rounded-lg sm:rounded-xl hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
                            >
                                <RefreshCw className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                <span className="text-sm sm:text-base font-semibold">Refresh</span>
                            </button>
                            <button
                                onClick={() => setShowCreateMappingModal(true)}
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
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="h-6 w-6 animate-spin text-red-500" />
                                <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Loading Gmail data...
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
                                        placeholder="Search email addresses..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
                                    />
                                </div>

                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Users className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                            <input
                                                type="text"
                                                placeholder="Enter agent name or URL..."
                                                value={agentSearchTerm}
                                                onChange={(e) => setAgentSearchTerm(e.target.value)}
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
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
                                                    Email Address
                                                </th>
                                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    Description
                                                </th>
                                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    Agent
                                                </th>
                                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                            {filteredMappings.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Mail className={`h-8 w-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {agentMappings?.mappings?.length === 0 ? 'No Gmail mappings found' : 'No Gmail mappings match your search'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMappings.map((mapping, index) => (
                                                    <tr key={mapping.email_address || index} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <Mail className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                    {mapping.email_address}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                                {mapping.description.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                                    {mapping.agent_url.split('/').pop()}
                                                                </span>
                                                                <Check className="h-4 w-4 ml-2 text-green-500" />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className={`p-2 rounded-lg hover:bg-opacity-10 transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-red-600 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
                                                                    title="Edit mapping"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    className={`p-2 rounded-lg hover:bg-opacity-10 transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-red-600 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
                                                                    title="Delete mapping"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
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

                {/* Create Agent Mapping Modal */}
                {showCreateMappingModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Plus className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Create Agent Mapping
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={newMapping.emailAddress}
                                            onChange={(e) => setNewMapping({ ...newMapping, emailAddress: e.target.value })}
                                            className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                            placeholder="Enter email address"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={newMapping.description}
                                            onChange={(e) => setNewMapping({ ...newMapping, description: e.target.value })}
                                            className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                            placeholder="Enter description"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Select Agent
                                        </label>
                                        <select
                                            value={newMapping.selectedAgentId}
                                            onChange={(e) => setNewMapping({ ...newMapping, selectedAgentId: e.target.value })}
                                            className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        >
                                            <option value="">Select an agent</option>
                                            {agents.map((agent) => (
                                                <option key={agent.id} value={agent.id}>
                                                    {agent.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowCreateMappingModal(false)}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateMapping}
                                        disabled={!newMapping.emailAddress || !newMapping.description || !newMapping.selectedAgentId}
                                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Create Mapping
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mapping Result Modal */}
                {showMappingResultModal && mappingResult && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`p-2 rounded-lg ${mappingResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {mappingResult.success ? (
                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-6 w-6 text-red-500" />
                                        )}
                                    </div>
                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {mappingResult.success ? 'Success!' : 'Error'}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {mappingResult.message}
                                    </p>

                                    <div className="text-xs">
                                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Timestamp:
                                        </span>
                                        <span className={`font-mono ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {new Date(mappingResult.timestamp).toLocaleString()}
                                        </span>
                                    </div>

                                    {mappingResult.data && (
                                        <div>
                                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Response Data:
                                            </span>
                                            <pre className={`mt-1 p-2 rounded text-xs overflow-auto max-h-32 ${isDarkMode
                                                ? 'bg-gray-700 text-gray-300'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {JSON.stringify(mappingResult.data, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowMappingResultModal(false)}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                            }`}
                                    >
                                        Close
                                    </button>
                                    {mappingResult.success && (
                                        <button
                                            onClick={() => {
                                                setShowMappingResultModal(false);
                                                setShowCreateMappingModal(true);
                                            }}
                                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Create Another
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
