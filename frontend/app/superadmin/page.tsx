"use client"

import React, { useState } from 'react';
import StatCard from '../dashboard/StatCard';
import { Users, Building2, HeartPulse, AlertTriangle, Search, Filter, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const stats = [
    {
        title: 'Total Organizations',
        value: '1,247',
        percentage: '+12% from last month',
        Icon: Building2,
        trend: 'up' as const,
    },
    {
        title: 'Total Users',
        value: '15,832',
        percentage: '8,943 active',
        Icon: Users,
        trend: 'up' as const,
    },
    {
        title: 'System Health',
        value: '98.5%',
        percentage: 'All systems operational',
        Icon: HeartPulse,
        trend: 'up' as const,
    },
    {
        title: 'Critical Issues',
        value: '2',
        percentage: '15 support tickets',
        Icon: AlertTriangle,
        trend: 'down' as const,
    },
];

const userRows = [
    { name: 'John Doe', email: 'john@acmecorp.com', org: 'Acme Corp', role: 'Admin', status: 'Active', lastLogin: '2 hours ago' },
    { name: 'Jane Smith', email: 'jane@techstart.com', org: 'TechStart', role: 'Member', status: 'Active', lastLogin: '1 day ago' },
    { name: 'Bob Wilson', email: 'bob@enterprise.com', org: 'Enterprise Co', role: 'Admin', status: 'Suspended', lastLogin: '1 week ago' },
    { name: 'Alice Brown', email: 'alice@startup.com', org: 'Startup Inc', role: 'Member', status: 'Active', lastLogin: '30 minutes ago' },
];

const orgRows = [
    { org: 'Acme Corp', owner: 'John Doe', users: 25, plan: 'Pro', billing: '$99/month', status: 'Active', lastActive: '2 hours ago' },
    { org: 'TechStart', owner: 'Jane Smith', users: 8, plan: 'Basic', billing: '$29/month', status: 'Active', lastActive: '1 day ago' },
    { org: 'Enterprise Co', owner: 'Bob Wilson', users: 150, plan: 'Enterprise', billing: '$499/month', status: 'Active', lastActive: '30 minutes ago' },
    { org: 'Startup Inc', owner: 'Alice Brown', users: 5, plan: 'Basic', billing: '$29/month', status: 'Suspended', lastActive: '1 week ago' },
];

const tabs = [
    'Users',
    'Organizations',
    'Roles & Permissions',
    'Audit Logs',
    'System',
];

export default function SuperAdminPanel() {
    const [activeTab, setActiveTab] = useState('Users');
    const router = useRouter();

    return (
        <div className="flex flex-col min-h-screen ">
            {/* Header */}
            <header className="container flex h-16 items-center px-4 border-b border-gray-200">
                <button
                    onClick={() => router.back()}
                    className="group mr-3"
                    aria-label="Back"
                >
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
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, i) => (
                            <StatCard key={i} {...stat} />
                        ))}
                    </div>

                    {/* Tabs and Content Container */}
                    <div className="w-full mx-auto">
                        {/* Tabs */}
                        <div className="flex bg-gray-100 rounded-xl p-1 mb-8 border border-gray-200 gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    className={`flex-1 py-1 rounded-lg font-medium transition text-base focus:outline-none
                                ${activeTab === tab
                                            ? 'bg-white shadow text-gray-900 font-semibold border border-gray-200'
                                            : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            {activeTab === "Users" && (
                                <div className="bg-white ">
                                    <div className='flex flex-col space-y-1.5 '>
                                        <div className='flex justify-between items-center'>
                                            <h3 className="text-2xl font-semibold leading-none tracking-tight">Global User Management</h3>
                                            <div className='flex space-x-2'>
                                                <div className="relative w-full max-w-xs">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                                </div>
                                                <button className="ml-2 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
                                                    <Filter className="h-5 w-5 text-gray-500" />
                                                </button>

                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
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
                                                {userRows.map((row, i) => (
                                                    <tr key={i} className="bg-white rounded-xl shadow-sm">
                                                        <td className="py-4 px-4 font-bold text-gray-900">{row.name}</td>
                                                        <td className="py-4 px-4 text-gray-700">{row.email}</td>
                                                        <td className="py-4 px-4 text-gray-700">{row.org}</td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${row.role === 'Admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>{row.role}</span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${row.status === 'Active' ? 'bg-gray-900 text-white' : 'bg-red-100 text-red-600'}`}>{row.status}</span>
                                                        </td>
                                                        <td className="py-4 px-4 text-gray-700">{row.lastLogin}</td>
                                                        <td className="py-4 px-4">
                                                            <button className="p-1 rounded hover:bg-gray-100">
                                                                <span className="sr-only">Actions</span>
                                                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="6" r="1.5" fill="#9CA3AF" /><circle cx="12" cy="12" r="1.5" fill="#9CA3AF" /><circle cx="12" cy="18" r="1.5" fill="#9CA3AF" /></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {activeTab === "Organizations" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-6">Organization Management</h2>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="relative w-full max-w-xs">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input type="text" placeholder="Search organizations..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <button className="ml-2 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
                                            <Filter className="h-5 w-5 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="text-gray-500 border-b">
                                                    <th className="py-2 px-4 text-left font-medium">Organization</th>
                                                    <th className="py-2 px-4 text-left font-medium">Owner</th>
                                                    <th className="py-2 px-4 text-left font-medium">Users</th>
                                                    <th className="py-2 px-4 text-left font-medium">Plan</th>
                                                    <th className="py-2 px-4 text-left font-medium">Billing</th>
                                                    <th className="py-2 px-4 text-left font-medium">Status</th>
                                                    <th className="py-2 px-4 text-left font-medium">Last Active</th>
                                                    <th className="py-2 px-4 text-left font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orgRows.map((row, i) => (
                                                    <tr key={i} className="border-b last:border-0">
                                                        <td className="py-2 px-4 font-medium text-gray-900">{row.org}</td>
                                                        <td className="py-2 px-4">{row.owner}</td>
                                                        <td className="py-2 px-4">{row.users}</td>
                                                        <td className="py-2 px-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.plan === 'Pro' ? 'bg-gray-900 text-white' : row.plan === 'Enterprise' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>{row.plan}</span>
                                                        </td>
                                                        <td className="py-2 px-4">{row.billing}</td>
                                                        <td className="py-2 px-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status === 'Active' ? 'bg-gray-900 text-white' : 'bg-red-100 text-red-700'}`}>{row.status}</span>
                                                        </td>
                                                        <td className="py-2 px-4">{row.lastActive}</td>
                                                        <td className="py-2 px-4">
                                                            <button className="p-1 rounded hover:bg-gray-100">
                                                                <span className="sr-only">Actions</span>
                                                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="6" r="1.5" fill="#9CA3AF" /><circle cx="12" cy="12" r="1.5" fill="#9CA3AF" /><circle cx="12" cy="18" r="1.5" fill="#9CA3AF" /></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {activeTab === "Roles & Permissions" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-6">Roles & Permissions</h2>
                                    <p className="text-gray-500">Manage global roles and permissions here. (Coming soon)</p>
                                </div>
                            )}
                            {activeTab === "Audit Logs" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-6">Audit Logs</h2>
                                    <p className="text-gray-500">View system-wide audit logs here. (Coming soon)</p>
                                </div>
                            )}
                            {activeTab === "System" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-6">System</h2>
                                    <p className="text-gray-500">System settings and health checks. (Coming soon)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 