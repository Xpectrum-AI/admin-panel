import { Info } from 'lucide-react';
import AgentsTable from './AgentsTable';
import { Agent } from '../common/types';

interface AgentsSectionProps {
  agent: Agent | null;
  loading: boolean;
}

export default function AgentsSection({ agent, loading }: AgentsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Agents</h2>
        <div className="bg-blue-50 flex items-center text-blue-700 px-4 py-2 rounded-lg text-sm">
          <span className="mr-2"><Info className="w-4 h-4" /></span>
          <span><span className="font-semibold">View Only:</span> You can view your assigned agents but cannot modify them</span>
        </div>
      </div>

      <AgentsTable agent={agent} loading={loading} />
    </div>
  );
} 