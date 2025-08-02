import React, { useState, useEffect, useCallback } from 'react';
import StatCards from './StatCards';
import UsersTab from './UsersTab';
import OrganizationsTab from './OrganizationsTab';
import RolesPermissionsTab from './RolesPermissionsTab';
import AuditLogsTab from './AuditLogsTab';
import SystemTab from './SystemTab';
import AgentsTab from './AgentsTab';
import SuperAdminTeamTab from './SuperAdminTeamTab';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchUsersByQuery } from '@/service/userService';
import { fetchOrgByQuery, inviteUserToOrg, removeUserFromOrg, changeUserRoleInOrg } from '@/service/orgService';
import { getAllAgents, getTrunks } from '@/service/agentService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { fetchUsersInOrg } from '@/service/orgService';

const SUPER_ADMIN_ORG_ID = process.env.SUPER_ADMIN_ORG_ID || "7f4f4566-0435-42d0-ab5f-80c6018f625b";
// const SUPER_ADMIN_ORG_ID = "c53e8731-2ce7-4484-919c-0aba50c2f46a";

const tabs = [
    'Users',
    'Organizations',
    'Agents',
    'Team',
    'Roles & Permissions',
    'Audit Logs',
    'System',
];

export default function SuperAdminPanel() {
    const { showError, showSuccess } = useErrorHandler();
    const [activeTab, setActiveTab] = useState('Users');
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [totalOrgs, setTotalOrgs] = useState<number | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [orgs, setOrgs] = useState<any[]>([]);
    const [userPageNumber, setUserPageNumber] = useState(0);
    const [orgPageNumber, setOrgPageNumber] = useState(0);
    const userPageSize = 10;
    const orgPageSize = 10;
    const router = useRouter();
    const [agents, setAgents] = useState<any[]>([]);
    const [totalAgents, setTotalAgents] = useState<number>(0);
    const [agentPageNumber, setAgentPageNumber] = useState(0);
    const agentPageSize = 10;
    const [agentsLoading, setAgentsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [superAdminTeam, setSuperAdminTeam] = useState<any[]>([]);
    const [loadingInvite, setLoadingInvite] = useState(false);
    const [loadingRemove, setLoadingRemove] = useState(false);
    const [loadingRoleChange, setLoadingRoleChange] = useState(false);
    const [trunks, setTrunks] = useState<any[]>([]);

    // Set mounted flag after component mounts
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch users when userPageNumber changes
    useEffect(() => {
        if (!mounted) return;
        
        const fetchUsers = async () => {
            try {
                const res = await fetchUsersByQuery({ pageSize: userPageSize, pageNumber: userPageNumber, includeOrgs: true });
                if (mounted) {
                    setUsers(res.data?.users || res.data || []);
                    setTotalUsers(res.data?.totalUsers || res.totalUsers || 0);
                }
            } catch (error) {
                if (mounted) {
                    setUsers([]);
                    setTotalUsers(0);
                }
            }
        };

        fetchUsers();
    }, [userPageNumber, mounted]);

    // Fetch orgs when orgPageNumber changes
    useEffect(() => {
        if (!mounted) return;
        
        const fetchOrgs = async () => {
            try {
                const res = await fetchOrgByQuery({ pageSize: orgPageSize, pageNumber: orgPageNumber });
                if (mounted) {
                    // Ensure orgs is always an array
                    const orgsData = res.data?.orgs;
                    const orgsArray = Array.isArray(orgsData) ? orgsData : [];
                    setOrgs(orgsArray);
                    setTotalOrgs(res.data?.totalOrgs || 0);
                }
            } catch (error) {
                console.error('Error fetching orgs:', error);
                if (mounted) {
                    setOrgs([]);
                    setTotalOrgs(0);
                }
            }
        };

        fetchOrgs();
    }, [orgPageNumber, mounted]);

    // Fetch agents when agentPageNumber changes
    useEffect(() => {
        if (!mounted) return;
        
        const fetchAgents = async () => {
            setAgentsLoading(true);
            try {
                const data = await getAllAgents();
                if (mounted) {
                    const agentsArray = Array.isArray(data.agents) ? data.agents : [];
                    setAgents(agentsArray);
                    setTotalAgents(agentsArray.length);
                }
            } catch (error: any) {
                if (mounted) {
                    setAgents([]);
                    setTotalAgents(0);
                    showError(error.message || 'Failed to fetch agents');
                }
            } finally {
                if (mounted) {
                    setAgentsLoading(false);
                }
            }
        };

        fetchAgents();
    }, [agentPageNumber, mounted]);

    // Fetch trunks on mount
    useEffect(() => {
        const fetchTrunks = async () => {
            try {
                const res = await getTrunks();
                setTrunks(res.trunks || []);
            } catch (error) {
                setTrunks([]);
                showError('Failed to fetch trunks');
            }
        };
        fetchTrunks();
    }, []);

    // Refresh agents utility for children
    const refreshAgents = async () => {
        if (!mounted) return;
        
        setAgentsLoading(true);
        try {
            const data = await getAllAgents();
            if (mounted) {
                const agentsArray = Array.isArray(data.agents) ? data.agents : [];
                setAgents(agentsArray);
                setTotalAgents(agentsArray.length);
            }
        } catch (error: any) {
            if (mounted) {
                setAgents([]);
                setTotalAgents(0);
                showError(error.message || 'Failed to refresh agents');
            }
        } finally {
            if (mounted) {
                setAgentsLoading(false);
            }
        }
    };

    // Fetch super admin team - fixed to prevent infinite loops
    const fetchTeam = useCallback(async () => {
        try {
            const team = await fetchUsersInOrg(SUPER_ADMIN_ORG_ID);
            setSuperAdminTeam(Array.isArray(team) ? team : team?.users || []);
        } catch (e: any) {
            showError(e.message || "Failed to fetch super admin team");
            setSuperAdminTeam([]);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "Team") {
            fetchTeam();
        }
    }, [activeTab, fetchTeam]);

    // Super Admin Team Handlers
    const handleInviteMember = async (form: { email: string; role: string }) => {
        setLoadingInvite(true);
        try {
            await inviteUserToOrg(SUPER_ADMIN_ORG_ID, form.email, form.role);
            showSuccess('Invitation sent successfully!');
            // Refresh team data
            await fetchTeam();
        } catch (error: any) {
            showError(error.message || 'Failed to send invitation');
            throw error;
        } finally {
            setLoadingInvite(false);
        }
    };

    const handleRemoveUser = async (userId: string, userName: string) => {
        setLoadingRemove(true);
        try {
            await removeUserFromOrg(SUPER_ADMIN_ORG_ID, userId);
            showSuccess(`${userName} has been removed from the super admin team`);
            // Refresh team data
            await fetchTeam();
        } catch (error: any) {
            showError(error.message || 'Failed to remove user');
            throw error;
        } finally {
            setLoadingRemove(false);
        }
    };

    const handleChangeRole = async (userId: string, newRole: string, userName: string) => {
        setLoadingRoleChange(true);
        try {
            await changeUserRoleInOrg(SUPER_ADMIN_ORG_ID, userId, newRole);
            showSuccess(`${userName}'s role has been changed to ${newRole}`);
            // Refresh team data
            await fetchTeam();
        } catch (error: any) {
            showError(error.message || 'Failed to change user role');
            throw error;
        } finally {
            setLoadingRoleChange(false);
        }
    };

    const stats = [
        { title: 'Total Organizations', value: totalOrgs !== null ? totalOrgs.toLocaleString() : '...', percentage: '', Icon: undefined, trend: 'up' },
        { title: 'Total Users', value: totalUsers !== null ? totalUsers.toLocaleString() : '...', percentage: '', Icon: undefined, trend: 'up' },
        { title: 'System Health', value: '98.5%', percentage: 'All systems operational', Icon: undefined, trend: 'up' },
        { title: 'Critical Issues', value: '2', percentage: '15 support tickets', Icon: undefined, trend: 'down' },
    ];

    return (
        <div className="flex flex-col min-h-screen ">
            <header className="container flex h-16 items-center px-4 border-b border-gray-200">
                <button onClick={() => router.back()} className="group mr-3" aria-label="Back">
                    <span className="inline-flex items-center justify-center rounded-lg transition bg-transparent group-hover:bg-gray-100 h-8 w-8">
                        <ArrowLeft className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />
                    </span>
                </button>
                <div className="flex items-center space-x-3 flex-grow">
                    <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-lg">SA</div>
                    <h1 className="text-2xl font-semibold text-gray-900">Super Admin Panel</h1>
                </div>
                <span className="ml-auto bg-red-100 text-red-800 px-4 py-1 rounded-full text-xs font-medium">Developer Access</span>
            </header>
            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    <StatCards stats={stats} />
                    <div className="w-full mx-auto">
                        <div className="flex bg-gray-100 rounded-xl p-1 mb-8 border border-gray-200 gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    className={`flex-1 py-1 rounded-lg font-medium transition text-base focus:outline-none ${activeTab === tab ? 'bg-white shadow text-gray-900 font-semibold border border-gray-200' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white">
                            {activeTab === 'Users' && (
                                <UsersTab
                                    users={users}
                                    totalUsers={totalUsers || 0}
                                    pageNumber={userPageNumber}
                                    pageSize={userPageSize}
                                    setPageNumber={setUserPageNumber}
                                />
                            )}
                            {activeTab === 'Organizations' && (
                                <OrganizationsTab
                                    orgs={orgs}
                                    totalOrgs={totalOrgs || 0}
                                    pageNumber={orgPageNumber}
                                    pageSize={orgPageSize}
                                    setPageNumber={setOrgPageNumber}
                                />
                            )}
                            {activeTab === 'Agents' && (
                                <AgentsTab
                                    agents={agents}
                                    totalAgents={totalAgents}
                                    pageNumber={agentPageNumber}
                                    pageSize={agentPageSize}
                                    setPageNumber={setAgentPageNumber}
                                    loading={agentsLoading}
                                    refreshAgents={refreshAgents}
                                    orgs={orgs}
                                    trunks={trunks}
                                />
                            )}
                            {activeTab === 'Team' && (
                                <SuperAdminTeamTab 
                                    members={superAdminTeam}
                                    onInviteMember={handleInviteMember}
                                    onRemoveUser={handleRemoveUser}
                                    onChangeRole={handleChangeRole}
                                    loadingInvite={loadingInvite}
                                    loadingRemove={loadingRemove}
                                    loadingRoleChange={loadingRoleChange}
                                />
                            )}
                            {activeTab === 'Roles & Permissions' && <RolesPermissionsTab />}
                            {activeTab === 'Audit Logs' && <AuditLogsTab />}
                            {activeTab === 'System' && <SystemTab />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 