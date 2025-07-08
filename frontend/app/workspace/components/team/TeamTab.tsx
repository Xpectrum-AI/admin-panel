import { Mail, Users, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTeamData } from './useTeamData';
import InviteMemberModal from './InviteMemberModal';
import MembersTable from './MembersTable';

export default function TeamTab({ workspace }: { workspace: any }) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const orgId = workspace?.orgId || 'your-org-id';
  const currentUserId = workspace?.currentUserId;
  
  const {
    members,
    pendingInvites,
    loadingMembers,
    loadingInvites,
    loadingInvite,
    loadingRemove,
    loadingRoleChange,
    membersError,
    invitesError,
    handleInviteSubmit,
    handleRemoveUser,
    handleChangeUserRole,
    refreshData,
  } = useTeamData(orgId);

  const handleInviteSubmitWrapper = async (inviteForm: any) => {
    try {
      await handleInviteSubmit(inviteForm);
      setTimeout(() => setShowInviteModal(false), 1200);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const isLoading = loadingMembers || loadingInvites;
  const hasError = membersError || invitesError;

  return (
    <div>
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

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-900 mr-4">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workspace Members</h2>
            {!isLoading && (
              <p className="text-sm text-gray-500 mt-1">
                {members.length} member{members.length !== 1 ? 's' : ''}
                {pendingInvites.length > 0 && ` • ${pendingInvites.length} pending invite${pendingInvites.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        </div>
        <button 
          className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2"
          onClick={() => setShowInviteModal(true)}
        >
          <Mail className='h-4 w-4' />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading members...</span>
                    </div>
                  )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="text-sm text-red-700 mt-1">{membersError || invitesError}</p>
      </div>
            <div className="ml-auto pl-3">
              <button
                onClick={refreshData}
                className="text-sm text-red-800 hover:text-red-900 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      {!isLoading && !hasError && (
        <MembersTable 
          members={members} 
          pendingInvites={pendingInvites}
          onRemoveUser={handleRemoveUser}
          onChangeRole={handleChangeUserRole}
          loadingRemove={loadingRemove}
          loadingRoleChange={loadingRoleChange}
          currentUserId={currentUserId}
        />
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSubmit={handleInviteSubmitWrapper}
        loading={loadingInvite}
      />
    </div>
  );
} 