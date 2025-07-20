'use client';

import React, { useState, useEffect } from 'react';
import { SyncLoader } from "react-spinners";
import { getAgentInfo } from '../../../service/agentService';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useAuthInfo } from '@propelauth/react';

interface Agent {
  agentId: string;
  chatbot_api?: string;
  chatbot_key?: string;
  tts_config?: {
    voice_id?: string;
    tts_api_key?: string;
    model?: string;
    speed?: number;
  };
  stt_config?: {
    api_key?: string;
    model?: string;
    language?: string;
  };
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // For any extra fields
}

const AgentsPage = () => {
  const { showError } = useErrorHandler();
  const { orgHelper } = useAuthInfo();
  const orgs = orgHelper?.getOrgs?.() || [];
  const orgId = orgs[0]?.orgId;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setError('No workspace found for this user.');
      setAgent(null);
      setLoading(false);
      return;
    }
    const fetchAgent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAgentInfo(orgId);
        if (data.success && data.agent) {
          setAgent(data.agent);
        } else {
          setAgent(null);
          setError('No agent found for this workspace.');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to fetch agent');
        setAgent(null);
        showError(error.message || 'Failed to fetch agent');
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [orgId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <SyncLoader size={15} color="#000000" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 mb-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Management</h1>
        <p className="text-gray-600">View your AI agent for this workspace</p>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6" role="alert">
          {error}
        </div>
      )}
      <div className="bg-gray-100 rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Agent Details</h2>
        {!agent ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg mb-4">No agent found for this workspace</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition-colors">
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
                </tr>
              </tbody>
            </table>
            {/* Optionally, display all agent fields for debugging or completeness */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">All Agent Data</h3>
              <pre className="bg-gray-200 rounded p-4 text-xs overflow-x-auto text-gray-800">
                {JSON.stringify(agent, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsPage; 