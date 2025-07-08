'use client';

import React, { useState, useEffect, useCallback } from 'react';

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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showDeletePhoneModal, setShowDeletePhoneModal] = useState(false);
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
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/all`, { headers });
      const data = await response.json();
      console.log('Agents response:', data); // Debug log
      if (data.success) {
        // Ensure agents is always an array
        const agentsArray = Array.isArray(data.agents) ? data.agents : [];
        setAgents(agentsArray);
        setError(null); // Clear any previous errors
      } else {
        setError(data.error || 'Failed to fetch agents');
        setAgents([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError('Failed to connect to server');
      setAgents([]); // Set empty array on error
    }
  }, []);



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
        alert('Agent added successfully to live system!');
      } else {
        alert(data.error || 'Failed to add agent to live system');
      }
    } catch {
      alert('Failed to add agent to live system');
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
        alert('Phone number set successfully in live system!');
      } else {
        alert(data.error || 'Failed to set phone number in live system');
      }
    } catch {
      alert('Failed to set phone number in live system');
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
    } catch {
      alert('Failed to search agent');
    }
  };

  // Delete phone number
  const handleDeletePhone = async () => {
    try {
      const response = await fetch(`${API_BASE}/agents/delete_phone/${selectedAgent}`, {
        method: 'DELETE',
        headers
      });
      const data = await response.json();
      if (data.success) {
        setShowDeletePhoneModal(false);
        fetchAgents();
        alert('Phone number deleted successfully from live system!');
      } else {
        alert(data.error || 'Failed to delete phone number from live system');
      }
    } catch {
      alert('Failed to delete phone number from live system');
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
        alert('Agent updated successfully in live system!');
      } else {
        alert(data.error || 'Failed to update agent in live system');
      }
    } catch {
      alert('Failed to update agent in live system');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAgents();
      setLoading(false);
    };
    loadData();
  }, [fetchAgents]);

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

        {/* Live API Integration Notice */}
        <div className="bg-blue-900/20 border border-blue-500/50 text-blue-300 px-4 py-3 rounded-lg mb-6" role="alert">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Live API Integration:</span>
            <span className="ml-2">Agent configurations are now saved to the live system at live.xpectrum-ai.com</span>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">
            {error}
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
            {!Array.isArray(agents) || agents.length === 0 ? (
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
                    {Array.isArray(agents) && agents.map((agent) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{agent.tts_config?.model || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{agent.stt_config?.model || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {agent.updated_at ? new Date(agent.updated_at).toLocaleDateString() : 'N/A'}
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
                          {agent.phone_number && (
                            <button
                              onClick={() => {
                                setSelectedAgent(agent.agentId);
                                setShowDeletePhoneModal(true);
                              }}
                              className="text-red-400 hover:text-red-300 border border-red-500/50 hover:border-red-400 px-3 py-1 rounded text-xs transition-colors"
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
                          placeholder="https://demo.xpectrum-ai.com/v1/chat-messages"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Chatbot Key</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                          value={addForm.chatbot_key}
                          onChange={(e) => setAddForm({...addForm, chatbot_key: e.target.value})}
                          placeholder="REDACTED"
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
                          placeholder="e8e5fffb-252c-436d-b842-8879b84445b6"
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
                          placeholder="REDACTED"
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
                          placeholder="sonic-2"
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
                          placeholder="05df4b7e4f1ce81d5e9fdfb4b0cadd02b317c373"
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
                          placeholder="nova-2"
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
                          placeholder="en-US"
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

        {/* Delete Phone Modal */}
        {showDeletePhoneModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white">Delete Phone Number</h3>
                <p className="text-gray-400 mt-2">Are you sure you want to delete the phone number for agent <strong>{selectedAgent}</strong>?</p>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeletePhoneModal(false)}
                  className="px-6 py-3 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
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
    </div>
  );
};

export default AgentsPage; 