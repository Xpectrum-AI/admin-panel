import { UserCircle2 } from 'lucide-react';

const activityItems = [
  { text: 'New user registered', time: '2 minutes ago' },
  { text: 'New user registered', time: '2 minutes ago' },
  { text: 'New user registered', time: '2 minutes ago' },
];

export default function RecentActivity() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200  ">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
      <ul className="space-y-4">
        {activityItems.map((item, index) => (
          <li key={index} className="flex items-center space-x-4">
            <div className="bg-gray-100 rounded-full p-2">
              <UserCircle2 className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">{item.text}</p>
              <p className="text-sm text-gray-500">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 