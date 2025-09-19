'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Mail, User, Send, Loader2, AlertCircle, CheckCircle, XCircle, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { GmailService } from '../../service/gmailService';
import { getAgentsByOrganization } from '../../service/phoneNumberService';
import { useOrganizationId } from './utils/phoneNumberUtils';

interface Agent {
    id: string;
    name: string;
    chatbot_key?: string;
    agent_prefix: string;
}

interface GmailCampaign {
    id: string;
    name: string;
    subject: string;
    content: string;
    recipient_emails: string[];
    scheduled_time: string;
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    agent_id: string;
    agent_name: string;
    created_at: string;
    updated_at: string;
}

interface OutboundGmailProps {
    refreshTrigger?: number;
}

export default function OutboundGmail({ refreshTrigger }: OutboundGmailProps) {
    const { isDarkMode } = useTheme();
    const { user, userClass } = useAuthInfo();
    const getOrganizationId = useOrganizationId();

    // State management
    const [campaigns, setCampaigns] = useState<GmailCampaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<GmailCampaign | null>(null);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
    const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<GmailCampaign | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Campaign form state
    const [campaignForm, setCampaignForm] = useState({
        name: '',
        subject: '',
        content: '',
        recipient_emails: '',
        scheduled_time: '',
        agent_id: ''
    });
    
    const [saving, setSaving] = useState(false);
    const [campaignError, setCampaignError] = useState<string | null>(null);
    const [campaignSuccess, setCampaignSuccess] = useState<string | null>(null);
    
    // Agents state
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loadingAgents, setLoadingAgents] = useState(false);

    // Load data on component mount
    useEffect(() => {
        loadCampaigns();
        loadAgents();
    }, []);

    // Reload data when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            loadCampaigns();
            loadAgents();
        }
    }, [refreshTrigger]);

    const loadCampaigns = useCallback(async () => {
        setLoadingCampaigns(true);
        try {
            console.log('🚀 Loading Gmail campaigns...');
            // TODO: Implement Gmail campaigns API call
            // For now, using sample data
            const sampleCampaigns: GmailCampaign[] = [
                {
                    id: '1',
                    name: 'Welcome Email Campaign',
                    subject: 'Welcome to our service!',
                    content: 'Thank you for joining us...',
                    recipient_emails: ['user1@example.com', 'user2@example.com'],
                    scheduled_time: '2024-01-20T10:00:00Z',
                    status: 'scheduled',
                    agent_id: 'agent_001',
                    agent_name: 'Riley',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-15T10:00:00Z'
                },
                {
                    id: '2',
                    name: 'Newsletter Campaign',
                    subject: 'Monthly Newsletter',
                    content: 'Here are the latest updates...',
                    recipient_emails: ['user3@example.com'],
                    scheduled_time: '2024-01-25T14:00:00Z',
                    status: 'draft',
                    agent_id: 'agent_002',
                    agent_name: 'Elliot',
                    created_at: '2024-01-16T09:00:00Z',
                    updated_at: '2024-01-16T09:00:00Z'
                }
            ];
            setCampaigns(sampleCampaigns);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Error loading Gmail campaigns:', errorMessage);
            setCampaigns([]);
        } finally {
            setLoadingCampaigns(false);
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
                // Ensure the data is an array
                let agentsData = response.data;
                
                // Handle different response formats
                if (!Array.isArray(agentsData)) {
                    if (agentsData.agents && Array.isArray(agentsData.agents)) {
                        agentsData = agentsData.agents;
                    } else if (agentsData.data && Array.isArray(agentsData.data)) {
                        agentsData = agentsData.data;
                    } else {
                        console.log('❌ Agents data is not in expected array format:', agentsData);
                        agentsData = [];
                    }
                }
                
                console.log('✅ Agents loaded:', agentsData);
                setAgents(agentsData);
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

    const handleSelectCampaign = (campaign: GmailCampaign) => {
        setSelectedCampaign(campaign);
    };

    const handleEditCampaign = (campaign: GmailCampaign) => {
        setEditingCampaign(campaign);
        setCampaignForm({
            name: campaign.name,
            subject: campaign.subject,
            content: campaign.content,
            recipient_emails: campaign.recipient_emails.join(', '),
            scheduled_time: campaign.scheduled_time,
            agent_id: campaign.agent_id
        });
        setShowEditCampaignModal(true);
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm('Are you sure you want to delete this Gmail campaign?')) {
            return;
        }

        try {
            // TODO: Implement Gmail campaign deletion API call
            setCampaignSuccess('Gmail campaign deleted successfully!');
            await loadCampaigns();
            if (selectedCampaign?.id === campaignId) {
                setSelectedCampaign(null);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setCampaignError('Failed to delete Gmail campaign: ' + errorMessage);
        }
    };

    const handleCreateCampaign = async () => {
        setCampaignError(null);
        
        if (!campaignForm.name || !campaignForm.subject || !campaignForm.content || !campaignForm.agent_id) {
            setCampaignError('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        setCampaignError(null);
        setCampaignSuccess(null);

        try {
            // TODO: Implement Gmail campaign creation API call
            setCampaignSuccess('Gmail campaign created successfully!');
            
            // Reset form
            setCampaignForm({
                name: '',
                subject: '',
                content: '',
                recipient_emails: '',
                scheduled_time: '',
                agent_id: ''
            });
            
            setShowCreateCampaignModal(false);
            await loadCampaigns();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setCampaignError('Failed to create Gmail campaign: ' + errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateCampaign = async () => {
        if (!editingCampaign) return;
        
        setSaving(true);
        setCampaignError(null);
        
        try {
            // TODO: Implement Gmail campaign update API call
            setCampaignSuccess('Gmail campaign updated successfully!');
            
            setShowEditCampaignModal(false);
            setEditingCampaign(null);
            await loadCampaigns();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setCampaignError('Failed to update Gmail campaign: ' + errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const clearMessages = () => {
        setCampaignError(null);
        setCampaignSuccess(null);
    };

    useEffect(() => {
        if (campaignError || campaignSuccess) {
            const timer = setTimeout(clearMessages, 5000);
            return () => clearTimeout(timer);
        }
    }, [campaignError, campaignSuccess]);

    // Filter campaigns based on search term
    const filteredCampaigns = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full">
            {/* Left Sidebar - Campaigns List */}
            <div className="w-80 border-r border-gray-200/50 flex flex-col">
                <div className="p-4 border-b border-gray-200/50">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Gmail Campaigns
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {searchTerm ? `${filteredCampaigns.length} of ${campaigns.length} campaigns` : `${campaigns.length} campaigns`}
                            </p>
                        </div>
                        
                        {/* Create Campaign Button */}
                        <button
                            onClick={() => setShowCreateCampaignModal(true)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                                isDarkMode
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
                            }`}
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-semibold">Create Campaign</span>
                        </button>
                    </div>
                    
                    <div className="relative group">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search campaigns"
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    {loadingCampaigns ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Loading campaigns...
                            </span>
                        </div>
                    ) : filteredCampaigns.length === 0 ? (
                        <div className="text-center py-8">
                            <Mail className={`h-8 w-8 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {searchTerm ? 'No campaigns match your search' : 'No campaigns found'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredCampaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    onClick={() => handleSelectCampaign(campaign)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                        selectedCampaign?.id === campaign.id
                                            ? isDarkMode
                                                ? 'bg-blue-600/20 border border-blue-500/50'
                                                : 'bg-blue-50 border border-blue-200'
                                            : isDarkMode
                                                ? 'bg-gray-700/50 hover:bg-gray-700'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {campaign.name}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            campaign.status === 'sent' 
                                                ? 'bg-green-100 text-green-800'
                                                : campaign.status === 'scheduled'
                                                ? 'bg-blue-100 text-blue-800'
                                                : campaign.status === 'draft'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {campaign.subject}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {campaign.agent_name} • {new Date(campaign.scheduled_time).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Campaign Details */}
            <div className="flex-1 p-6">
                {selectedCampaign ? (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                <Mail className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedCampaign.name}
                                </h2>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Gmail Campaign Details
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Subject
                                </label>
                                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedCampaign.subject}
                                </p>
                            </div>
                            
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Agent
                                </label>
                                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedCampaign.agent_name}
                                </p>
                            </div>
                            
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Scheduled Time
                                </label>
                                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {new Date(selectedCampaign.scheduled_time).toLocaleString()}
                                </p>
                            </div>
                            
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Status
                                </label>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    selectedCampaign.status === 'sent' 
                                        ? 'bg-green-100 text-green-800'
                                        : selectedCampaign.status === 'scheduled'
                                        ? 'bg-blue-100 text-blue-800'
                                        : selectedCampaign.status === 'draft'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {selectedCampaign.status}
                                </span>
                            </div>
                            
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Recipients
                                </label>
                                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedCampaign.recipient_emails.length} recipients
                                </p>
                            </div>
                        </div>
                        
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Content
                            </label>
                            <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {selectedCampaign.content}
                            </p>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditCampaign(selectedCampaign)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Mail className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                            <h3 className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Select a Gmail Campaign
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Choose a campaign from the sidebar to view its details
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Campaign Modal */}
            {showCreateCampaignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowCreateCampaignModal(false)}>
                    <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
                        <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Create Gmail Campaign
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Mail className="h-4 w-4" />
                                        Campaign Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={campaignForm.name}
                                        onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <User className="h-4 w-4" />
                                        Agent *
                                    </label>
                                    <select
                                        value={campaignForm.agent_id}
                                        onChange={(e) => setCampaignForm({...campaignForm, agent_id: e.target.value})}
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                    >
                                        <option value="">Select an agent</option>
                                        {Array.isArray(agents) && agents.map((agent) => (
                                            <option key={agent.id} value={agent.id}>
                                                {agent.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Mail className="h-4 w-4" />
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    value={campaignForm.subject}
                                    onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Mail className="h-4 w-4" />
                                    Recipient Emails (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={campaignForm.recipient_emails}
                                    onChange={(e) => setCampaignForm({...campaignForm, recipient_emails: e.target.value})}
                                    placeholder="email1@example.com, email2@example.com"
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Calendar className="h-4 w-4" />
                                    Scheduled Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={campaignForm.scheduled_time}
                                    onChange={(e) => setCampaignForm({...campaignForm, scheduled_time: e.target.value})}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Mail className="h-4 w-4" />
                                    Content *
                                </label>
                                <textarea
                                    value={campaignForm.content}
                                    onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                                    rows={6}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                />
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {campaignError && (
                            <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-xs sm:text-sm">
                                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <p>{campaignError}</p>
                            </div>
                        )}

                        {campaignSuccess && (
                            <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-xs sm:text-sm">
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <p>{campaignSuccess}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-6 sm:mt-8 flex justify-center sticky bottom-0 bg-inherit pt-4">
                            <button
                                onClick={handleCreateCampaign}
                                disabled={saving || !campaignForm.name || !campaignForm.subject || !campaignForm.content || !campaignForm.agent_id}
                                className="group relative px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                ) : (
                                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                                <span className="text-sm sm:text-base font-semibold">
                                    {saving ? 'Creating...' : 'Create Campaign'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Campaign Modal */}
            {showEditCampaignModal && editingCampaign && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowEditCampaignModal(false)}>
                    <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
                        <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Edit Gmail Campaign
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Mail className="h-4 w-4" />
                                        Campaign Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={campaignForm.name}
                                        onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <User className="h-4 w-4" />
                                        Agent *
                                    </label>
                                    <select
                                        value={campaignForm.agent_id}
                                        onChange={(e) => setCampaignForm({...campaignForm, agent_id: e.target.value})}
                                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                    >
                                        <option value="">Select an agent</option>
                                        {Array.isArray(agents) && agents.map((agent) => (
                                            <option key={agent.id} value={agent.id}>
                                                {agent.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Mail className="h-4 w-4" />
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    value={campaignForm.subject}
                                    onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Mail className="h-4 w-4" />
                                    Recipient Emails (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={campaignForm.recipient_emails}
                                    onChange={(e) => setCampaignForm({...campaignForm, recipient_emails: e.target.value})}
                                    placeholder="email1@example.com, email2@example.com"
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Calendar className="h-4 w-4" />
                                    Scheduled Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={campaignForm.scheduled_time}
                                    onChange={(e) => setCampaignForm({...campaignForm, scheduled_time: e.target.value})}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Mail className="h-4 w-4" />
                                    Content *
                                </label>
                                <textarea
                                    value={campaignForm.content}
                                    onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                                    rows={6}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
                                />
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {campaignError && (
                            <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-xs sm:text-sm">
                                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <p>{campaignError}</p>
                            </div>
                        )}

                        {campaignSuccess && (
                            <div className="p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-xs sm:text-sm">
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <p>{campaignSuccess}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-6 sm:mt-8 flex justify-center sticky bottom-0 bg-inherit pt-4">
                            <button
                                onClick={handleUpdateCampaign}
                                disabled={saving || !campaignForm.name || !campaignForm.subject || !campaignForm.content || !campaignForm.agent_id}
                                className="group relative px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                ) : (
                                    <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                                <span className="text-sm sm:text-base font-semibold">
                                    {saving ? 'Updating...' : 'Update Campaign'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
