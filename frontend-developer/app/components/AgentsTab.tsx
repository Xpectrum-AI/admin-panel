'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Settings, Mic, Wrench, BarChart3, Globe, MessageSquare, Sparkles, Zap, Activity, Search, RefreshCw, Trash2, Phone as PhoneIcon, ChevronDown } from 'lucide-react';
import ModelConfig from './config/ModelConfig';
import VoiceConfig from './config/VoiceConfig';
import TranscriberConfig from './config/TranscriberConfig';
import ToolsConfig from './config/ToolsConfig';
import PhoneNumbersTab from './PhoneNumbersTab';
import SMSTab from './SMSTab';
import WhatsAppTab from './WhatsAppTab';

import { agentConfigService } from '../../service/agentConfigService';

import { useTheme } from '../contexts/ThemeContext';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  model?: string;
  provider?: string;
  cost?: string;
  latency?: string;
  avatar?: string;
  description?: string;

  organization_id?: string;
  chatbot_api?: string;
  chatbot_key?: string;
  tts_config?: any;
  stt_config?: any;
  initial_message?: string;
  nudge_text?: string;
  nudge_interval?: number;
  max_nudges?: number;
  typing_volume?: number;
  max_call_duration?: number;
  created_at?: string;
  updated_at?: string;

  config?: Record<string, unknown>;

}

// Fallback sample agents in case API fails
const fallbackAgents: Agent[] = [
  {
    id: 'riley-001',
    name: 'Riley',
    status: 'active',
    model: 'GPT 4o Cluster',
    provider: 'OpenAI',
    cost: '~$0.15/min',
    latency: '~1050ms',
    avatar: '🤖',
    description: 'Your intelligent scheduling agent'
  },
  {
    id: 'elliot-002',
    name: 'Elliot',
    status: 'draft',
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    cost: '~$0.12/min',
    latency: '~980ms',
    avatar: '🧠',
    description: 'Advanced conversation specialist'
  }
];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AgentsTabProps {

}

export default function AgentsTab({}: AgentsTabProps) {
  const { isDarkMode } = useTheme();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const [activeConfigTab, setActiveConfigTab] = useState('model');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showAgentPrefixModal, setShowAgentPrefixModal] = useState(false);
  const [agentPrefix, setAgentPrefix] = useState('');
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [agentsError, setAgentsError] = useState('');
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string>('developer');

  // Configuration state for all components
  const [modelConfig, setModelConfig] = useState<any>(null);
  const [voiceConfig, setVoiceConfig] = useState<any>(null);
  const [transcriberConfig, setTranscriberConfig] = useState<any>(null);


  // Refs for scrolling to sections
  const modelSectionRef = useRef<HTMLDivElement>(null);
  const voiceSectionRef = useRef<HTMLDivElement>(null);
  const transcriberSectionRef = useRef<HTMLDivElement>(null);
  const toolsSectionRef = useRef<HTMLDivElement>(null);
  // Removed analysis, advanced, widget section refs

  // Fetch agents from backend
  const fetchAgents = useCallback(async () => {
    console.log('🔄 Starting fetchAgents...');
    setIsLoadingAgents(true);
    setAgentsError('');
    
    try {
      const result = await agentConfigService.getAllAgents();
      console.log('📊 getAllAgents result:', result);
      
              if (result.success) {
          if (result.data && result.data.length > 0) {
            console.log('📋 Processing agents data:', result.data);
            console.log('📋 First agent sample:', result.data[0]);
            // Transform backend data to match our Agent interface
            const transformedAgents: Agent[] = result.data.map((agent: any, index: number) => {
              console.log(`📋 Transforming agent ${index}:`, agent);
              return {
                id: agent.name || agent.id || `agent-${Date.now()}`,
                name: agent.name || 'Unnamed Agent',
                status: agent.status || 'draft',
                model: agent.model || 'GPT-4o',
                provider: agent.provider || 'OpenAI',
                cost: agent.cost || '~$0.10/min',
                latency: agent.latency || '~1000ms',
                avatar: '🤖',
                description: agent.description || 'AI Agent',
                organization_id: agent.organization_id,
                chatbot_api: agent.chatbot_api,
                chatbot_key: agent.chatbot_key,
                tts_config: agent.tts_config,
                stt_config: agent.stt_config,
                initial_message: agent.initial_message,
                nudge_text: agent.nudge_text,
                nudge_interval: agent.nudge_interval,
                max_nudges: agent.max_nudges,
                typing_volume: agent.typing_volume,
                max_call_duration: agent.max_call_duration,
                created_at: agent.created_at,
                updated_at: agent.updated_at
              };
            });
            
            console.log('✅ Transformed agents:', transformedAgents);
            setAgents(transformedAgents);
          
          // Select the first agent if none is selected
          if (transformedAgents.length > 0 && !selectedAgent) {
            setSelectedAgent(transformedAgents[0]);
          }
        } else {
          // No agents found - this is normal for a new setup
          console.log('No agents found in backend. This is normal for a new setup.');
          setAgents([]);
          setSelectedAgent(null);
        }
      } else {
        // Don't show error for 405 Method Not Allowed - it's expected
        if (result.message.includes('405') || result.message.includes('Method Not Allowed')) {
          console.log('Backend does not support listing all agents. This is normal.');
          setAgents([]);
          setSelectedAgent(null);
        } else {
          setAgentsError(result.message);
          setAgents(fallbackAgents);
          if (fallbackAgents.length > 0 && !selectedAgent) {
            setSelectedAgent(fallbackAgents[0]);
          }
        }
      }
    } catch (error) {
      // Don't show 405 errors as they are expected
      if (error instanceof Error && error.message.includes('405')) {
        console.log('Backend does not support listing all agents. This is normal.');
        setAgents([]);
        setSelectedAgent(null);
      } else {
        console.error('Error fetching agents:', error);
        setAgentsError('Failed to load agents from server');
        setAgents(fallbackAgents);
        if (fallbackAgents.length > 0 && !selectedAgent) {
          setSelectedAgent(fallbackAgents[0]);
        }
      }
    } finally {
      setIsLoadingAgents(false);
      console.log('🏁 fetchAgents completed');
    }
  }, [selectedAgent]);

  // Load agents on component mount
  useEffect(() => {
    fetchAgents();
    // Get current organization ID
    setCurrentOrganizationId(agentConfigService.getCurrentOrganizationId());
  }, []);

  // Refresh configuration when selectedAgent changes
  useEffect(() => {
    if (selectedAgent) {
      console.log('🔄 Selected agent changed, refreshing configuration:', selectedAgent);
      
      // Only update if the configurations are actually different to prevent loops
      if (selectedAgent.initial_message && (!modelConfig || modelConfig.firstMessage !== selectedAgent.initial_message)) {
        const modelConfigData = { firstMessage: selectedAgent.initial_message };
        setModelConfig(modelConfigData);
        console.log('Updated model config:', modelConfigData);
      }
      
      if (selectedAgent.tts_config && JSON.stringify(voiceConfig) !== JSON.stringify(selectedAgent.tts_config)) {
        console.log('Updated voice config:', selectedAgent.tts_config);
        setVoiceConfig(selectedAgent.tts_config);
      }
      
      if (selectedAgent.stt_config && JSON.stringify(transcriberConfig) !== JSON.stringify(selectedAgent.stt_config)) {
        console.log('Updated transcriber config:', selectedAgent.stt_config);
        setTranscriberConfig(selectedAgent.stt_config);
      }
    }
  }, [selectedAgent?.id]); // Only depend on the agent ID, not the entire object

  // Handle creating a new agent
  const handleCreateNewAgent = useCallback(() => {
    // Show agent prefix modal first
    setShowAgentPrefixModal(true);
    setAgentPrefix('');
  }, []);

  // Handle agent prefix submission
  const handleAgentPrefixSubmit = useCallback(() => {
    if (!agentPrefix.trim()) {
      alert('Please enter an agent prefix');
      return;
    }
    
    // Validate agent prefix format (lowercase, numbers, underscores only)
    const prefixRegex = /^[a-z0-9_]+$/;
    if (!prefixRegex.test(agentPrefix.trim())) {
      alert('Agent prefix can only contain lowercase letters, numbers, and underscores');
      return;
    }
    
    // Check if prefix is too short or too long
    if (agentPrefix.trim().length < 3) {
      alert('Agent prefix must be at least 3 characters long');
      return;
    }
    
    if (agentPrefix.trim().length > 50) {
      alert('Agent prefix must be less than 50 characters long');
      return;
    }
    
    // Create a temporary new agent for configuration
    const newAgent: Agent = {
      id: agentPrefix.trim(),
      name: agentPrefix.trim(),
      status: 'draft',
      avatar: '🤖',
      description: 'AI Agent - Ready for configuration',
      model: 'GPT-4o',
      provider: 'OpenAI',
      cost: '~$0.15/min',
      latency: '~1050ms'
    };
    
    setSelectedAgent(newAgent);
    setActiveConfigTab('model'); // Start with model configuration
    setIsCreating(true);
    setIsEditing(false);
    setShowAgentPrefixModal(false);
    setAgentPrefix('');
    
    // Add the new agent to the agents list
    setAgents(prev => [...prev, newAgent]);
    
    console.log('Created new agent with prefix:', agentPrefix.trim());
  }, [agentPrefix]);

  // Handle editing an existing agent
  const handleEditAgent = useCallback((agent: Agent) => {
    console.log('Editing agent:', agent);
    setSelectedAgent(agent);
    setIsEditing(true);
    setIsCreating(false);
    
    // Pre-populate configuration with existing agent data
    if (agent.initial_message) {
      const modelConfigData = { firstMessage: agent.initial_message };
      setModelConfig(modelConfigData);
      console.log('Set model config:', modelConfigData);
    }
    
    if (agent.tts_config) {
      console.log('Setting voice config from agent:', agent.tts_config);
      setVoiceConfig(agent.tts_config);
    }
    
    if (agent.stt_config) {
      console.log('Setting transcriber config from agent:', agent.stt_config);
      setTranscriberConfig(agent.stt_config);
    }
    
    setActiveConfigTab('model'); // Start with model configuration
  }, []);

  // Refresh agent configuration after updates
  const refreshAgentConfiguration = useCallback((agent: Agent) => {
    console.log('🔄 Refreshing agent configuration:', agent);
    
    // Update the selected agent
    setSelectedAgent(agent);
    
    // Update configuration state
    if (agent.initial_message) {
      const modelConfigData = { firstMessage: agent.initial_message };
      setModelConfig(modelConfigData);
      console.log('Updated model config:', modelConfigData);
    }
    
    if (agent.tts_config) {
      console.log('Updated voice config:', agent.tts_config);
      setVoiceConfig(agent.tts_config);
    }
    
    if (agent.stt_config) {
      console.log('Updated transcriber config:', agent.stt_config);
      setTranscriberConfig(agent.stt_config);
    }
    
    // Update agents list
    setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
  }, []); // Empty dependency array since this function doesn't depend on any state

  // Function to get agent configuration data for components
  const getAgentConfigData = useCallback((agent: Agent) => {
    return {
      // Model config data
      modelConfig: {
        firstMessage: agent.initial_message || '',
        systemPrompt: agent.initial_message || '',
        selectedModelProvider: agent.provider || 'OpenAI',
        selectedModel: agent.model || 'GPT-4o'
      },
      // Voice config data - pass the raw backend config directly
      voiceConfig: agent.tts_config || null,
      // Transcriber config data - pass the raw backend config directly
      transcriberConfig: agent.stt_config || null,
      // Tools config data
      toolsConfig: {
        initialMessage: agent.initial_message || '',
        nudgeText: agent.nudge_text || 'Hello, Are you still there?',
        nudgeInterval: agent.nudge_interval || 15,
        maxNudges: agent.max_nudges || 3,
        typingVolume: agent.typing_volume || 0.8,
        maxCallDuration: agent.max_call_duration || 300
      }
    };
  }, []);

  // Handle configuration changes from child components
  const handleModelConfigChange = useCallback((config: any) => {
    setModelConfig(config);
    // Don't update selectedAgent here to avoid infinite loops
    console.log('Model config changed:', config);
  }, []);

  const handleVoiceConfigChange = useCallback((config: any) => {
    setVoiceConfig(config);
    // Don't update selectedAgent here to avoid infinite loops
    console.log('Voice config changed:', config);
  }, []);

  const handleTranscriberConfigChange = useCallback((config: any) => {
    setTranscriberConfig(config);
    // Don't update selectedAgent here to avoid infinite loops
    console.log('Transcriber config changed:', config);
  }, []);

  // Handle deleting an agent
  const handleDeleteAgent = useCallback(async (agent: Agent) => {
    if (window.confirm(`Are you sure you want to delete agent "${agent.name}"? This action cannot be undone.`)) {
      try {
        const result = await agentConfigService.deleteAgent(agent.name);
        if (result.success) {
          // Remove agent from local state
          setAgents(prev => prev.filter(a => a.id !== agent.id));
          if (selectedAgent?.id === agent.id) {
            setSelectedAgent(null);
          }
          console.log(`Agent "${agent.name}" deleted successfully`);
        } else {
          console.error('Failed to delete agent:', result.message);
          alert(`Failed to delete agent: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Error deleting agent. Please try again.');
      }
    }
  }, [selectedAgent]);

  // Function to handle tab clicks and scroll to section
  const handleTabClick = useCallback((tabId: string) => {
    // Save current configurations before switching tabs
    if (activeConfigTab === 'voice' && voiceConfig) {
      // Ensure voice config is saved
      console.log('Saving voice config before tab switch:', voiceConfig);
    }
    if (activeConfigTab === 'transcriber' && transcriberConfig) {
      // Ensure transcriber config is saved
      console.log('Saving transcriber config before tab switch:', transcriberConfig);
    }
    
    setActiveConfigTab(tabId);
    setIsDropdownOpen(false); // Close dropdown on mobile

    // Scroll to the corresponding section
    setTimeout(() => {
      switch (tabId) {
        case 'model':
          modelSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'voice':
          voiceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'transcriber':
          transcriberSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'tools':
          toolsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        default:
          break;
      }
    }, 100);
  }, [activeConfigTab]); // Remove voiceConfig and transcriberConfig from dependencies


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDropdownOpen && !target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Handle agent creation callback
  const handleAgentCreated = useCallback(async () => {
    console.log('🔄 Refreshing agents list after creation/update...');
    
    try {
      // Fetch updated agents list
      await fetchAgents();
      
      // If we have a selected agent, refresh its configuration
      if (selectedAgent) {
        console.log('🔄 Refreshing selected agent configuration:', selectedAgent.name);
        
        // Wait a bit for the agents state to update
        setTimeout(async () => {
          try {
            // Get the current agents list
            const result = await agentConfigService.getAllAgents();
            if (result.success && result.data) {
              // Find the updated agent in the new list
              const updatedAgent = result.data.find((a: any) => a.name === selectedAgent.name);
              if (updatedAgent) {
                console.log('✅ Found updated agent, refreshing configuration:', updatedAgent);
                
                // Transform the agent data
                const transformedAgent: Agent = {
                  id: updatedAgent.name || updatedAgent.id || `agent-${Date.now()}`,
                  name: updatedAgent.name || 'Unnamed Agent',
                  status: updatedAgent.status || 'draft',
                  model: updatedAgent.model || 'Unknown Model',
                  provider: updatedAgent.provider || 'Unknown Provider',
                  cost: updatedAgent.cost || '~$0.10/min',
                  latency: updatedAgent.latency || '~1000ms',
                  avatar: '🤖',
                  description: updatedAgent.description || 'AI Agent',
                  organization_id: updatedAgent.organization_id,
                  chatbot_api: updatedAgent.chatbot_api,
                  chatbot_key: updatedAgent.chatbot_key,
                  tts_config: updatedAgent.tts_config,
                  stt_config: updatedAgent.stt_config,
                  initial_message: updatedAgent.initial_message,
                  nudge_text: updatedAgent.nudge_text,
                  nudge_interval: updatedAgent.nudge_interval,
                  max_nudges: updatedAgent.max_nudges,
                  typing_volume: updatedAgent.typing_volume,
                  max_call_duration: updatedAgent.max_call_duration,
                  created_at: updatedAgent.created_at,
                  updated_at: updatedAgent.updated_at
                };
                
                // Update the selected agent with new configuration
                setSelectedAgent(transformedAgent);
                
                // Update configuration state with new values
                if (transformedAgent.initial_message) {
                  const modelConfigData = { firstMessage: transformedAgent.initial_message };
                  setModelConfig(modelConfigData);
                  console.log('🔄 Updated model config:', modelConfigData);
                }
                
                if (transformedAgent.tts_config) {
                  console.log('🔄 Updated voice config:', transformedAgent.tts_config);
                  setVoiceConfig(transformedAgent.tts_config);
                }
                
                if (transformedAgent.stt_config) {
                  console.log('🔄 Updated transcriber config:', transformedAgent.stt_config);
                  setTranscriberConfig(transformedAgent.stt_config);
                }
              } else {
                console.log('⚠️ Updated agent not found in agents list');
              }
            }
          } catch (error) {
            console.error('Error refreshing agent configuration:', error);
          }
        }, 500); // Wait 500ms for backend to process the update
      }
    } catch (error) {
      console.error('Error refreshing agent configuration:', error);
    }
  }, [fetchAgents, selectedAgent?.name]); // Only depend on agent name, not the entire object

  // Manual refresh function for agent configuration
  const refreshSelectedAgentConfig = useCallback(async () => {
    if (!selectedAgent) return;
    
    console.log('🔄 Manually refreshing selected agent configuration:', selectedAgent.name);
    
    try {
      const result = await agentConfigService.getAllAgents();
      if (result.success && result.data) {
        const updatedAgent = result.data.find((a: any) => a.name === selectedAgent.name);
        if (updatedAgent) {
          console.log('✅ Found updated agent, refreshing configuration:', updatedAgent);
          
          // Transform the agent data
          const transformedAgent: Agent = {
            id: updatedAgent.name || updatedAgent.id || `agent-${Date.now()}`,
            name: updatedAgent.name || 'Unnamed Agent',
            status: updatedAgent.status || 'draft',
            model: updatedAgent.model || 'Unknown Model',
            provider: updatedAgent.provider || 'Unknown Provider',
            cost: updatedAgent.cost || '~$0.10/min',
            latency: updatedAgent.latency || '~1000ms',
            avatar: '🤖',
            description: updatedAgent.description || 'AI Agent',
            organization_id: updatedAgent.organization_id,
            chatbot_api: updatedAgent.chatbot_api,
            chatbot_key: updatedAgent.chatbot_key,
            tts_config: updatedAgent.tts_config,
            stt_config: updatedAgent.stt_config,
            initial_message: updatedAgent.initial_message,
            nudge_text: updatedAgent.nudge_text,
            nudge_interval: updatedAgent.nudge_interval,
            max_nudges: updatedAgent.max_nudges,
            typing_volume: updatedAgent.typing_volume,
            max_call_duration: updatedAgent.max_call_duration,
            created_at: updatedAgent.created_at,
            updated_at: updatedAgent.updated_at
          };
          
          // Update the selected agent with new configuration
          setSelectedAgent(transformedAgent);
          
          // Update the agents list in the sidebar with the updated agent
          setAgents(prev => prev.map(agent => 
            agent.id === transformedAgent.id ? transformedAgent : agent
          ));
          
          // Update configuration state with new values
          if (transformedAgent.initial_message) {
            const modelConfigData = { firstMessage: transformedAgent.initial_message };
            setModelConfig(modelConfigData);
            console.log('🔄 Updated model config:', modelConfigData);
          }
          
          if (transformedAgent.tts_config) {
            console.log('🔄 Updated voice config:', transformedAgent.tts_config);
            setVoiceConfig(transformedAgent.tts_config);
          }
          
          if (transformedAgent.stt_config) {
            console.log('🔄 Updated transcriber config:', transformedAgent.stt_config);
            setTranscriberConfig(transformedAgent.stt_config);
          }
        }
      }
    } catch (error) {
      console.error('Error manually refreshing agent configuration:', error);
    }
  }, [selectedAgent?.name]);

  const configTabs = useMemo(() => [
    { id: 'model', label: 'Model', icon: Bot, color: 'from-blue-500 to-purple-600' },
    { id: 'voice', label: 'Voice', icon: Mic, color: 'from-green-500 to-teal-600' },
    { id: 'transcriber', label: 'Transcriber', icon: MessageSquare, color: 'from-orange-500 to-red-600' },
    { id: 'tools', label: 'Tools', icon: Wrench, color: 'from-gray-600 to-gray-800' },
    { id: 'phone', label: 'Phone', icon: PhoneIcon, color: 'from-green-500 to-emerald-600' },
    { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'from-orange-500 to-red-600' },
    { id: 'whatsapp', label: 'WhatsApp', icon: Globe, color: 'from-cyan-500 to-blue-600' },
  ], []);

  return (
    <div className="w-full max-w-full mx-auto p-2 sm:p-4 lg:p-6">
      <div className={`rounded-2xl border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 lg:p-8 border-b rounded-t-2xl ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' : 'border-gray-200/50 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h2 className={`text-2xl sm:text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  AI Agents
                </h2>
              </div>
              <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Craft and configure intelligent agents for organization: <span className="font-semibold text-green-600">{currentOrganizationId}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={fetchAgents}
                disabled={isLoadingAgents}
                className={`group relative px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                }`}
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${isLoadingAgents ? 'animate-spin' : ''}`} />
                <span className="font-semibold hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleCreateNewAgent}
                className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold">Create Agent</span>
              </button>
            </div>

            <button
              onClick={() => {}}
              className="group relative px-4 sm:px-5 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-sm sm:text-base">Create Agent</span>
            </button>

          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Sidebar - Agent List */}
          <div className={`w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-b from-gray-800/50 to-gray-900' : 'border-gray-200/50 bg-gradient-to-b from-gray-50/50 to-white'}`}>
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <div className="relative group">
                  <Search className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-green-400' : 'text-gray-400 group-focus-within:text-green-500'}`} />
                  <input
                    type="text"
                    placeholder="Search your agents..."
                    className={`w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {isLoadingAgents ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
                    <span className="ml-2 text-gray-500 text-sm sm:text-base">Loading agents...</span>
                  </div>
                ) : agentsError ? (
                  <div className="text-center py-8 text-red-500">
                    <p className="text-sm sm:text-base">{agentsError}</p>
                    <button onClick={fetchAgents} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      Retry
                    </button>
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className={`p-4 rounded-2xl inline-block mb-4 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                      <Bot className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </div>
                    <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No Agents Found</h4>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Create your first AI agent to get started!
                    </p>
                    <button
                      onClick={handleCreateNewAgent}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Create First Agent
                    </button>
                  </div>
                ) : (
                  agents.map((agent) => (
                  <div
                    key={agent.id}
                     onClick={() => {
                       setSelectedAgent(agent);
                       // Also refresh configuration when selecting an agent
                       if (agent.tts_config) {
                         setVoiceConfig(agent.tts_config);
                       }
                       if (agent.stt_config) {
                         setTranscriberConfig(agent.stt_config);
                       }
                     }}
                      className={`w-full p-3 sm:p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${
                      selectedAgent?.id === agent.id
                        ? isDarkMode 
                          ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-700/50 shadow-lg'
                          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg'
                        : isDarkMode
                          ? 'hover:bg-gray-800/80 border-2 border-transparent hover:border-gray-600 shadow-sm'
                          : 'hover:bg-white/80 border-2 border-transparent hover:border-gray-200 shadow-sm'
                    }`}
                  >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`text-xl sm:text-2xl p-2 rounded-lg ${
                          agent.status === 'active' 
                            ? isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                          : agent.status === 'draft' 
                            ? isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                          : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                          {agent.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-semibold truncate text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{agent.name}</h3>
                            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                              agent.status === 'active' 
                                ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                              : agent.status === 'draft' 
                                ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                              : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {agent.status}
                            </div>
                          </div>
                          <p className={`text-xs sm:text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{agent.description}</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{agent.provider} • {agent.model}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAgent(agent);
                            }}
                            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' 
                                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                            }`}
                            title="Edit Agent"
                          >
                            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAgent(agent);
                            }}
                            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'text-red-400 hover:text-red-300 hover:bg-gray-800' 
                                : 'text-red-500 hover:text-red-600 hover:bg-gray-100'
                            }`}
                            title="Delete Agent"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Agent Configuration */}
          <div className="flex-1 min-h-0">
            {selectedAgent ? (
              <>
                {/* Agent Header */}
                <div className={`p-4 sm:p-6 lg:p-8 border-b ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900' : 'border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <div className={`text-2xl sm:text-3xl p-3 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-r from-green-100 to-emerald-100'}`}>
                      {selectedAgent.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <input
                          type="text"
                          value={selectedAgent.name}
                          onChange={(e) => {
                            const updatedAgent = { ...selectedAgent, name: e.target.value };
                            setSelectedAgent(updatedAgent);
                            // Update the agent in the list
                            setAgents(prev => prev.map(agent => 
                              agent.id === selectedAgent.id ? updatedAgent : agent
                            ));
                          }}
                          className={`text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-transparent focus:border-green-500 focus:outline-none transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          placeholder="Enter agent name..."
                        />
                      </div>
                      <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedAgent.description}</p>
                      <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        ID: {selectedAgent.id} • Organization: {currentOrganizationId}
                      </p>
                    </div>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                          Editing
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <div className={`w-2 h-2 rounded-full ${selectedAgent.status === 'active' ? 'bg-green-500 animate-pulse' :
                      selectedAgent.status === 'draft' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                    <span className={`text-xs sm:text-sm font-medium capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedAgent.status}</span>
                    {selectedAgent.status === 'active' && (
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Configuration Tabs */}
                <div className={`border-b ${isDarkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200/50 bg-white'}`}>
                  {/* Desktop: Horizontal Tabs */}
                  <nav className="hidden sm:flex justify-start space-x-1 px-2 lg:px-8 py-2 overflow-x-auto no-scrollbar">
                    {configTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabClick(tab.id)}
                          className={`group relative px-3 lg:px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeConfigTab === tab.id
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                            : isDarkMode
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {tab.label}
                          {activeConfigTab === tab.id && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Mobile: Dropdown */}
                  <div className="sm:hidden px-4 py-2 dropdown-container">
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${activeConfigTab
                          ? `bg-gradient-to-r ${configTabs.find(tab => tab.id === activeConfigTab)?.color} text-white shadow-lg`
                          : isDarkMode
                            ? 'text-gray-400 bg-gray-800 border border-gray-600'
                            : 'text-gray-600 bg-white border border-gray-200'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {(() => {
                            const activeTab = configTabs.find(tab => tab.id === activeConfigTab);
                            const Icon = activeTab?.icon || Bot;
                            return <Icon className="h-4 w-4" />;
                          })()}
                          {configTabs.find(tab => tab.id === activeConfigTab)?.label || 'Select Tab'}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                          {configTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${activeConfigTab === tab.id
                                  ? isDarkMode
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                  : isDarkMode
                                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                              >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
                                {activeConfigTab === tab.id && (
                                  <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Configuration Content */}
                <div className={` ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900' : 'bg-gradient-to-br from-gray-50/30 to-white'} max-w-4xl mx-auto lg:max-w-none overflow-y-auto`}>
                  {activeConfigTab === 'model' && (
                    <ModelConfig 
                      ref={modelSectionRef} 
                      agentName={selectedAgent?.name || 'default'}
                      onConfigChange={handleModelConfigChange}
                      existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).modelConfig : null}
                      isEditing={isEditing}
                    />
                  )}

                  {activeConfigTab === 'voice' && (

                    <VoiceConfig 
                      ref={voiceSectionRef} 
                      agentName={selectedAgent?.name || 'default'}
                      onConfigChange={handleVoiceConfigChange}
                      existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).voiceConfig : null}
                      isEditing={isEditing}
                    />
                  )}

                  {activeConfigTab === 'transcriber' && (
                    <TranscriberConfig 
                      ref={transcriberSectionRef} 
                      agentName={selectedAgent?.name || 'default'}
                      onConfigChange={handleTranscriberConfigChange}
                      existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).transcriberConfig : null}
                      isEditing={isEditing}
                    />

                  )}

                  {activeConfigTab === 'tools' && (
                    <ToolsConfig 
                      ref={toolsSectionRef} 
                      agentName={selectedAgent?.name || 'default'}
                      onConfigChange={handleModelConfigChange}
                      existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).toolsConfig : null}
                      isEditing={isEditing}
                    />
                  )}

                  {activeConfigTab === 'phone' && (
                    <PhoneNumbersTab />
                  )}

                  {activeConfigTab === 'sms' && (
                    <SMSTab />
                  )}

                  {activeConfigTab === 'whatsapp' && (
                    <WhatsAppTab />
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block mb-4 sm:mb-6 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                  <Bot className={`h-8 w-8 sm:h-12 sm:w-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {agents.length === 0 ? 'Welcome to AI Agents!' : 'Select an Agent'}
                </h3>
                <p className={`mb-4 sm:mb-6 text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {agents.length === 0 
                    ? 'Create your first AI agent to start building intelligent conversational experiences.'
                    : 'Choose an agent from the sidebar to configure its settings'
                  }
                </p>
                {agents.length === 0 && (
                  <button
                    onClick={handleCreateNewAgent}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base"
                  >
                    Create Your First Agent
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Agent Prefix Modal */}
      {showAgentPrefixModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="text-center mb-6">
              <div className={`p-3 rounded-2xl inline-block mb-4 ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                <Bot className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create New Agent</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Enter a unique identifier for your new AI agent. This will be used as the agent's name and ID.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Agent Prefix (Agent ID/Name)
                </label>
                <input
                  type="text"
                  value={agentPrefix}
                  onChange={(e) => setAgentPrefix(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && agentPrefix.trim()) {
                      handleAgentPrefixSubmit();
                    }
                  }}
                  placeholder="e.g., customer_support, sales_agent, helpdesk"
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  autoFocus
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Use lowercase letters, numbers, and underscores only
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAgentPrefixModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 text-sm font-medium ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAgentPrefixSubmit}
                  disabled={!agentPrefix.trim()}
                  className={`flex-1 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                    agentPrefix.trim()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
