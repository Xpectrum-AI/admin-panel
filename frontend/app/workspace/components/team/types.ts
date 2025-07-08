export interface OrgMember {
  userId: string;
  roleInOrg: string;
  additionalRolesInOrg: string[];
  email: string;
  emailConfirmed: boolean;
  hasPassword: boolean;
  username: string;
  firstName: string;
  lastName: string;
  pictureUrl: string;
  properties: Record<string, any>;
  metadata: any;
  locked: boolean;
  enabled: boolean;
  mfaEnabled: boolean;
  canCreateOrgs: boolean;
  createdAt: number;
  lastActiveAt: number;
  updatePasswordRequired: boolean;
}

export interface PendingInvite {
  inviteeEmail: string;
  orgId: string;
  orgName: string;
  roleInOrg: string;
  additionalRolesInOrg: string[];
  createdAt: number;
  expiresAt: number;
  inviterEmail: string | null;
  inviterUserId: string | null;
}

export interface OrgMembersResponse {
  success: boolean;
  data: {
    users: OrgMember[];
    totalUsers: number;
    currentPage: number;
    pageSize: number;
    hasMoreResults: boolean;
  };
}

export interface PendingInvitesResponse {
  success: boolean;
  data: {
    totalInvites: number;
    currentPage: number;
    pageSize: number;
    hasMoreResults: boolean;
    invites: PendingInvite[];
  };
}

export interface InviteForm {
  email: string;
  role: string;
} 