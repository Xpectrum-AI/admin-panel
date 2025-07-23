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
        if (
          data.success &&
          data.agent &&
          !(data.agent.status === "error" && data.agent.message)
        ) {
          setAgent(data.agent);
          setError(null);
        } else if (
          data.agent &&
          data.agent.status === "error" &&
          data.agent.message &&
          data.agent.message.toLowerCase().includes("not found")
        ) {
          setAgent(null);
          setError("not found");
        } else {
          setAgent(null);
          setError("No agent found for this workspace.");
        }
      } catch (error: any) {
        setAgent(null);
        setError(error.message || "Failed to fetch agent");
        showError(error.message || "Failed to fetch agent");
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

  if ((error === "not found" || (!!error && !agent))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg flex flex-col items-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent not assigned to you</h2>
          <p className="text-gray-600">No agent is currently assigned to this workspace. Please contact your administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <p className="text-gray-600 mb-8">View your AI agent for this workspace</p>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Agent Details</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
            <table className="min-w-full bg-white text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-6 py-3 text-left font-semibold">AGENT ID</th>
                  <th className="px-6 py-3 text-left font-semibold">PHONE NUMBER</th>
                  <th className="px-6 py-3 text-left font-semibold">TTS MODEL</th>
                  <th className="px-6 py-3 text-left font-semibold">STT MODEL</th>
                  <th className="px-6 py-3 text-left font-semibold">LAST UPDATED</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-4">{agent?.agentId || 'Not set'}</td>
                  <td className="px-6 py-4">{agent?.phone_number || 'N/A'}</td>
                  <td className="px-6 py-4">{agent?.tts_config?.model || 'N/A'}</td>
                  <td className="px-6 py-4">{agent?.stt_config?.model || 'N/A'}</td>
                  <td className="px-6 py-4">{agent?.updated_at ? new Date(agent.updated_at).toLocaleString() : 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 className="text-lg font-semibold mb-2">All Agent Data</h3>
          <pre className="bg-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
            {JSON.stringify(agent, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage; 