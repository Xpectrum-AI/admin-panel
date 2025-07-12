import { Mail, Crown, Eye, Shield } from 'lucide-react';

const sampleMembers = [
  {
    name: 'John Developer',
    email: 'john@company.com',
    role: 'Super Admin',
    roleIcon: <Crown className="inline-block align-middle mr-1 w-5 h-5 text-red-500" />, // Crown icon
    roleBadge: 'bg-red-100 text-red-700',
    status: 'Active',
    statusBadge: 'bg-gray-900 text-white',
    lastLogin: '2 hours ago',
  },
  {
    name: 'Jane Support',
    email: 'jane@company.com',
    role: 'Support Admin',
    roleIcon: <Shield className="inline-block align-middle mr-1 w-5 h-5 text-blue-500" />, // Shield icon
    roleBadge: 'bg-blue-100 text-blue-700',
    status: 'Active',
    statusBadge: 'bg-gray-900 text-white',
    lastLogin: '1 day ago',
  },
  {
    name: 'Bob Analytics',
    email: 'bob@company.com',
    role: 'Analytics Admin',
    roleIcon: <Eye className="inline-block align-middle mr-1 w-5 h-5 text-green-500" />, // Eye icon
    roleBadge: 'bg-green-100 text-green-700',
    status: 'Active',
    statusBadge: 'bg-gray-900 text-white',
    lastLogin: '30 minutes ago',
  },
  {
    name: 'Alice Reviewer',
    email: 'alice@company.com',
    role: 'Support Admin',
    roleIcon: <Shield className="inline-block align-middle mr-1 w-5 h-5 text-blue-500" />, // Shield icon
    roleBadge: 'bg-blue-100 text-blue-700',
    status: 'Pending',
    statusBadge: 'bg-gray-100 text-gray-700',
    lastLogin: 'Never',
  },
];

export default function SuperAdminTeamTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center mb-1">
            <Crown className="text-red-500 w-7 h-7 mr-2" />
            <span className="text-3xl font-bold text-gray-900">Super Admin Team</span>
          </div>
          <div className="text-gray-500 text-sm">Manage developer access to the Super Admin panel</div>
        </div>
        <button 
          className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2">
          <Mail className='h-4 w-4' />
          <span>Invite Member</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg">
          <thead>
            <tr className="text-left text-gray-500 text-base border-b border-gray-200">
              <th className="py-3 px-4 font-medium">Member</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Last Login</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sampleMembers.map((member, idx) => (
              <tr key={idx} className="border-b border-gray-100 last:border-0">
                <td className="py-4 px-4 font-bold text-gray-900 flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-400 font-semibold text-lg">•</span>
                  {member.name}
                </td>
                <td className="py-4 px-4 text-gray-700">{member.email}</td>
                <td className="py-4 px-4 flex items-center gap-2">
                  {member.roleIcon}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${member.roleBadge}`}>{member.role}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-4 py-1 rounded-full text-sm font-semibold ${member.statusBadge}`}>{member.status}</span>
                </td>
                <td className="py-4 px-4 text-gray-700">{member.lastLogin}</td>
                <td className="py-4 px-4 text-right">
                  <button className="p-2 rounded-lg hover:bg-gray-100">
                    <span className="sr-only">Actions</span>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 