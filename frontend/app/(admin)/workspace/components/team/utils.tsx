import React from 'react';
import { Crown, Shield, Eye } from 'lucide-react';
import { OrgMember } from './types';

export const getRoleIcon = (role: string): React.ReactElement => {
  switch (role) {
    case 'Owner':
      return <Crown className="h-4 w-4" />;
    case 'Admin':
      return <Shield className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
};

export const getStatusBadge = (member: OrgMember): React.ReactElement => {
  if (!member.enabled) {
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Disabled</span>;
  }
  if (member.locked) {
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Locked</span>;
  }
  if (!member.emailConfirmed) {
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Pending</span>;
  }
  return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white">Active</span>;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

export const isExpired = (expiresAt: number): boolean => {
  return Date.now() > expiresAt * 1000;
};

export const sortMembersByName = (members: OrgMember[]): OrgMember[] => {
  return members.sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

export const getMemberInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
}; 