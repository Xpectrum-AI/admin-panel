import React, { useState } from 'react';
import { Search, Filter, Ellipsis } from 'lucide-react';
import Pagination from './Pagination';
import ActionMenu from './ActionMenu';
import { Eye, RotateCcw, UserRound, Lock } from 'lucide-react';
import { useAuthFrontendApis } from '@propelauth/frontend-apis-react';
import { useError } from '../(admin)/contexts/ErrorContext';

function timeAgo(unixSeconds: number) {
  const now = Date.now() / 1000;
  const diff = now - unixSeconds;
  if (diff < 60) return `${Math.floor(diff)} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

interface UsersTabProps {
  users: any[];
  totalUsers: number;
  pageNumber: number;
  pageSize: number;
  setPageNumber: (n: number) => void;
}

export default function UsersTab({ users, totalUsers, pageNumber, pageSize, setPageNumber }: UsersTabProps) {
  const [search, setSearch] = useState('');
  const { sendForgotPasswordEmail } = useAuthFrontendApis();
  const { showError } = useError();

  async function handleResetPassword(email: string) {
    const response = await sendForgotPasswordEmail({ email });
    response.handle({
      success(data) {
        showError('Password reset email sent!', 'success');
      },
      badRequest(error) {
        for (const [field, fieldErrorMessage] of Object.entries(error.user_facing_errors)) {
          showError(`Error: "${fieldErrorMessage}" for field: "${field}"`, 'error');
        }
      },
      unexpectedOrUnhandled(error) {
        showError('Unexpected error: ' + error.user_facing_error, 'error');
      },
    });
  }

  // Filter users in-memory
  const filteredUsers = users.filter(user => {
    const orgs = user.orgIdToOrgInfo ? Object.values(user.orgIdToOrgInfo) : [];
    const org = orgs[0];
    let orgName = '';
    if (org && typeof org === 'object') {
      orgName = ((org as any).orgMetadata && (org as any).orgMetadata.displayName) || (org as any).orgName || '';
    }
    const name = user.firstName || user.lastName
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : user.username || user.email;
    const searchLower = search.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (orgName && orgName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="bg-white rounded-xl  border border-gray-200 p-6">
      <div className='flex flex-col space-y-1.5 '>
        <div className='flex justify-between items-center'>
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Global User Management</h3>
          <div className='flex space-x-2'>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="ml-2 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
              <Filter className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No users found.</div>
        ) : (
          <>
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-gray-500 text-base shadow-sm">
                  <th className="py-3 px-4 text-left font-semibold">User</th>
                  <th className="py-3 px-4 text-left font-semibold">Email</th>
                  <th className="py-3 px-4 text-left font-semibold">Organization</th>
                  <th className="py-3 px-4 text-left font-semibold">Role</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Last Login</th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const orgs = user.orgIdToOrgInfo
                    ? Object.values(user.orgIdToOrgInfo)
                    : [];
                  const org: any = orgs[0];
                  const orgName = org
                    ? org.orgMetadata?.displayName || org.orgName
                    : '-';
                  const role = org ? org.userAssignedRole : '-';
                  const name = user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : user.username || user.email;
                  const status = user.locked
                    ? 'Suspended'
                    : user.enabled
                      ? 'Active'
                      : 'Inactive';
                  const lastLogin = user.lastActiveAt
                    ? timeAgo(user.lastActiveAt)
                    : '-';
                  return (
                    <tr key={user.userId} className="bg-white rounded-xl shadow-sm">
                      <td className="py-4 px-4 font-bold text-gray-900">{name}</td>
                      <td className="py-4 px-4 text-gray-700">{user.email}</td>
                      <td className="py-4 px-4 text-gray-700">{orgName}</td>
                      <td className="py-4 px-4">
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold ${role === 'Admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>{role}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold ${status === 'Active' ? 'bg-gray-900 text-white' : status === 'Suspended' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>{status}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">{lastLogin}</td>
                      <td className="py-4 px-4">
                        <ActionMenu
                          actions={[
                            {
                              label: 'View Details',
                              icon: <Eye className="w-5 h-5" />,
                              onClick: () => {/* TODO: handle view details */},
                            },
                            {
                              label: 'Reset Password',
                              icon: <RotateCcw className="w-5 h-5" />,
                              onClick: () => handleResetPassword(user.email),
                            },
                            {
                              label: 'Assign Role',
                              icon: <UserRound className="w-5 h-5" />,
                              onClick: () => {/* TODO: handle assign role */},
                            },
                            {
                              label: 'Suspend User',
                              icon: <Lock className="w-5 h-5" />,
                              onClick: () => {/* TODO: handle suspend user */},
                              danger: true,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalResults={totalUsers}
              onPageChange={setPageNumber}
            />
          </>
        )}
      </div>
    </div>
  );
} 