'use client';

import React, { useState, useEffect } from 'react';

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

interface HealthStatus {
  status: string;
  total_agents: number;
  agents_with_phone: number;
  agents_without_phone: number;
  timestamp: string;
}

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState<Agent | null>(null);

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

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const API_KEY = 'xpectrum-ai@123';

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  };

  // Fetch all agents
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/all`, { headers });
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      } else {
        setError(data.error || 'Failed to fetch agents');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  // Fetch health status
  const fetchHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/health`, { headers });
      const data = await response.json();
      if (data.success) {
        setHealth(data.health);
      }
    } catch (err) {
      console.error('Failed to fetch health status:', err);
    }
  };

  // Fetch active calls
  const fetchActiveCalls = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/active-calls`, { headers });
      const data = await response.json();
      if (data.success) {
        setActiveCalls(data.active_calls);
      }
    } catch (err) {
      console.error('Failed to fetch active calls:', err);
    }
  };

  // Add new agent
  const handleAddAgent = async () => {
    if (!addForm.agentId.trim()) {
      alert('Agent ID is required');
      return;
    }
    try {
      const { agentId, ...rest } = addForm;
      const response = await fetch(`${API_BASE}/agents/update/${agentId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rest)
      });
      const data = await response.json();
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
        fetchHealth();
        alert('Agent added successfully!');
      } else {
        alert(data.error || 'Failed to add agent');
      }
    } catch (err) {
      alert('Failed to add agent');
    }
  };

  // Set phone number
  const handleSetPhone = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/set_phone/${selectedAgent}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(phoneForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowPhoneModal(false);
        fetchAgents();
        fetchHealth();
        alert('Phone number set successfully!');
      } else {
        alert(data.error || 'Failed to set phone number');
      }
    } catch (err) {
      alert('Failed to set phone number');
    }
  };

  // Search by phone
  const handleSearchByPhone = async () => {
    if (!searchPhone) return;
    try {
      const response = await fetch(`${API_BASE}/agents/by_phone/${searchPhone}`, { headers });
      const data = await response.json();
      if (data.success) {
        setSearchResult(data.agent);
      } else {
        setSearchResult(null);
        alert(data.error || 'No agent found');
      }
    } catch (err) {
      alert('Failed to search agent');
    }
  };

  const handleUpdateAgent = async () => {
    if (!updateForm.agentId.trim()) {
      alert('Agent ID is required');
      return;
    }
    try {
      const { agentId, ...rest } = updateForm;
      const response = await fetch(`${API_BASE}/agents/update/${agentId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rest)
      });
      const data = await response.json();
      if (data.success) {
        setShowUpdateModal(false);
        fetchAgents();
        fetchHealth();
        alert('Agent updated successfully!');
      } else {
        alert(data.error || 'Failed to update agent');
      }
    } catch (err) {
      alert('Failed to update agent');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAgents(), fetchHealth(), fetchActiveCalls()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Agent Management</h1>
          <p className="text-gray-400">Manage your AI agents and monitor system health</p>
        </div>
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">
            {error}
          </div>
        )}

        {/* Health Status Cards */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Agents</p>
                  <p className="text-3xl font-bold text-white">{health.total_agents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">With Phone</p>
                  <p className="text-3xl font-bold text-green-400">{health.agents_with_phone}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Without Phone</p>
                  <p className="text-3xl font-bold text-yellow-400">{health.agents_without_phone}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    health.status === 'healthy' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {health.status}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  health.status === 'healthy' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <svg className={`w-6 h-6 ${
                    health.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Search Agent by Phone</h2>
            <div className="flex gap-4">
              <input
                type="text"
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
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
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <strong className="text-blue-300">Found Agent:</strong> 
                <span className="text-white ml-2">{searchResult.agentId}</span>
                {searchResult.phone_number && (
                  <span className="text-gray-300 ml-2"> - Phone: {searchResult.phone_number}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">All Agents</h2>
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
          <div className="p-6">
            {agents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg mb-4">No agents found</p>
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
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Agent ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">TTS Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">STT Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {agents.map((agent) => (
                      <tr key={agent.agentId} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-white">{agent.agentId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {agent.phone_number ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              {agent.phone_number}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                              Not set
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{agent.tts_config.model}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{agent.stt_config.model}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(agent.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAgent(agent.agentId);
                              setPhoneForm({ phone_number: agent.phone_number || '' });
                              setShowPhoneModal(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 border border-blue-500/50 hover:border-blue-400 px-3 py-1 rounded text-xs transition-colors"
                          >
                            Set Phone
                          </button>
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
                            className="text-yellow-400 hover:text-yellow-300 border border-yellow-500/50 hover:border-yellow-400 px-3 py-1 rounded text-xs transition-colors"
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
        </div>

        {/* Add Agent Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Add New Agent</h3>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agent ID <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                      value={addForm.agentId}
                      onChange={(e) => setAddForm({ ...addForm, agentId: e.target.value })}
                      placeholder=""
                      required
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Chatbot Configuration</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Chatbot API</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.chatbot_api}
                          onChange={(e) => setAddForm({...addForm, chatbot_api: e.target.value})}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Chatbot Key</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.chatbot_key}
                          onChange={(e) => setAddForm({...addForm, chatbot_key: e.target.value})}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">TTS Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.tts_config.voice_id}
                          onChange={(e) => setAddForm({
                            ...addForm, 
                            tts_config: {...addForm.tts_config, voice_id: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">TTS API Key</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.tts_config.tts_api_key}
                          onChange={(e) => setAddForm({
                            ...addForm, 
                            tts_config: {...addForm.tts_config, tts_api_key: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.tts_config.model}
                          onChange={(e) => setAddForm({
                            ...addForm, 
                            tts_config: {...addForm.tts_config, model: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Speed</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="2.0"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.tts_config.speed}
                          onChange={(e) => setAddForm({
                            ...addForm, 
                            tts_config: {...addForm.tts_config, speed: parseFloat(e.target.value)}
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">STT Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.stt_config.api_key}
                          onChange={(e) => setAddForm({
                            ...addForm, 
                            stt_config: {...addForm.stt_config, api_key: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.stt_config.model}
                          onChange={(e) => setAddForm({
                            ...addForm, 
                            stt_config: {...addForm.stt_config, model: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.stt_config.language}
                          onChange={(e) => setAddForm({
                            ...addForm, 
                            stt_config: {...addForm.stt_config, language: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
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
            <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Set Phone Number: {selectedAgent}</h3>
              </div>
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                    value={phoneForm.phone_number}
                    onChange={(e) => setPhoneForm({phone_number: e.target.value})}
                    placeholder="+18143873168"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="px-6 py-3 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
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
            <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Update Agent: {updateForm.agentId}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agent ID</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      value={updateForm.agentId}
                      disabled
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Chatbot Configuration</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Chatbot API</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.chatbot_api}
                          onChange={(e) => setUpdateForm({...updateForm, chatbot_api: e.target.value})}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Chatbot Key</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.chatbot_key}
                          onChange={(e) => setUpdateForm({...updateForm, chatbot_key: e.target.value})}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">TTS Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.tts_config.voice_id}
                          onChange={(e) => setUpdateForm({
                            ...updateForm,
                            tts_config: {...updateForm.tts_config, voice_id: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">TTS API Key</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.tts_config.tts_api_key}
                          onChange={(e) => setUpdateForm({
                            ...updateForm,
                            tts_config: {...updateForm.tts_config, tts_api_key: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.tts_config.model}
                          onChange={(e) => setUpdateForm({
                            ...updateForm,
                            tts_config: {...updateForm.tts_config, model: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Speed</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="2.0"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.tts_config.speed}
                          onChange={(e) => setUpdateForm({
                            ...updateForm,
                            tts_config: {...updateForm.tts_config, speed: parseFloat(e.target.value)}
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">STT Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.stt_config.api_key}
                          onChange={(e) => setUpdateForm({
                            ...updateForm,
                            stt_config: {...updateForm.stt_config, api_key: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.stt_config.model}
                          onChange={(e) => setUpdateForm({
                            ...updateForm,
                            stt_config: {...updateForm.stt_config, model: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          value={updateForm.stt_config.language}
                          onChange={(e) => setUpdateForm({
                            ...updateForm,
                            stt_config: {...updateForm.stt_config, language: e.target.value}
                          })}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-6 py-3 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
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
      </div>
    </div>
  );
};

export default AgentsPage; 