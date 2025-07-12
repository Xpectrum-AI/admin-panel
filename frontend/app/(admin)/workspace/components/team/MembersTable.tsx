import React, { useState } from 'react';
import { Users, Check, Clock, MoreVertical, UserCheck, Trash2, Crown, X } from 'lucide-react';
import { OrgMember, PendingInvite } from './types';
import { getRoleIcon, getStatusBadge, formatDate, isExpired, getMemberInitials } from './utils';

interface MembersTableProps {
  members: OrgMember[];
  pendingInvites: PendingInvite[];
  onRemoveUser: (userId: string, userName: string) => Promise<void>;
  onChangeRole: (userId: string, newRole: string, userName: string) => Promise<void>;
  loadingRemove: boolean;
  loadingRoleChange: boolean;
  currentUserId?: string;
}

export default function MembersTable({ 
  members, 
  pendingInvites, 
  onRemoveUser, 
  onChangeRole,
  loadingRemove,
  loadingRoleChange,
  currentUserId
}: MembersTableProps) {
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [actionMember, setActionMember] = useState<OrgMember | null>(null);

  const handleRemoveUser = async (member: OrgMember) => {
    const userName = `${member.firstName} ${member.lastName}`;
    await onRemoveUser(member.userId, userName);
    setShowActionsModal(false);
    setActionMember(null);
  };

  const handleChangeRole = async (userId: string, newRole: string, userName: string) => {
    await onChangeRole(userId, newRole, userName);
    setSelectedMember(null);
  };

  const openActionsModal = (member: OrgMember) => {
    setActionMember(member);
    setShowActionsModal(true);
  };

  const isOwner = (member: OrgMember) => member.roleInOrg === 'Owner';
  const isCurrentUser = (member: OrgMember) => member.userId === currentUserId;

  // Sort members: Owner first, then current user, then others alphabetically
  const sortedMembers = [...members].sort((a, b) => {
    // Owner always comes first
    if (isOwner(a) && !isOwner(b)) return -1;
    if (!isOwner(a) && isOwner(b)) return 1;
    
    // If both are owners or both are not owners, current user comes next
    if (isCurrentUser(a) && !isCurrentUser(b)) return -1;
    if (!isCurrentUser(a) && isCurrentUser(b)) return 1;
    
    // Then sort alphabetically by name
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const getRowClassName = (member: OrgMember) => {
    let className = 'border-b border-gray-200 last:border-0';
    
    if (isOwner(member)) {
      className += ' bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-l-yellow-400';
    } else if (isCurrentUser(member)) {
      className += ' bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-400';
    }
    
    return className;
  };

  return (
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
          {sortedMembers.length === 0 && pendingInvites.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No members found</p>
                <p className="text-sm">Invite your first team member to get started</p>
              </td>
            </tr>
          ) : (
            <>
              {/* Active Members */}
              {sortedMembers.map((member) => (
                <tr 
                  key={member.userId} 
                  className={getRowClassName(member)}
                >
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
                        <Check className="h-4 w-4 text-green-500" />
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
              ))}
              
              {/* Pending Invites */}
              {pendingInvites.map((invite) => (
                <tr key={`${invite.inviteeEmail}-${invite.createdAt}`} className="border-b border-gray-200 last:border-0 bg-orange-50">
                  <td className="py-2 px-4 flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {invite.inviteeEmail}
                      </div>
                      <div className="text-sm text-gray-500">Pending invitation</div>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <span className="text-gray-600">{invite.inviteeEmail}</span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-1">
                      {getRoleIcon(invite.roleInOrg)}
                      {invite.roleInOrg}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isExpired(invite.expiresAt) 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {isExpired(invite.expiresAt) ? 'Expired' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="text-xs text-gray-500">
                      Invited {formatDate(invite.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>

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
                  setSelectedMember(actionMember);
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
                    <div className="text-sm text-red-600">Remove from organization</div>
                  </div>
                </div>
                {loadingRemove && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-900"></div>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 bg-opacity-50" onClick={() => setSelectedMember(null)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Change User Role</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                {selectedMember.pictureUrl ? (
                  <img 
                    src={selectedMember.pictureUrl} 
                    alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {getMemberInitials(selectedMember.firstName, selectedMember.lastName)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{selectedMember.email}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Current role: <span className="font-medium">{selectedMember.roleInOrg}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Role
                </label>
                <div className="space-y-2">
                  {['Admin', 'Member'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleChangeRole(selectedMember.userId, role, `${selectedMember.firstName} ${selectedMember.lastName}`)}
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