import { SyncLoader } from 'react-spinners';
import { UserCheck } from 'lucide-react';
import { Agent } from '../common/types';

interface AgentsTableProps {
  agent: Agent | null;
  loading: boolean;
}

export default function AgentsTable({ agent, loading }: AgentsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <SyncLoader size={15} color="#3B82F6" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Agent not assigned to you</h3>
        <p className="text-gray-600">
          No agent is currently assigned to this workspace. Please contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-6 py-3 text-left font-semibold">Agent ID</th>
            <th className="px-6 py-3 text-left font-semibold">Phone Number</th>
            <th className="px-6 py-3 text-left font-semibold">TTS Model</th>
            <th className="px-6 py-3 text-left font-semibold">STT Model</th>
            <th className="px-6 py-3 text-left font-semibold">Status</th>
            <th className="px-6 py-3 text-left font-semibold">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="px-6 py-4 font-medium">{agent.agentId || 'Not set'}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-xs ${
                agent.phone_number 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {agent.phone_number || 'Not set'}
              </span>
            </td>
            <td className="px-6 py-4">{agent.tts_config?.model || 'N/A'}</td>
            <td className="px-6 py-4">{agent.stt_config?.model || 'N/A'}</td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-xs ${
                agent.phone_number 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {agent.phone_number ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 text-gray-500">
              {agent.updated_at ? new Date(agent.updated_at).toLocaleDateString() : 'N/A'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 