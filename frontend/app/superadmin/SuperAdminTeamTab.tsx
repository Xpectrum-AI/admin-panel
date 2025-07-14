import React, { useState } from 'react';
import { Mail, Users, Crown, MoreVertical, UserCheck, Trash2, X, Check, ChevronDown, Loader2 } from 'lucide-react';
import { Listbox } from '@headlessui/react';
import { OrgMember } from '@/app/(admin)/workspace/components/team/types';
import { getRoleIcon, getStatusBadge, getMemberInitials } from '@/app/(admin)/workspace/components/team/utils';

interface InviteForm {
  email: string;
  role: string;
}

interface SuperAdminTeamTabProps {
  members?: OrgMember[];
  onInviteMember?: (form: InviteForm) => Promise<void>;
  onRemoveUser?: (userId: string, userName: string) => Promise<void>;
  onChangeRole?: (userId: string, newRole: string, userName: string) => Promise<void>;
  loadingInvite?: boolean;
  loadingRemove?: boolean;
  loadingRoleChange?: boolean;
  currentUserId?: string;
}

export default function SuperAdminTeamTab({ 
  members = [],
  onInviteMember,
  onRemoveUser,
  onChangeRole,
  loadingInvite = false,
  loadingRemove = false,
  loadingRoleChange = false,
  currentUserId
}: SuperAdminTeamTabProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [actionMember, setActionMember] = useState<OrgMember | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '',
    role: 'Member'
  });

  const roles = ['Admin', 'Owner', 'Member'];
  const changeRoleOptions = ['Admin', 'Member'];

  // Sort members: Owner first, then current user, then others alphabetically
  const sortedMembers = [...members].sort((a, b) => {
    // Owner always comes first
    if (a.roleInOrg === 'Owner' && b.roleInOrg !== 'Owner') return -1;
    if (a.roleInOrg !== 'Owner' && b.roleInOrg === 'Owner') return 1;
    
    // If both are owners or both are not owners, current user comes next
    if (a.userId === currentUserId && b.userId !== currentUserId) return -1;
    if (a.userId !== currentUserId && b.userId === currentUserId) return 1;
    
    // Then sort alphabetically by name
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const isOwner = (member: OrgMember) => member.roleInOrg === 'Owner';
  const isCurrentUser = (member: OrgMember) => member.userId === currentUserId;

  const getRowClassName = (member: OrgMember) => {
    let className = 'border-b border-gray-200 last:border-0';
    
    if (isOwner(member)) {
      className += ' bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-l-yellow-400';
    } else if (isCurrentUser(member)) {
      className += ' bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-400';
    }
    
    return className;
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onInviteMember) {
      await onInviteMember(inviteForm);
      setInviteForm({ email: '', role: 'Member' });
      setShowInviteModal(false);
    }
  };

  const handleRemoveUser = async (member: OrgMember) => {
    if (onRemoveUser) {
      const userName = `${member.firstName} ${member.lastName}`;
      await onRemoveUser(member.userId, userName);
      setShowActionsModal(false);
      setActionMember(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string, userName: string) => {
    if (onChangeRole) {
      await onChangeRole(userId, newRole, userName);
      setShowChangeRoleModal(false);
      setActionMember(null);
    }
  };

  const openActionsModal = (member: OrgMember) => {
    setActionMember(member);
    setShowActionsModal(true);
  };

  const openChangeRoleModal = (member: OrgMember) => {
    setActionMember(member);
    setShowChangeRoleModal(true);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      {/* Modal Animations */}
      <style jsx global>{`
        .modal-fade-in {
          animation: modal-fade-in 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes modal-fade-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98);}
          to { opacity: 1; transform: translateY(0) scale(1);}
        }
        .backdrop-fade-in {
          animation: backdrop-fade-in 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes backdrop-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center mb-1">
            <Crown className="text-red-500 w-7 h-7 mr-2" />
            <span className="text-3xl font-bold text-gray-900">Super Admin Team</span>
          </div>
          <div className="text-gray-500 text-sm">Manage developer access to the Super Admin panel</div>
        </div>
        <button 
          className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2"
          onClick={() => setShowInviteModal(true)}
        >
          <Mail className='h-4 w-4' />
          <span>Invite Member</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
              <th className="py-2 px-4 font-medium">Member</th>
              <th className="py-2 px-4 font-medium">Email</th>
              <th className="py-2 px-4 font-medium">Role</th>
              <th className="py-2 px-4 font-medium">Status</th>
              <th className="py-2 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No members found</p>
                  <p className="text-sm">Invite your first super admin to get started</p>
                </td>
              </tr>
            ) : (
              sortedMembers.map((member) => (
                <tr key={member.userId} className={getRowClassName(member)}>
                  <td className="py-2 px-4 flex items-center space-x-3">
                    {member.pictureUrl ? (
                      <img 
                        src={member.pictureUrl} 
                        alt={`${member.firstName} ${member.lastName}`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getMemberInitials(member.firstName, member.lastName)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {member.firstName} {member.lastName}
                        {isOwner(member) && (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        )}
                        {isCurrentUser(member) && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">@{member.username}</div>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center space-x-2">
                      <span>{member.email}</span>
                      {member.emailConfirmed && (
                        <span className="ml-1 text-green-500" title="Email confirmed">●</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.roleInOrg)}
                      {member.roleInOrg}
                    </div>
                </td>
                  <td className="py-2 px-4">
                    {getStatusBadge(member)}
                </td>
                  <td className="py-2 px-4">
                    {!isOwner(member) ? (
                      <button 
                        className="text-gray-400 hover:text-gray-700 p-1 rounded"
                        onClick={() => openActionsModal(member)}
                      >
                        <MoreVertical className="h-4 w-4" />
                  </button>
                    ) : (
                      <span className="text-xs text-gray-400">No actions available</span>
                    )}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 bg-opacity-50 backdrop-fade-in" onClick={() => setShowInviteModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 modal-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Invite Super Admin</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <Listbox value={inviteForm.role} onChange={(role: string) => setInviteForm({ ...inviteForm, role })}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-2 border border-gray-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition flex items-center justify-between">
                      <span>{inviteForm.role}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg py-1 text-base focus:outline-none">
                      {roles.map((role: string) => (
                        <Listbox.Option
                          key={role}
                          value={role}
                          className={({ active }: { active: boolean }) =>
                            `cursor-pointer select-none relative py-2 pl-10 pr-4 ${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected }: { selected: boolean }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {role}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900">
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingInvite}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loadingInvite && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{loadingInvite ? 'Sending...' : 'Send Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Actions Modal */}
      {showActionsModal && actionMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 bg-opacity-50 backdrop-fade-in" onClick={() => setShowActionsModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 modal-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Member Actions</h3>
              <button
                onClick={() => setShowActionsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                {actionMember.pictureUrl ? (
                  <img 
                    src={actionMember.pictureUrl} 
                    alt={`${actionMember.firstName} ${actionMember.lastName}`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {getMemberInitials(actionMember.firstName, actionMember.lastName)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {actionMember.firstName} {actionMember.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{actionMember.email}</div>
                  <div className="text-sm text-gray-600">Role: {actionMember.roleInOrg}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  openChangeRoleModal(actionMember);
                  setShowActionsModal(false);
                }}
                disabled={loadingRoleChange}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-gray-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Change Role</div>
                    <div className="text-sm text-gray-500">Modify user permissions</div>
                  </div>
                </div>
                {loadingRoleChange && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>}
              </button>
              
              <button
                onClick={() => handleRemoveUser(actionMember)}
                disabled={loadingRemove}
                className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <div className="flex items-center">
                  <Trash2 className="h-5 w-5 text-red-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-red-900">Remove User</div>
                    <div className="text-sm text-red-600">Remove from super admin org</div>
                  </div>
                </div>
                {loadingRemove && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-900"></div>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showChangeRoleModal && actionMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 bg-opacity-50" onClick={() => setShowChangeRoleModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Change User Role</h3>
              <button
                onClick={() => setShowChangeRoleModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                {actionMember.pictureUrl ? (
                  <img 
                    src={actionMember.pictureUrl} 
                    alt={`${actionMember.firstName} ${actionMember.lastName}`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {getMemberInitials(actionMember.firstName, actionMember.lastName)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {actionMember.firstName} {actionMember.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{actionMember.email}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Current role: <span className="font-medium">{actionMember.roleInOrg}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Role
                </label>
                <div className="space-y-2">
                  {changeRoleOptions.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleChangeRole(actionMember.userId, role, `${actionMember.firstName} ${actionMember.lastName}`)}
                      disabled={loadingRoleChange}
                      className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-medium">{role}</span>
                      {loadingRoleChange && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 