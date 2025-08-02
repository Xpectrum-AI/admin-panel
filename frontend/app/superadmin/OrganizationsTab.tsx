import React, { useState } from 'react';
import { Search, Filter, Eye, Users, Shield, Lock, Activity, Copy, Check } from 'lucide-react';
import Pagination from './Pagination';
import ActionMenu from './ActionMenu';
import { fetchOrgDetails, fetchUsersInOrg, fetchPendingInvites } from '@/service/orgService';
import { useError } from '../(admin)/contexts/ErrorContext';

interface OrganizationsTabProps {
  orgs: any[];
  totalOrgs: number;
  pageNumber: number;
  pageSize: number;
  setPageNumber: (n: number) => void;
}

function OrgDetails({ org, loading, hasSelected, error }: { org: any, loading: boolean, hasSelected: boolean, error?: string }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1200);
    } catch {}
  };

  if (loading) {
    return <div className="bg-white rounded-xl border border-gray-200   p-8 w-full h-full flex items-center justify-center text-gray-400 text-lg">Loading...</div>;
  }
  if (error) {
    return <div className="bg-white rounded-xl border border-gray-200   p-8 w-full h-full flex items-center justify-center text-red-400 text-lg">{error}</div>;
  }
  if (!org && !hasSelected) {
    return <div className="bg-white rounded-xl border border-gray-200   p-8 w-full h-full flex items-center justify-center text-gray-400 text-lg">Select an organization to view details</div>;
  }
  if (!org && hasSelected) {
    return <div className="bg-white rounded-xl border border-gray-200   p-8 w-full h-full flex items-center justify-center text-gray-400 text-lg">No details found for this organization.</div>;
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200   p-8 w-full">
      <h3 className="text-2xl font-semibold mb-6">Organization Details</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <div className="text-gray-500">Name</div>
          <div className="font-bold text-lg text-gray-900 mb-2">{org.name}</div>
        </div>
        <div>
          <div className="text-gray-500">Organization ID</div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 break-all">{org.orgId}</span>
            <button
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => handleCopy(org.orgId, 'orgId')}
              title="Copy Org ID"
            >
              {copiedField === 'orgId' ? <Check className="w-4 h-4 text-gray-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </div>
        <div>
          <div className="text-gray-500">URL Slug</div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{org.urlSafeOrgSlug}</span>
            <button
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => handleCopy(org.urlSafeOrgSlug, 'urlSlug')}
              title="Copy URL Slug"
            >
              {copiedField === 'urlSlug' ? <Check className="w-4 h-4 text-gray-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </div>
        <div>
          <div className="text-gray-500">Can Setup SAML</div>
          <div className="text-gray-900">{org.canSetupSaml ? 'Yes' : 'No'}</div>
        </div>
        <div>
          <div className="text-gray-500">SAML Configured</div>
          <div className="text-gray-900">{org.isSamlConfigured ? 'Yes' : 'No'}</div>
        </div>
        <div>
          <div className="text-gray-500">SAML Test Mode</div>
          <div className="text-gray-900">{org.isSamlInTestMode ? 'Yes' : 'No'}</div>
        </div>
        <div>
          <div className="text-gray-500">Extra Domains</div>
          <div className="flex flex-wrap gap-2">{org.extraDomains && org.extraDomains.length > 0 ? org.extraDomains.map((d: string) => <span key={d} className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">{d}</span>) : <span className="text-gray-400">None</span>}</div>
        </div>
        <div>
          <div className="text-gray-500">Domain Auto-join</div>
          <div className="text-gray-900">{org.domainAutojoin ? 'Enabled' : 'Disabled'}</div>
        </div>
        <div>
          <div className="text-gray-500">Domain Restrict</div>
          <div className="text-gray-900">{org.domainRestrict ? 'Enabled' : 'Disabled'}</div>
        </div>
        <div>
          <div className="text-gray-500">Custom Role Mapping</div>
          <div className="text-gray-900">{org.customRoleMappingName || '-'}</div>
        </div>
      </div>
      <div className="mt-6">
        <div className="text-gray-500 mb-1">Metadata</div>
        <pre className="bg-gray-50 rounded p-3 text-sm text-gray-700 overflow-x-auto w-full min-h-[80px]">
          {JSON.stringify(org.metadata || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function MembersPanel({ members, invites, loading }: {
  members: any[];
  invites: any[];
  loading: boolean;
}) {
  const safeMembers = Array.isArray(members) ? members : [];
  const safeInvites = Array.isArray(invites) ? invites : [];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 w-full">
      <h3 className="text-2xl font-semibold mb-6">Organization Members</h3>
      {loading ? (
        <div className="py-10 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-2">Members</h3>
            {safeMembers.length === 0 ? (
              <div className="text-gray-400 mb-4">No users found in this organization.</div>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-1 mb-4">
                <thead>
                  <tr className="text-gray-500 text-base">
                    <th className="py-2 px-3 text-left font-semibold">Name</th>
                    <th className="py-2 px-3 text-left font-semibold">Email</th>
                    <th className="py-2 px-3 text-left font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {safeMembers.map((m, idx) => (
                    <tr key={m.userId || m.email || idx} className="bg-white border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-900">{m.firstName || m.lastName ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : m.username || m.email}</td>
                      <td className="py-2 px-3 text-gray-700">{m.email}</td>
                      <td className="py-2 px-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${m.roleInOrg === 'Admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>{m.roleInOrg}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Pending Invites</h3>
            {safeInvites.length === 0 ? (
              <div className="text-gray-400">No pending invites.</div>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-1">
                <thead>
                  <tr className="text-gray-500 text-base">
                    <th className="py-2 px-3 text-left font-semibold">Email</th>
                    <th className="py-2 px-3 text-left font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {safeInvites.map((invite, idx) => (
                    <tr key={invite.email || idx} className="bg-white border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-700">{invite.inviteeEmail}</td>
                      <td className="py-2 px-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{invite.roleInOrg}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrganizationsTab({ orgs, totalOrgs, pageNumber, pageSize, setPageNumber }: OrganizationsTabProps) {
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [orgDetails, setOrgDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [panelMode, setPanelMode] = useState<'details' | 'members'>('details');
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const { showError } = useError();

  // Process org data for display
  const processedOrgs = (Array.isArray(orgs) ? orgs : []).map((org: any) => {
    const name = org.metadata?.displayName || org.orgName || org.name || '-';
    const slug = org.urlSlug || org.slug || org.orgId || org.org_id || org.id || '-';
    return {
      orgId: org.orgId || org.org_id || org.id,
      name,
      slug,
      org,
    };
  });

  // Filter orgs in-memory
  const filteredOrgs = processedOrgs.filter(org => {
    const searchLower = search.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.slug.toLowerCase().includes(searchLower)
    );
  });

  async function handleViewMembers(org: any) {
    setPanelMode('members');
    setMembersLoading(true);
    try {
      const [members, invites] = await Promise.all([
        fetchUsersInOrg(org.orgId || org.org_id || org.id),
        fetchPendingInvites(org.orgId || org.org_id || org.id),
      ]);
      const safeMembers = Array.isArray(members) ? members : (members?.users || []);
      setOrgMembers(safeMembers);
      setPendingInvites(Array.isArray(invites) ? invites : (invites?.invites || []));
    } catch (e: any) {
      setOrgMembers([]);
      setPendingInvites([]);
      showError('Failed to fetch members or invites', 'error');
    }
    setMembersLoading(false);
  }

  async function handleViewDetails(org: any) {
    setPanelMode('details');
    setSelectedOrg(org);
    setLoading(true);
    setOrgDetails(null);
    setHasSelected(true);
    setError(undefined);
    try {
      const res = await fetchOrgDetails(org.orgId || org.org_id || org.id);
      if (res && typeof res === 'object') {
        setOrgDetails(res);
      } else {
        setOrgDetails(null);
      }
    } catch (e) {
      setOrgDetails(null);
      setError('Failed to fetch organization details.');
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-6">
      {/* Orgs List (Left) */}
      <div className="bg-white w-1/2 rounded-xl border border-gray-200 p-6 flex flex-col">
        <div className='flex flex-col space-y-1.5'>
          <div className='flex justify-between items-center'>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Organizations</h3>
            <div className='flex space-x-2'>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
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
        <div className="mt-6 flex-1">
          {filteredOrgs.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No organizations found.</div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {filteredOrgs.map(({ orgId, name, slug, org }) => (
                <div key={orgId} className="flex items-center justify-between py-5 px-2 hover:bg-gray-50 transition">
                  <div>
                    <div className="font-bold text-lg text-gray-900">{name}</div>
                    <div className="text-sm text-gray-400">{slug}</div>
                  </div>
                  <ActionMenu
                    actions={[
                      {
                        label: 'View Details',
                        icon: <Eye className="w-5 h-5" />,
                        onClick: () => {
                          console.log('View Details clicked', org);
                          handleViewDetails(org);
                        },
                      },
                      {
                        label: 'View Members',
                        icon: <Users className="w-5 h-5" />,
                        onClick: () => handleViewMembers(org),
                      },
                      {
                        label: 'SAML Settings',
                        icon: <Shield className="w-5 h-5" />,
                        onClick: () => {/* TODO: handle SAML settings */ },
                      },
                      {
                        label: 'View Analytics',
                        icon: <Activity className="w-5 h-5" />,
                        onClick: () => {/* TODO: handle view analytics */ },
                      },
                      {
                        label: 'Suspend Organization',
                        icon: <Lock className="w-5 h-5" />,
                        onClick: () => {/* TODO: handle suspend org */ },
                        danger: true,
                      },
                    ]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <Pagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalResults={totalOrgs}
          onPageChange={setPageNumber}
        />
      </div>
      {/* Org Details (Right) */}
      <div className="w-1/2">
        {panelMode === 'details' ? <OrgDetails org={orgDetails} loading={loading} hasSelected={hasSelected} error={error} /> : <MembersPanel members={orgMembers} invites={pendingInvites} loading={membersLoading} />}
      </div>
    </div>
  );
} 