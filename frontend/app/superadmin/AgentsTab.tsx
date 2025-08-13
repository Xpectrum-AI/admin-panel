import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, UserRound, Settings, Ban, RefreshCw } from 'lucide-react';
import ActionMenu from './ActionMenu';
import Pagination from './Pagination';
import { agentApiService } from '@/service/agentService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface AgentsTabProps {
  agents: any[];
  totalAgents: number;
  pageNumber: number;
  pageSize: number;
  setPageNumber: (n: number) => void;
  loading: boolean;
  refreshAgents: () => Promise<void>;
  orgs: { orgId: string; name: string }[];
  trunks: any[]; // Add trunks prop
}

export default function AgentsTab({ agents, totalAgents, pageNumber, pageSize, setPageNumber, loading, refreshAgents, orgs = [], trunks = [] }: AgentsTabProps) {
  const { showError, showSuccess } = useErrorHandler();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [addForm, setAddForm] = useState({
    agentId: '', chatbot_api: '', chatbot_key: '',
    tts_config: { 
      provider: 'openai',
      openai: { api_key: '', voice: 'alloy', response_format: 'mp3', quality: 'standard', speed: 1.0 },
      cartesian: { voice_id: '', tts_api_key: '', model: 'sonic-english', speed: 0, language: 'en' }
    },
    stt_config: { 
      provider: 'deepgram',
      deepgram: { api_key: '', model: 'nova-2', language: 'hi', punctuate: true, smart_format: true, interim_results: true },
      whisper: { api_key: '', model: 'whisper-1', language: null as string | null }
    },
    initial_message: '',
    nudge_text: '',
    nudge_interval: '',
    max_nudges: '',
    typing_volume: ''
  });
  const [updateForm, setUpdateForm] = useState({
    agentId: '', chatbot_api: '', chatbot_key: '',
    tts_config: { 
      provider: 'openai',
      openai: { api_key: '', voice: 'alloy', response_format: 'mp3', quality: 'standard', speed: 1.0 },
      cartesian: { voice_id: '', tts_api_key: '', model: 'sonic-english', speed: 0, language: 'en' }
    },
    stt_config: { 
      provider: 'deepgram',
      deepgram: { api_key: '', model: 'nova-2', language: 'hi', punctuate: true, smart_format: true, interim_results: true },
      whisper: { api_key: '', model: 'whisper-1', language: null as string | null }
    },
    initial_message: '',
    nudge_text: '',
    nudge_interval: '',
    max_nudges: '',
    typing_volume: ''
  });
  const [showSetPhoneModal, setShowSetPhoneModal] = useState(false);
  const [setPhoneForm, setSetPhoneForm] = useState({ agentId: '', phone_number: '' });

  // Add loading and error state
  const [modalLoading, setModalLoading] = useState(false);

  // Validation function for agent form
  function validateAgentForm(form: any) {
    const ttsProvider = form.tts_config.provider;
    const sttProvider = form.stt_config.provider;
    
    let ttsValid = false;
    let sttValid = false;
    
    // Validate TTS based on provider
    if (ttsProvider === 'openai') {
      ttsValid = form.tts_config.openai.api_key.trim() && 
                 form.tts_config.openai.voice.trim() &&
                 form.tts_config.openai.response_format.trim() &&
                 form.tts_config.openai.quality.trim() &&
                 form.tts_config.openai.speed !== undefined && form.tts_config.openai.speed !== null;
    } else if (ttsProvider === 'cartesian') {
      ttsValid = form.tts_config.cartesian.voice_id.trim() && 
                 form.tts_config.cartesian.tts_api_key.trim() &&
                 form.tts_config.cartesian.model.trim() &&
                 form.tts_config.cartesian.speed !== undefined && form.tts_config.cartesian.speed !== null &&
                 form.tts_config.cartesian.language.trim();
    }
    
    // Validate STT based on provider
    if (sttProvider === 'deepgram') {
      sttValid = form.stt_config.deepgram.api_key.trim() && 
                 form.stt_config.deepgram.model.trim() &&
                 form.stt_config.deepgram.language.trim();
    } else if (sttProvider === 'whisper') {
      sttValid = form.stt_config.whisper.api_key.trim() && 
                 form.stt_config.whisper.model.trim();
    }
    
    return (
      form.agentId.trim() &&
      form.chatbot_api.trim() &&
      form.chatbot_key.trim() &&
      ttsValid &&
      sttValid
    );
  }

  // Add Agent handler
  async function handleAddAgent(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    if (!validateAgentForm(addForm)) {
      showError('All fields are required.');
      setModalLoading(false);
      return;
    }
    try {
      if (!addForm.agentId.trim()) {
        showError('Agent ID is required');
        setModalLoading(false);
        return;
      }
      const { agentId, ...rest } = addForm;
      
      // Convert string values to numbers for numeric fields
      const processedData = {
        ...rest,
        nudge_interval: rest.nudge_interval ? parseInt(rest.nudge_interval) : undefined,
        max_nudges: rest.max_nudges ? parseInt(rest.max_nudges) : undefined,
        typing_volume: rest.typing_volume ? parseFloat(rest.typing_volume) : undefined
      };
      
      const data = await agentApiService.updateAgent(agentId, processedData);
      if (data.success) {
        setShowAddModal(false);
        await refreshAgents();
        showSuccess('Agent added successfully to live system!');
        // Reset form
        setAddForm({
          agentId: '', chatbot_api: '', chatbot_key: '',
          tts_config: { 
            provider: 'openai',
            openai: { api_key: '', voice: 'alloy', response_format: 'mp3', quality: 'standard', speed: 1.0 },
            cartesian: { voice_id: '', tts_api_key: '', model: 'sonic-english', speed: 0, language: 'en' }
          },
          stt_config: { 
            provider: 'deepgram',
            deepgram: { api_key: '', model: 'nova-2', language: 'hi', punctuate: true, smart_format: true, interim_results: true },
            whisper: { api_key: '', model: 'whisper-1', language: null }
          },
          initial_message: '',
          nudge_text: '',
          nudge_interval: '',
          max_nudges: '',
          typing_volume: ''
        });
      } else {
        showError(data.error || 'Failed to add agent');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to add agent to live system');
    } finally {
      setModalLoading(false);
    }
  }

  // Update Agent handler
  async function handleUpdateAgent(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    if (!validateAgentForm(updateForm)) {
      showError('All fields are required.');
      setModalLoading(false);
      return;
    }
    try {
      // Convert string values to numbers for numeric fields
      const processedData = {
        ...updateForm,
        nudge_interval: updateForm.nudge_interval ? parseInt(updateForm.nudge_interval) : undefined,
        max_nudges: updateForm.max_nudges ? parseInt(updateForm.max_nudges) : undefined,
        typing_volume: updateForm.typing_volume ? parseFloat(updateForm.typing_volume) : undefined
      };
      
      const data = await agentApiService.updateAgent(updateForm.agentId, processedData);
      if (data.success) {
        setShowUpdateModal(false);
        await refreshAgents();
        showSuccess('Agent updated successfully in live system!');
      } else {
        showError(data.error || 'Failed to update agent');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update agent');
    } finally {
      setModalLoading(false);
    }
  }

  // Set Phone handler
  async function handleSetPhone(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    
    // Validate phone number format
    const phoneNumber = setPhoneForm.phone_number.trim();
    if (!phoneNumber) {
      showError('Phone number is required');
      setModalLoading(false);
      return;
    }
    
    // Basic phone number validation (should start with + and have at least 10 digits)
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      showError('Please enter a valid phone number in international format (e.g., +1234567890)');
      setModalLoading(false);
      return;
    }
    
    try {
      const data = await agentApiService.setAgentPhone(setPhoneForm.agentId, { phone_number: phoneNumber });
      if (data.success) {
        setShowSetPhoneModal(false);
        await refreshAgents();
        showSuccess('Phone number set successfully in live system!');
        // Reset form
        setSetPhoneForm({ agentId: '', phone_number: '' });
      } else {
        showError(data.error || 'Failed to set phone number');
      }
    } catch (err: any) {
      console.error('Set phone error:', err);
      showError(err.message || 'Failed to set phone number. Please check the phone number format and try again.');
    } finally {
      setModalLoading(false);
    }
  }

  // Filter agents in-memory
  const filteredAgents = agents.filter(agent => {
    const searchLower = search.toLowerCase();
    return (
      (agent.agentId && agent.agentId.toLowerCase().includes(searchLower)) ||
      (agent.phone_number && agent.phone_number.toLowerCase().includes(searchLower)) ||
      (agent.orgName && agent.orgName.toLowerCase().includes(searchLower))
    );
  });

  // Pagination
  const pagedAgents = filteredAgents.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className='flex flex-col space-y-1.5 '>
        <div className='flex justify-between items-center'>
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Global Agent Management</h3>
          <div className='flex space-x-2'>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button 
              className="ml-2 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              onClick={refreshAgents}
              disabled={loading}
              title="Refresh agents"
            >
              <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              className="ml-2 p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100"
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/agent-data');
                  const data = await response.json();
          
                  alert('Check console for debug data');
                } catch (error) {
                  console.error('Debug error:', error);
                  alert('Debug failed - check console');
                }
              }}
              title="Debug agent data"
            >
              <Settings className="h-5 w-5 text-blue-500" />
            </button>
            <button className="ml-2 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
              <Filter className="h-5 w-5 text-gray-500" />
            </button>
            <button className="ml-2 px-4 py-2 flex justify-between items-center rounded-lg bg-gray-900 text-white hover:bg-gray-800 min-w-[140px]" onClick={() => setShowAddModal(true)}><Plus className='h-4 w-4' />Add Agent</button>
          </div>
        </div>
      </div>
      {/* Add Agent Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40"></div>
          <div className="fixed left-1/2 top-1/2 z-50 grid w-full translate-x-[-50%] translate-y-[-50%] max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-300 bg-white p-6 shadow-lg sm:rounded-lg" style={{ pointerEvents: 'auto' }}>
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Add New Agent</h2>
            </div>
            <form className="space-y-6" onSubmit={handleAddAgent}>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="agentId">Agent ID <span className="text-red-500">*</span></label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                  placeholder="Enter agent ID"
                  name="agentId"
                  id="agentId"
                  value={addForm.agentId}
                  onChange={e => setAddForm({ ...addForm, agentId: e.target.value })}
                  required
                />
              </div>
              <div className="rounded-lg border border-gray-300 bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">Chatbot Configuration</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="chatbotApi">Chatbot API</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                      name="chatbotApi"
                      id="chatbotApi"
                      value={addForm.chatbot_api}
                      onChange={e => setAddForm({ ...addForm, chatbot_api: e.target.value })}
                      placeholder="https://demo.xpectrum-ai.com/v1/chat-messages"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="chatbotKey">Chatbot Key</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                      name="chatbotKey"
                      id="chatbotKey"
                      value={addForm.chatbot_key}
                      onChange={e => setAddForm({ ...addForm, chatbot_key: e.target.value })}
                      placeholder="app-..."
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-300 bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">TTS Configuration</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  {/* TTS Provider Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="ttsProvider">TTS Provider</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                      name="ttsProvider"
                      id="ttsProvider"
                      value={addForm.tts_config.provider}
                      onChange={e => setAddForm({ ...addForm, tts_config: { ...addForm.tts_config, provider: e.target.value } })}
                      required
                    >
                      <option value="openai">OpenAI</option>
                      <option value="cartesian">Cartesian</option>
                    </select>
                  </div>

                  {/* OpenAI TTS Configuration */}
                  {addForm.tts_config.provider === 'openai' && (
                    <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="openaiApiKey">OpenAI API Key</label>
                      <input
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="openaiApiKey"
                            id="openaiApiKey"
                            value={addForm.tts_config.openai.api_key}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                openai: { ...addForm.tts_config.openai, api_key: e.target.value } 
                              } 
                            })}
                            placeholder="sk-..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="openaiVoice">Voice</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="openaiVoice"
                            id="openaiVoice"
                            value={addForm.tts_config.openai.voice}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                openai: { ...addForm.tts_config.openai, voice: e.target.value } 
                              } 
                            })}
                            required
                          >
                            <option value="alloy">Alloy</option>
                            <option value="echo">Echo</option>
                            <option value="fable">Fable</option>
                            <option value="onyx">Onyx</option>
                            <option value="nova">Nova</option>
                            <option value="shimmer">Shimmer</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="openaiResponseFormat">Response Format</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="openaiResponseFormat"
                            id="openaiResponseFormat"
                            value={addForm.tts_config.openai.response_format}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                openai: { ...addForm.tts_config.openai, response_format: e.target.value } 
                              } 
                            })}
                            required
                          >
                            <option value="mp3">MP3</option>
                            <option value="opus">Opus</option>
                            <option value="aac">AAC</option>
                            <option value="flac">FLAC</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="openaiQuality">Quality</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="openaiQuality"
                            id="openaiQuality"
                            value={addForm.tts_config.openai.quality}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                openai: { ...addForm.tts_config.openai, quality: e.target.value } 
                              } 
                            })}
                            required
                          >
                            <option value="standard">Standard</option>
                            <option value="hd">HD</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="openaiSpeed">Speed</label>
                      <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="2.0"
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="openaiSpeed"
                            id="openaiSpeed"
                            value={addForm.tts_config.openai.speed}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                openai: { ...addForm.tts_config.openai, speed: parseFloat(e.target.value) } 
                              } 
                            })}
                            placeholder="1.0"
                        required
                      />
                    </div>
                  </div>
                    </>
                  )}

                  {/* Cartesian TTS Configuration */}
                  {addForm.tts_config.provider === 'cartesian' && (
                    <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="cartesianVoiceId">Voice ID</label>
                          <input
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="cartesianVoiceId"
                            id="cartesianVoiceId"
                            value={addForm.tts_config.cartesian.voice_id}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                cartesian: { ...addForm.tts_config.cartesian, voice_id: e.target.value } 
                              } 
                            })}
                            placeholder="Voice ID"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="cartesianApiKey">Cartesian API Key</label>
                          <input
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="cartesianApiKey"
                            id="cartesianApiKey"
                            value={addForm.tts_config.cartesian.tts_api_key}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                cartesian: { ...addForm.tts_config.cartesian, tts_api_key: e.target.value } 
                              } 
                            })}
                            placeholder="API Key"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="cartesianModel">Model</label>
                      <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="cartesianModel"
                            id="cartesianModel"
                            value={addForm.tts_config.cartesian.model}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                cartesian: { ...addForm.tts_config.cartesian, model: e.target.value } 
                              } 
                            })}
                        required
                      >
                            <option value="sonic-english">Sonic English</option>
                            <option value="sonic-hindi">Sonic Hindi</option>
                            <option value="sonic-spanish">Sonic Spanish</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="cartesianSpeed">Speed</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="2.0"
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="cartesianSpeed"
                            id="cartesianSpeed"
                            value={addForm.tts_config.cartesian.speed}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                cartesian: { ...addForm.tts_config.cartesian, speed: parseFloat(e.target.value) } 
                              } 
                            })}
                            placeholder="0"
                        required
                      />
                  </div>
                  <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="cartesianLanguage">Language</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="cartesianLanguage"
                            id="cartesianLanguage"
                            value={addForm.tts_config.cartesian.language}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              tts_config: { 
                                ...addForm.tts_config, 
                                cartesian: { ...addForm.tts_config.cartesian, language: e.target.value } 
                              } 
                            })}
                      required
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg border border-gray-300 bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">STT Configuration</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  {/* STT Provider Selection */}
                    <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="sttProvider">STT Provider</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                      name="sttProvider"
                      id="sttProvider"
                      value={addForm.stt_config.provider}
                      onChange={e => setAddForm({ ...addForm, stt_config: { ...addForm.stt_config, provider: e.target.value } })}
                      required
                    >
                      <option value="deepgram">Deepgram</option>
                      <option value="whisper">Whisper</option>
                    </select>
                  </div>

                  {/* Deepgram STT Configuration */}
                  {addForm.stt_config.provider === 'deepgram' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="deepgramApiKey">Deepgram API Key</label>
                      <input
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="deepgramApiKey"
                            id="deepgramApiKey"
                            value={addForm.stt_config.deepgram.api_key}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                deepgram: { ...addForm.stt_config.deepgram, api_key: e.target.value } 
                              } 
                            })}
                        placeholder="API Key"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="deepgramModel">Model</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="deepgramModel"
                            id="deepgramModel"
                            value={addForm.stt_config.deepgram.model}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                deepgram: { ...addForm.stt_config.deepgram, model: e.target.value } 
                              } 
                            })}
                        required
                      >
                            <option value="nova-2">Nova-2</option>
                            <option value="nova-3">Nova-3</option>
                            <option value="enhanced">Enhanced</option>
                      </select>
                    </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="deepgramLanguage">Language</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="deepgramLanguage"
                            id="deepgramLanguage"
                            value={addForm.stt_config.deepgram.language}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                deepgram: { ...addForm.stt_config.deepgram, language: e.target.value } 
                              } 
                            })}
                        required
                      >
                            <option value="hi">Hindi</option>
                            <option value="hi-IN">Hindi (India)</option>
                            <option value="en-US">English (US)</option>
                            <option value="en-GB">English (UK)</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                      </select>
                    </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="deepgramPunctuate">Punctuate</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="deepgramPunctuate"
                            id="deepgramPunctuate"
                            value={addForm.stt_config.deepgram.punctuate.toString()}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                deepgram: { ...addForm.stt_config.deepgram, punctuate: e.target.value === 'true' } 
                              } 
                            })}
                            required
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                  </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="deepgramSmartFormat">Smart Format</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="deepgramSmartFormat"
                            id="deepgramSmartFormat"
                            value={addForm.stt_config.deepgram.smart_format.toString()}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                deepgram: { ...addForm.stt_config.deepgram, smart_format: e.target.value === 'true' } 
                              } 
                            })}
                            required
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="deepgramInterimResults">Interim Results</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="deepgramInterimResults"
                            id="deepgramInterimResults"
                            value={addForm.stt_config.deepgram.interim_results.toString()}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                deepgram: { ...addForm.stt_config.deepgram, interim_results: e.target.value === 'true' } 
                              } 
                            })}
                            required
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Whisper STT Configuration */}
                  {addForm.stt_config.provider === 'whisper' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="whisperApiKey">Whisper API Key</label>
                          <input
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="whisperApiKey"
                            id="whisperApiKey"
                            value={addForm.stt_config.whisper.api_key}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                whisper: { ...addForm.stt_config.whisper, api_key: e.target.value } 
                              } 
                            })}
                            placeholder="sk-..."
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="whisperModel">Model</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="whisperModel"
                            id="whisperModel"
                            value={addForm.stt_config.whisper.model}
                            onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                whisper: { ...addForm.stt_config.whisper, model: e.target.value } 
                              } 
                            })}
                            required
                          >
                            <option value="whisper-1">Whisper-1</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none" htmlFor="whisperLanguage">Language (Optional)</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                          name="whisperLanguage"
                          id="whisperLanguage"
                          value={addForm.stt_config.whisper.language || ''}
                                                      onChange={e => setAddForm({ 
                              ...addForm, 
                              stt_config: { 
                                ...addForm.stt_config, 
                                whisper: { ...addForm.stt_config.whisper, language: e.target.value === '' ? null : e.target.value } 
                              } 
                            })}
                        >
                          <option value="">Auto-detect</option>
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="initialMessage">Initial Message</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                  name="initialMessage"
                  id="initialMessage"
                  value={addForm.initial_message}
                  onChange={e => setAddForm({ ...addForm, initial_message: e.target.value })}
                  placeholder="Hello! How can I help you today?"
                />
              </div>
              
              <div className="rounded-lg border border-gray-300 bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">Agent Behavior Configuration</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="nudgeText">Nudge Text</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                      name="nudgeText"
                      id="nudgeText"
                      value={addForm.nudge_text}
                      onChange={e => setAddForm({ ...addForm, nudge_text: e.target.value })}
                      placeholder="Hello? Are you still there?"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none" htmlFor="nudgeInterval">Nudge Interval (seconds)</label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                        name="nudgeInterval"
                        id="nudgeInterval"
                        value={addForm.nudge_interval}
                        onChange={e => setAddForm({ ...addForm, nudge_interval: e.target.value })}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none" htmlFor="maxNudges">Max Nudges</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                        name="maxNudges"
                        id="maxNudges"
                        value={addForm.max_nudges}
                        onChange={e => setAddForm({ ...addForm, max_nudges: e.target.value })}
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none" htmlFor="typingVolume">Typing Volume</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                        name="typingVolume"
                        id="typingVolume"
                        value={addForm.typing_volume}
                        onChange={e => setAddForm({ ...addForm, typing_volume: e.target.value })}
                        placeholder="0.8"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 bg-black text-white whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
            <button type="button" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => setShowAddModal(false)}>
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
          </div>
        </>
      )}
      {/* Update Agent Modal: use the same structure, but Agent ID is disabled and has a not-allowed cursor */}
      {showUpdateModal && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40"></div>
          <div className="fixed left-1/2 top-1/2 z-50 grid w-full translate-x-[-50%] translate-y-[-50%] max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-300 bg-white p-6 shadow-lg sm:rounded-lg" style={{ pointerEvents: 'auto' }}>
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Update Agent: {updateForm.agentId}</h2>
            </div>
            <form className="space-y-6" onSubmit={handleUpdateAgent}>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="updateAgentId">Agent ID</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-100 text-gray-500 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                  name="updateAgentId"
                  id="updateAgentId"
                  value={updateForm.agentId}
                  disabled
                />
              </div>
              <div className="rounded-lg border border-gray-300 bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">Chatbot Configuration</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="updateChatbotApi">Chatbot API</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                      name="updateChatbotApi"
                      id="updateChatbotApi"
                      value={updateForm.chatbot_api}
                      onChange={e => setUpdateForm({ ...updateForm, chatbot_api: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="updateChatbotKey">Chatbot Key</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                      name="updateChatbotKey"
                      id="updateChatbotKey"
                      value={updateForm.chatbot_key}
                      onChange={e => setUpdateForm({ ...updateForm, chatbot_key: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-300 bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">TTS Configuration</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  {/* TTS Provider Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="updateTtsProvider">TTS Provider</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                      name="updateTtsProvider"
                      id="updateTtsProvider"
                      value={updateForm.tts_config.provider}
                      onChange={e => setUpdateForm({ ...updateForm, tts_config: { ...updateForm.tts_config, provider: e.target.value } })}
                      required
                    >
                      <option value="openai">OpenAI</option>
                      <option value="cartesian">Cartesian</option>
                    </select>
                  </div>

                  {/* OpenAI TTS Configuration */}
                  {updateForm.tts_config.provider === 'openai' && (
                    <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateOpenaiApiKey">OpenAI API Key</label>
                      <input
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="updateOpenaiApiKey"
                            id="updateOpenaiApiKey"
                            value={updateForm.tts_config.openai.api_key}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                openai: { ...updateForm.tts_config.openai, api_key: e.target.value } 
                              } 
                            })}
                            placeholder="sk-..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateOpenaiVoice">Voice</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateOpenaiVoice"
                            id="updateOpenaiVoice"
                            value={updateForm.tts_config.openai.voice}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                openai: { ...updateForm.tts_config.openai, voice: e.target.value } 
                              } 
                            })}
                            required
                          >
                            <option value="alloy">Alloy</option>
                            <option value="echo">Echo</option>
                            <option value="fable">Fable</option>
                            <option value="onyx">Onyx</option>
                            <option value="nova">Nova</option>
                            <option value="shimmer">Shimmer</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateOpenaiResponseFormat">Response Format</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateOpenaiResponseFormat"
                            id="updateOpenaiResponseFormat"
                            value={updateForm.tts_config.openai.response_format}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                openai: { ...updateForm.tts_config.openai, response_format: e.target.value } 
                              } 
                            })}
                            required
                          >
                            <option value="mp3">MP3</option>
                            <option value="opus">Opus</option>
                            <option value="aac">AAC</option>
                            <option value="flac">FLAC</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateOpenaiQuality">Quality</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateOpenaiQuality"
                            id="updateOpenaiQuality"
                            value={updateForm.tts_config.openai.quality}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                openai: { ...updateForm.tts_config.openai, quality: e.target.value } 
                              } 
                            })}
                            required
                          >
                            <option value="standard">Standard</option>
                            <option value="hd">HD</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateOpenaiSpeed">Speed</label>
                      <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="2.0"
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="updateOpenaiSpeed"
                            id="updateOpenaiSpeed"
                            value={updateForm.tts_config.openai.speed}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                openai: { ...updateForm.tts_config.openai, speed: parseFloat(e.target.value) } 
                              } 
                            })}
                            placeholder="1.0"
                        required
                      />
                    </div>
                  </div>
                    </>
                  )}

                  {/* Cartesian TTS Configuration */}
                  {updateForm.tts_config.provider === 'cartesian' && (
                    <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateCartesianVoiceId">Voice ID</label>
                          <input
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="updateCartesianVoiceId"
                            id="updateCartesianVoiceId"
                            value={updateForm.tts_config.cartesian.voice_id}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                cartesian: { ...updateForm.tts_config.cartesian, voice_id: e.target.value } 
                              } 
                            })}
                            placeholder="Voice ID"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateCartesianApiKey">Cartesian API Key</label>
                          <input
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="updateCartesianApiKey"
                            id="updateCartesianApiKey"
                            value={updateForm.tts_config.cartesian.tts_api_key}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                cartesian: { ...updateForm.tts_config.cartesian, tts_api_key: e.target.value } 
                              } 
                            })}
                            placeholder="API Key"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateCartesianModel">Model</label>
                      <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateCartesianModel"
                            id="updateCartesianModel"
                            value={updateForm.tts_config.cartesian.model}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                cartesian: { ...updateForm.tts_config.cartesian, model: e.target.value } 
                              } 
                            })}
                        required
                      >
                            <option value="sonic-english">Sonic English</option>
                            <option value="sonic-hindi">Sonic Hindi</option>
                            <option value="sonic-spanish">Sonic Spanish</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateCartesianSpeed">Speed</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="2.0"
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="updateCartesianSpeed"
                            id="updateCartesianSpeed"
                            value={updateForm.tts_config.cartesian.speed}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                cartesian: { ...updateForm.tts_config.cartesian, speed: parseFloat(e.target.value) } 
                              } 
                            })}
                            placeholder="0"
                        required
                      />
                  </div>
                  <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateCartesianLanguage">Language</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateCartesianLanguage"
                            id="updateCartesianLanguage"
                            value={updateForm.tts_config.cartesian.language}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              tts_config: { 
                                ...updateForm.tts_config, 
                                cartesian: { ...updateForm.tts_config.cartesian, language: e.target.value } 
                              } 
                            })}
                      required
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg border border-gray-300 bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">STT Configuration</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  {/* STT Provider Selection */}
                    <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="updateSttProvider">STT Provider</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                      name="updateSttProvider"
                      id="updateSttProvider"
                      value={updateForm.stt_config.provider}
                      onChange={e => setUpdateForm({ ...updateForm, stt_config: { ...updateForm.stt_config, provider: e.target.value } })}
                      required
                    >
                      <option value="deepgram">Deepgram</option>
                      <option value="whisper">Whisper</option>
                    </select>
                  </div>

                  {/* Deepgram STT Configuration */}
                  {updateForm.stt_config.provider === 'deepgram' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateDeepgramApiKey">Deepgram API Key</label>
                      <input
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="updateDeepgramApiKey"
                            id="updateDeepgramApiKey"
                            value={updateForm.stt_config.deepgram.api_key}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              stt_config: { 
                                ...updateForm.stt_config, 
                                deepgram: { ...updateForm.stt_config.deepgram, api_key: e.target.value } 
                              } 
                            })}
                            placeholder="API Key"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateDeepgramModel">Model</label>
                      <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateDeepgramModel"
                            id="updateDeepgramModel"
                            value={updateForm.stt_config.deepgram.model}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              stt_config: { 
                                ...updateForm.stt_config, 
                                deepgram: { ...updateForm.stt_config.deepgram, model: e.target.value } 
                              } 
                            })}
                        required
                      >
                            <option value="nova-2">Nova-2</option>
                            <option value="nova-3">Nova-3</option>
                            <option value="enhanced">Enhanced</option>
                      </select>
                    </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateDeepgramLanguage">Language</label>
                      <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateDeepgramLanguage"
                            id="updateDeepgramLanguage"
                            value={updateForm.stt_config.deepgram.language}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              stt_config: { 
                                ...updateForm.stt_config, 
                                deepgram: { ...updateForm.stt_config.deepgram, language: e.target.value } 
                              } 
                            })}
                        required
                      >
                            <option value="hi">Hindi</option>
                            <option value="hi-IN">Hindi (India)</option>
                            <option value="en-US">English (US)</option>
                            <option value="en-GB">English (UK)</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                      </select>
                    </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateDeepgramPunctuate">Punctuate</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateDeepgramPunctuate"
                            id="updateDeepgramPunctuate"
                            value={updateForm.stt_config.deepgram.punctuate.toString()}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              stt_config: { 
                                ...updateForm.stt_config, 
                                deepgram: { ...updateForm.stt_config.deepgram, punctuate: e.target.value === 'true' } 
                              } 
                            })}
                            required
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                  </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateDeepgramSmartFormat">Smart Format</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateDeepgramSmartFormat"
                            id="updateDeepgramSmartFormat"
                            value={updateForm.stt_config.deepgram.smart_format.toString()}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              stt_config: { 
                                ...updateForm.stt_config, 
                                deepgram: { ...updateForm.stt_config.deepgram, smart_format: e.target.value === 'true' } 
                              } 
                            })}
                            required
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateDeepgramInterimResults">Interim Results</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateDeepgramInterimResults"
                            id="updateDeepgramInterimResults"
                            value={updateForm.stt_config.deepgram.interim_results.toString()}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              stt_config: { 
                                ...updateForm.stt_config, 
                                deepgram: { ...updateForm.stt_config.deepgram, interim_results: e.target.value === 'true' } 
                              } 
                            })}
                            required
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Whisper STT Configuration */}
                  {updateForm.stt_config.provider === 'whisper' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateWhisperApiKey">Whisper API Key</label>
                          <input
                            className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                            name="updateWhisperApiKey"
                            id="updateWhisperApiKey"
                            value={updateForm.stt_config.whisper.api_key}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              stt_config: { 
                                ...updateForm.stt_config, 
                                whisper: { ...updateForm.stt_config.whisper, api_key: e.target.value } 
                              } 
                            })}
                            placeholder="sk-..."
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none" htmlFor="updateWhisperModel">Model</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                            name="updateWhisperModel"
                            id="updateWhisperModel"
                            value={updateForm.stt_config.whisper.model}
                            onChange={e => setUpdateForm({ 
                              ...updateForm, 
                              stt_config: { 
                                ...updateForm.stt_config, 
                                whisper: { ...updateForm.stt_config.whisper, model: e.target.value } 
                              } 
                            })}
                            required
                          >
                            <option value="whisper-1">Whisper-1</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none" htmlFor="updateWhisperLanguage">Language (Optional)</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus:bg-gray-50 md:text-sm"
                          name="updateWhisperLanguage"
                          id="updateWhisperLanguage"
                          value={updateForm.stt_config.whisper.language || ''}
                          onChange={e => setUpdateForm({ 
                            ...updateForm, 
                            stt_config: { 
                              ...updateForm.stt_config, 
                              whisper: { ...updateForm.stt_config.whisper, language: e.target.value === '' ? null : e.target.value } 
                            } 
                          })}
                        >
                          <option value="">Auto-detect</option>
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="initialMessage">Initial Message</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                  name="initialMessage"
                  id="initialMessage"
                  value={updateForm.initial_message}
                  onChange={e => setUpdateForm({ ...updateForm, initial_message: e.target.value })}
                  placeholder="Hello! How can I help you today?"
                />
              </div>
              
              <div className="rounded-lg border border-gray-300 bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">Agent Behavior Configuration</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="updateNudgeText">Nudge Text</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                      name="updateNudgeText"
                      id="updateNudgeText"
                      value={updateForm.nudge_text}
                      onChange={e => setUpdateForm({ ...updateForm, nudge_text: e.target.value })}
                      placeholder="Hello? Are you still there?"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none" htmlFor="updateNudgeInterval">Nudge Interval (seconds)</label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                        name="updateNudgeInterval"
                        id="updateNudgeInterval"
                        value={updateForm.nudge_interval}
                        onChange={e => setUpdateForm({ ...updateForm, nudge_interval: e.target.value })}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none" htmlFor="updateMaxNudges">Max Nudges</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                        name="updateMaxNudges"
                        id="updateMaxNudges"
                        value={updateForm.max_nudges}
                        onChange={e => setUpdateForm({ ...updateForm, max_nudges: e.target.value })}
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none" htmlFor="updateTypingVolume">Typing Volume</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                        name="updateTypingVolume"
                        id="updateTypingVolume"
                        value={updateForm.typing_volume}
                        onChange={e => setUpdateForm({ ...updateForm, typing_volume: e.target.value })}
                        placeholder="0.8"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" onClick={() => setShowUpdateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 bg-black text-white whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2" disabled={modalLoading}>
                  {modalLoading ? 'Updating...' : 'Update Agent'}
                </button>
              </div>
            </form>
            <button type="button" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => setShowUpdateModal(false)}>
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
          </div>
        </>
      )}
      {/* Set Phone Modal */}
      {showSetPhoneModal && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40"></div>
          <div className="fixed left-1/2 top-1/2 z-50 grid w-full translate-x-[-50%] translate-y-[-50%] max-w-md max-h-[90vh] overflow-y-auto border border-gray-300 bg-white p-6 shadow-lg sm:rounded-lg" style={{ pointerEvents: 'auto' }}>
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Set Phone Number</h2>
              <p className="text-sm text-gray-500">Update phone number for agent</p>
            </div>
            <form className="space-y-6" onSubmit={handleSetPhone}>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="setPhoneAgentId">Agent ID</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-100 text-gray-500 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                  name="setPhoneAgentId"
                  id="setPhoneAgentId"
                  value={setPhoneForm.agentId}
                  disabled
                />
              </div>
              
              {/* Show current phone number if exists */}
              {(() => {
                const agent = agents.find(a => a.agentId === setPhoneForm.agentId);
                const currentPhone = agent?.phone_number;
                const trunk = trunks.find(t => t.name === setPhoneForm.agentId || t.name === agent?.id);
                const trunkPhone = trunk?.numbers?.[0];
                
                if (currentPhone || trunkPhone) {
                  return (
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Current Phone Number</label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-600">
                          {currentPhone ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {currentPhone} (Direct)
                            </span>
                          ) : trunkPhone ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {trunkPhone} (Trunk)
                            </span>
                          ) : 'Not set'}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="setPhoneNumber">New Phone Number</label>
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                  name="setPhoneNumber"
                  id="setPhoneNumber"
                  value={setPhoneForm.phone_number}
                  onChange={e => setSetPhoneForm({ ...setPhoneForm, phone_number: e.target.value })}
                  placeholder="Enter new phone number (e.g., +1234567890)"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" onClick={() => setShowSetPhoneModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 bg-black text-white whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
            <button type="button" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => setShowSetPhoneModal(false)}>
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
          </div>
        </>
      )}
      <div className="mt-6">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading...</div>
        ) : filteredAgents.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No agents found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-gray-500 text-base">
                  <th className="py-3 px-4 text-left font-semibold">Agent ID</th>
                  <th className="py-3 px-4 text-left font-semibold">Phone Number</th>
                  <th className="py-3 px-4 text-left font-semibold">Organization</th>
                  <th className="py-3 px-4 text-left font-semibold">TTS Model</th>
                  <th className="py-3 px-4 text-left font-semibold">STT Model</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Last Updated</th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedAgents.map((agent) => {
                  // Status badge logic
                  let status = agent.status || 'Active';
                  let statusClass =
                    status === 'Active'
                      ? 'bg-gray-900 text-white'
                      : status === 'Suspended'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-700';
                  return (
                    <tr key={agent.agentId} className="bg-white rounded-xl shadow-sm">
                      <td className="py-4 px-4 font-bold text-gray-900">{agent.agentId}</td>
                            <td className="py-4 px-4">
        {(() => {
          // Debug logging
          
          
          // First check if agent has a phone number directly
          if (agent.phone_number) {

            return (
              <span className="text-sm font-medium text-green-700">
                {agent.phone_number}
              </span>
            );
          }
          
          // Try to find trunk by agent name/id - check multiple possible matches
          const trunk = trunks.find(t => 
            t.name === agent.agentId || 
            t.name === agent.id || 
            t.name === agent.name ||
            t.name === agent.agentName ||
            agent.agentId?.includes(t.name) ||
            agent.id?.includes(t.name) ||
            agent.name?.includes(t.name)
          );
          
          
          if (trunk && trunk.numbers && trunk.numbers.length > 0) {
            return (
              <span className="text-sm font-medium text-blue-700">
                {trunk.numbers[0]}
              </span>
            );
          }
          

          return (
            <span className="text-sm text-gray-500">
              Not set
            </span>
          );
        })()}
      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {(() => {
                          
                          const org = orgs.find(o => o.orgId === agent.agentId);
                          return org ? org.name : '-';
                        })()}
                      </td>
                      <td className="py-4 px-4 text-gray-700">{agent.tts_config?.model || '-'}</td>
                      <td className="py-4 px-4 text-gray-700">{agent.stt_config?.model || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold ${statusClass}`}>{status}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">{agent.updated_at ? new Date(agent.updated_at).toLocaleString() : 'N/A'}</td>
                      <td className="py-4 px-4">
                        <ActionMenu
                          actions={[
                            {
                              label: 'Set Phone',
                              icon: <UserRound className="w-5 h-5" />,
                              onClick: () => {
                                // Get current phone number from agent or trunk
                                const currentPhone = agent.phone_number;
                                const trunk = trunks.find(t => t.name === agent.agentId || t.name === agent.id);
                                const trunkPhone = trunk?.numbers?.[0];
                                
                                setSetPhoneForm({ 
                                  agentId: agent.agentId, 
                                  phone_number: currentPhone || trunkPhone || '' 
                                });
                                setShowSetPhoneModal(true);
                              },
                            },
                            {
                              label: 'Delete Phone',
                              icon: <UserRound className="w-5 h-5 text-red-500" />,
                              onClick: async () => {
                                try {
                                  await agentApiService.deleteAgentPhone(agent.agentId);
                                  // Optionally refresh agent data or show a success message
                                  if (typeof refreshAgents === 'function') refreshAgents();
                                  if (typeof showSuccess === 'function') showSuccess('Phone number deleted');
                                } catch (err) {
                                  if (typeof showError === 'function') showError('Failed to delete phone number');
                                }
                              },
                              danger: true,
                            },
                            {
                              label: 'Update Agent',
                              icon: <Settings className="w-5 h-5" />,
                              onClick: () => {
                                setUpdateForm({
                                  agentId: agent.agentId,
                                  chatbot_api: agent.chatbot_api || '',
                                  chatbot_key: agent.chatbot_key || '',
                                  tts_config: {
                                    provider: agent.tts_config?.provider || 'openai',
                                    openai: {
                                      api_key: agent.tts_config?.openai?.api_key || '',
                                      voice: agent.tts_config?.openai?.voice || 'alloy',
                                      response_format: agent.tts_config?.openai?.response_format || 'mp3',
                                      quality: agent.tts_config?.openai?.quality || 'standard',
                                      speed: agent.tts_config?.openai?.speed ?? 1.0,
                                    },
                                    cartesian: {
                                      voice_id: agent.tts_config?.cartesian?.voice_id || '',
                                      tts_api_key: agent.tts_config?.cartesian?.tts_api_key || '',
                                      model: agent.tts_config?.cartesian?.model || 'sonic-english',
                                      speed: agent.tts_config?.cartesian?.speed ?? 0,
                                      language: agent.tts_config?.cartesian?.language || 'en',
                                    },
                                  },
                                  stt_config: {
                                    provider: agent.stt_config?.provider || 'deepgram',
                                    deepgram: {
                                      api_key: agent.stt_config?.deepgram?.api_key || '',
                                      model: agent.stt_config?.deepgram?.model || 'nova-2',
                                      language: agent.stt_config?.deepgram?.language || 'hi',
                                      punctuate: agent.stt_config?.deepgram?.punctuate ?? true,
                                      smart_format: agent.stt_config?.deepgram?.smart_format ?? true,
                                      interim_results: agent.stt_config?.deepgram?.interim_results ?? true,
                                    },
                                    whisper: {
                                      api_key: agent.stt_config?.whisper?.api_key || '',
                                      model: agent.stt_config?.whisper?.model || 'whisper-1',
                                      language: agent.stt_config?.whisper?.language || null,
                                    },
                                  },
                                  initial_message: agent.initial_message || '',
                                  nudge_text: agent.nudge_text || '',
                                  nudge_interval: agent.nudge_interval || '',
                                  max_nudges: agent.max_nudges || '',
                                  typing_volume: agent.typing_volume || ''
                                });
                                setShowUpdateModal(true);
                              },
                            },
                            {
                              label: 'Suspend',
                              icon: <Ban className="w-5 h-5" />,
                              onClick: async () => {
                                try {
                                  await agentApiService.deleteAgent(agent.agentId);
                                  if (typeof refreshAgents === 'function') refreshAgents();
                                  if (typeof showSuccess === 'function') showSuccess('Agent suspended (deleted) successfully');
                                } catch (err) {
                                  if (typeof showError === 'function') showError('Failed to suspend (delete) agent');
                                }
                              },
                              danger: true,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalResults={filteredAgents.length}
              onPageChange={setPageNumber}
            />
          </div>
        )}
      </div>
    </div>
  );
} 