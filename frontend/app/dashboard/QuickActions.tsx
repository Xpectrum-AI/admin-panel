const actionItems = [
  { title: 'Add New User', description: 'Create a new user account' },
  { title: 'Generate Report', description: 'Create analytics report' },
  { title: 'Settings', description: 'Manage system settings' },
];

export default function QuickActions() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actionItems.map((item, index) => (
          <button
            key={index}
            className="w-full text-left p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <p className="font-semibold text-gray-800">{item.title}</p>
            <p className="text-sm text-gray-500">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
} 