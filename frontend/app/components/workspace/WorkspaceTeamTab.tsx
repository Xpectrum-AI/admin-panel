const members = [
  { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'Developer', status: 'Active' },
  { name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'Pending' },
];

export default function WorkspaceTeamTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Workspace Members</h2>
        <button className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2">
          <span className="material-icons text-base">mail</span>
          <span>Invite Member</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b">
              <th className="py-2 px-4 font-medium">Member</th>
              <th className="py-2 px-4 font-medium">Email</th>
              <th className="py-2 px-4 font-medium">Role</th>
              <th className="py-2 px-4 font-medium">Status</th>
              <th className="py-2 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 px-4 flex items-center space-x-2">
                  <span className="inline-block h-8 w-8 rounded-full bg-gray-100" />
                  <span>{m.name}</span>
                </td>
                <td className="py-2 px-4">{m.email}</td>
                <td className="py-2 px-4">{m.role === 'Admin' ? '👑' : m.role === 'Developer' ? '🛡️' : '👁️'} {m.role}</td>
                <td className="py-2 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    m.status === 'Active' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <button className="text-gray-400 hover:text-gray-700">•••</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 