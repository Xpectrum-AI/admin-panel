'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SyncLoader } from "react-spinners";
import { getAllAgents, setAgentPhone, getAgentByPhone, deleteAgentPhone, updateAgent, fetchLivekitAgentIds, getAgentInfo } from '../../../service/agentService';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

interface Agent {
  agentId: string;
  chatbot_api: string;
  chatbot_key: string;
  tts_config: {
    voice_id: string;
    tts_api_key: string;
    model: string;
    speed: number;
  };
  stt_config: {
    api_key: string;
    model: string;
    language: string;
  };
  phone_number?: string;
  created_at: string;
  updated_at: string;
}



const AgentsPage = () => {
  const { showError, showSuccess } = useErrorHandler();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showDeletePhoneModal, setShowDeletePhoneModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState<Agent | null>(null);
  const [agentIdOptions, setAgentIdOptions] = useState<string[]>([]);
  const [voiceIdOptions, setVoiceIdOptions] = useState<string[]>([]);
  const [ttsModelOptions, setTtsModelOptions] = useState<string[]>([]);
  const [speedOptions, setSpeedOptions] = useState<number[]>([]);
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);

  // Form states
  const [addForm, setAddForm] = useState({
    agentId: '',
    chatbot_api: '',
    chatbot_key: '',
    tts_config: {
      voice_id: '',
      tts_api_key: '',
      model: '',
      speed: 0.5
    },
    stt_config: {
      api_key: '',
      model: '',
      language: ''
    }
  });

  const [phoneForm, setPhoneForm] = useState({
    phone_number: ''
  });

  const [updateForm, setUpdateForm] = useState({
    agentId: '',
    chatbot_api: '',
    chatbot_key: '',
    tts_config: {
      voice_id: '',
      tts_api_key: '',
      model: '',
      speed: 0.5
    },
    stt_config: {
      api_key: '',
      model: '',
      language: ''
    }
  });

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin-test.xpectrum-ai.com';
  const API_KEY = 'xpectrum-ai@123';

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  };

  // Add this helper to update form fields from agent data
  function fillFormFromAgent(agent: any, setForm: any) {
    setForm({
      agentId: agent.agentId || '',
      chatbot_api: agent.chatbot_api || '',
      chatbot_key: agent.chatbot_key || '',
      tts_config: {
        voice_id: agent.tts_config?.voice_id || '',
        tts_api_key: agent.tts_config?.tts_api_key || '',
        model: agent.tts_config?.model || '',
        speed: agent.tts_config?.speed ?? 0.5,
      },
      stt_config: {
        api_key: agent.stt_config?.api_key || '',
        model: agent.stt_config?.model || '',
        language: agent.stt_config?.language || '',
      },
    });
  }

  // Fetch all agents and extract unique dropdown options
  const fetchAgentsAndOptions = async () => {
    setLoading(true);
    try {
      const data = await getAllAgents();
      const agentsArray = Array.isArray(data.agents) ? data.agents : [];
      setAgents(agentsArray);
      setAgentIdOptions(agentsArray.map((a: Agent) => a.agentId));
      // Extract unique options for dropdowns from all agents
      setVoiceIdOptions(Array.from(new Set(agentsArray.map((a: Agent) => a.tts_config?.voice_id).filter((v: string | undefined): v is string => Boolean(v))) as Set<string>));
      setTtsModelOptions(Array.from(new Set(agentsArray.map((a: Agent) => a.tts_config?.model).filter((v: string | undefined): v is string => Boolean(v))) as Set<string>));
      setSpeedOptions(Array.from(new Set(agentsArray.map((a: Agent) => a.tts_config?.speed).filter((s: number | undefined | null): s is number => s !== undefined && s !== null)) as Set<number>));
      setLanguageOptions(Array.from(new Set(agentsArray.map((a: Agent) => a.stt_config?.language).filter((v: string | undefined): v is string => Boolean(v))) as Set<string>));
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch agents');
      setAgents([]);
      setAgentIdOptions([]);
      setVoiceIdOptions([]);
      setTtsModelOptions([]);
      setSpeedOptions([]);
      setLanguageOptions([]);
      showError(error.message || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all agents
  const fetchAgents = async () => {
    try {
      const data = await getAllAgents();
      // If API returns { agents: [...] }
      const agentsArray = Array.isArray(data.agents) ? data.agents : [];
      setAgents(agentsArray);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch agents');
      setAgents([]);
      showError(error.message || 'Failed to fetch agents');
    }
  };



  // Add new agent
  const handleAddAgent = async () => {
    if (!addForm.agentId.trim()) {
      showError('Agent ID is required');
      return;
    }
    try {
      const { agentId, ...rest } = addForm;
      const data = await updateAgent(agentId, rest);
      if (data.success) {
        setShowAddModal(false);
        setAddForm({
          agentId: '',
          chatbot_api: '',
          chatbot_key: '',
          tts_config: {
            voice_id: '',
            tts_api_key: '',
            model: '',
            speed: 0.5
          },
          stt_config: {
            api_key: '',
            model: '',
            language: ''
          }
        });
        fetchAgents();
        showSuccess('Agent added successfully to live system!');
      } else {
        showError(data.error || 'Failed to add agent to live system');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to add agent to live system');
    }
  };

  // Set phone number
  const handleSetPhone = async () => {
    try {
      const data = await setAgentPhone(selectedAgent, phoneForm.phone_number);
      if (data.success) {
        setShowPhoneModal(false);
        fetchAgents();
        showSuccess('Phone number set successfully in live system!');
      } else {
        showError(data.error || 'Failed to set phone number in live system');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to set phone number in live system');
    }
  };

  // Search by phone
  const handleSearchByPhone = async () => {
    if (!searchPhone) return;
    try {
      const data = await getAgentByPhone(searchPhone);
      if (data.success) {
        setSearchResult(data.agent);
      } else {
        setSearchResult(null);
        showError(data.error || 'No agent found');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to search agent');
    }
  };

  // Delete phone number
  const handleDeletePhone = async () => {
    try {
      const data = await deleteAgentPhone(selectedAgent);
      if (data.success) {
        setShowDeletePhoneModal(false);
        fetchAgents();
        showSuccess('Phone number deleted successfully from live system!');
      } else {
        showError(data.error || 'Failed to delete phone number from live system');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to delete phone number from live system');
    }
  };

  const handleUpdateAgent = async () => {
    if (!updateForm.agentId.trim()) {
      showError('Agent ID is required');
      return;
    }
    try {
      const { agentId, ...rest } = updateForm;
      const data = await updateAgent(agentId, rest);
      if (data.success) {
        setShowUpdateModal(false);
        fetchAgents();
        showSuccess('Agent updated successfully in live system!');
      } else {
        showError(data.error || 'Failed to update agent in live system');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to update agent in live system');
    }
  };

  // On mount, fetch all agents and options
  useEffect(() => {
    fetchAgentsAndOptions();
  }, []);

  // Fetch agent IDs when Add/Update modal is opened
  useEffect(() => {
    if (showAddModal || showUpdateModal) {
      fetchLivekitAgentIds().then(setAgentIdOptions).catch(() => setAgentIdOptions([]));
    }
  }, [showAddModal, showUpdateModal]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <SyncLoader size={15} color="#000000" />
      </div>
    );
  }

  // For phone number dropdown, get all phone numbers from agents except the current agent
  const phoneNumberOptions = agents
    .filter(a => a.agentId !== selectedAgent && a.phone_number)
    .map(a => ({ value: a.phone_number!, label: a.phone_number! }));

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 mb-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Management</h1>
        <p className="text-gray-600">Manage your AI agents and monitor system health</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6" role="alert">
          {error}
        </div>
      )}





      {/* Search Section */}
      <div className="bg-gray-100 rounded-lg border border-gray-200 mb-8 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Agent by Phone</h2>
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            placeholder="Enter phone number (e.g., +1234567890)"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
          />
          <button 
            onClick={handleSearchByPhone}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Search
          </button>
        </div>
        {searchResult && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <strong className="text-blue-800">Found Agent:</strong> 
            <span className="text-gray-900 ml-2">{searchResult.agentId}</span>
            {searchResult.phone_number && (
              <span className="text-gray-700 ml-2"> - Phone: {searchResult.phone_number}</span>
            )}
          </div>
        )}
      </div>

      {/* Agents Table */}
      <div className="bg-gray-100 rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All Agents</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Agent
          </button>
        </div>
        {!Array.isArray(agents) || agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg mb-4">No agents found</p>
            <p className="text-gray-500 mb-6">Create your first agent to get started</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Create First Agent
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTS Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.isArray(agents) && agents.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{agent.agentId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agent.phone_number ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {agent.phone_number}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not set
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{agent.tts_config?.model || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{agent.stt_config?.model || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {agent.updated_at ? new Date(agent.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent.agentId);
                          setPhoneForm({ phone_number: agent.phone_number || '' });
                          setShowPhoneModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 border border-blue-200 hover:border-blue-300 px-3 py-1 rounded text-xs transition-colors"
                      >
                        Set Phone
                      </button>
                      {agent.phone_number && (
                        <button
                          onClick={() => {
                            setSelectedAgent(agent.agentId);
                            setShowDeletePhoneModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 border border-red-200 hover:border-red-300 px-3 py-1 rounded text-xs transition-colors"
                        >
                          Delete Phone
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setUpdateForm({
                            agentId: agent.agentId,
                            chatbot_api: agent.chatbot_api,
                            chatbot_key: agent.chatbot_key,
                            tts_config: { ...agent.tts_config },
                            stt_config: { ...agent.stt_config }
                          });
                          setShowUpdateModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-900 border border-yellow-200 hover:border-yellow-300 px-3 py-1 rounded text-xs transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add New Agent</h3>
            </div>
            <div className="p-6">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent ID <span className="text-red-500">*</span></label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={addForm.agentId}
                    onChange={e => {
                      const agentId = e.target.value;
                      setAddForm(f => ({ ...f, agentId }));
                      const agent = agents.find(a => a.agentId === agentId);
                      if (agent) fillFormFromAgent(agent, setAddForm);
                    }}
                    required
                  >
                    <option value="">Select Agent ID</option>
                    {agentIdOptions.map(id => <option key={id} value={id}>{id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voice ID</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={addForm.tts_config.voice_id}
                    onChange={e => setAddForm({ ...addForm, tts_config: { ...addForm.tts_config, voice_id: e.target.value } })}
                  >
                    <option value="">Select Voice ID</option>
                    {voiceIdOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={addForm.tts_config.model}
                    onChange={e => setAddForm({ ...addForm, tts_config: { ...addForm.tts_config, model: e.target.value } })}
                  >
                    <option value="">Select Model</option>
                    {ttsModelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Speed</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={addForm.tts_config.speed}
                    onChange={e => setAddForm({ ...addForm, tts_config: { ...addForm.tts_config, speed: parseFloat(e.target.value) } })}
                  >
                    <option value="">Select Speed</option>
                    {speedOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={addForm.stt_config.language}
                    onChange={e => setAddForm({ ...addForm, stt_config: { ...addForm.stt_config, language: e.target.value } })}
                  >
                    <option value="">Select Language</option>
                    {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAgent}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Add Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Phone Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Set Phone Number: {selectedAgent}</h3>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={phoneForm.phone_number}
                  onChange={e => setPhoneForm({ phone_number: e.target.value })}
                >
                  <option value="">Select Phone Number</option>
                  {phoneNumberOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetPhone}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Set Phone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Agent Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Update Agent: {updateForm.agentId}</h3>
            </div>
            <div className="p-6">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent ID</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                    value={updateForm.agentId}
                    onChange={async e => {
                      const agentId = e.target.value;
                      setUpdateForm(f => ({ ...f, agentId }));
                      if (agentId) {
                        try {
                          const data = await getAgentInfo(agentId);
                          if (data.success && data.agent) {
                            fillFormFromAgent(data.agent, setUpdateForm);
                          }
                        } catch {}
                      }
                    }}
                    disabled
                  >
                    <option value="">Select Agent ID</option>
                    {agentIdOptions.map(id => <option key={id} value={id}>{id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voice ID</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={updateForm.tts_config.voice_id}
                    onChange={e => setUpdateForm({ ...updateForm, tts_config: { ...updateForm.tts_config, voice_id: e.target.value } })}
                  >
                    <option value="">Select Voice ID</option>
                    {voiceIdOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={updateForm.tts_config.model}
                    onChange={e => setUpdateForm({ ...updateForm, tts_config: { ...updateForm.tts_config, model: e.target.value } })}
                  >
                    <option value="">Select Model</option>
                    {ttsModelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Speed</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={updateForm.tts_config.speed}
                    onChange={e => setUpdateForm({ ...updateForm, tts_config: { ...updateForm.tts_config, speed: parseFloat(e.target.value) } })}
                  >
                    <option value="">Select Speed</option>
                    {speedOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={updateForm.stt_config.language}
                    onChange={e => setUpdateForm({ ...updateForm, stt_config: { ...updateForm.stt_config, language: e.target.value } })}
                  >
                    <option value="">Select Language</option>
                    {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAgent}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
              >
                Update Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Phone Modal */}
      {showDeletePhoneModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Delete Phone Number</h3>
              <p className="text-gray-700 mt-2">Are you sure you want to delete the phone number for agent <strong>{selectedAgent}</strong>?</p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeletePhoneModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePhone}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Delete Phone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage; 