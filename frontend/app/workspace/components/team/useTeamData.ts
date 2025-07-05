import { useState, useEffect } from 'react';
import { inviteUserToOrg, fetchUsersInOrg, fetchPendingInvites, removeUserFromOrg, changeUserRoleInOrg } from '../../../services/orgService';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { OrgMember, PendingInvite, OrgMembersResponse, PendingInvitesResponse, InviteForm } from './types';
import { sortMembersByName } from './utils';

export function useTeamData(orgId: string) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState(false);
  const [loadingRoleChange, setLoadingRoleChange] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [invitesError, setInvitesError] = useState<string | null>(null);

  const { showError, showSuccess } = useErrorHandler();

  const fetchMembers = async () => {
    setLoadingMembers(true);
    setMembersError(null);
    try {
      const response: OrgMembersResponse = await fetchUsersInOrg(orgId);
      if (response.success) {
        const sortedMembers = sortMembersByName(response.data.users);
        setMembers(sortedMembers);
      } else {
        throw new Error('Failed to fetch members');
      }
    } catch (err: any) {
      const message = err.message || 'Failed to fetch organization members';
      setMembersError(message);
      showError(message);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchPendingInvitesData = async () => {
    setLoadingInvites(true);
    setInvitesError(null);
    try {
      const response: PendingInvitesResponse = await fetchPendingInvites(orgId);
      if (response.success) {
        setPendingInvites(response.data.invites);
      } else {
        throw new Error('Failed to fetch pending invites');
      }
    } catch (err: any) {
      const message = err.message || 'Failed to fetch pending invites';
      setInvitesError(message);
      showError(message);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleInviteSubmit = async (inviteForm: InviteForm) => {
    setLoadingInvite(true);
    try {
      await inviteUserToOrg(orgId, inviteForm.email, inviteForm.role);
      showSuccess('Invitation sent!');
      // Refresh both members and pending invites after successful invite
      await Promise.all([fetchMembers(), fetchPendingInvitesData()]);
    } catch (err: any) {
      const message = err.user_facing_error || err.message || 'Unable to send the request. Please try again.';
      showError(message);
      throw err;
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    setLoadingRemove(true);
    try {
      await removeUserFromOrg(orgId, userId);
      showSuccess(`${userName} has been removed from the organization`);
      await fetchMembers();
    } catch (err: any) {
      const message = err.user_facing_error || err.message || 'Failed to remove user from organization';
      showError(message);
      throw err;
    } finally {
      setLoadingRemove(false);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string, userName: string) => {
    setLoadingRoleChange(true);
    try {
      await changeUserRoleInOrg(orgId, userId, newRole);
      showSuccess(`${userName}'s role has been changed to ${newRole}`);
      await fetchMembers();
    } catch (err: any) {
      const message = err.user_facing_error || err.message || 'Failed to change user role';
      showError(message);
      throw err;
    } finally {
      setLoadingRoleChange(false);
    }
  };

  const refreshData = () => {
    fetchMembers();
    fetchPendingInvitesData();
  };

  // Fetch data on mount
  useEffect(() => {
    fetchMembers();
    fetchPendingInvitesData();
  }, [orgId]);

  return {
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
  };
} 