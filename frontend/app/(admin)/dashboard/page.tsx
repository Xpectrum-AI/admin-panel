"use client";

import { useEffect, useState } from 'react';
import { useAuthInfo } from '@propelauth/react';
import { ProtectedRoute } from "../../(admin)/auth/ProtectedRoute";
import Header from './Header';

import { Calendar, UserCheck, Lock, CircleCheckBig, Star, Info } from 'lucide-react';
import { SyncLoader } from 'react-spinners';
import axios from 'axios';
import WelcomeSetupModal from '../components/WelcomeSetupModel';
import OrgSetup from '../components/OrgSetup';
import { removeUserFromOrg } from '@/service/orgService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { getAgentInfo } from '@/service/agentService';
import { calendarServiceAPI } from '@/service/calendarService';

const API_BASE_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'http://localhost:8001/api/v1';

interface Agent {
  agentId: string;
  chatbot_api?: string;
  chatbot_key?: string;
  tts_config?: {
    voice_id?: string;
    tts_api_key?: string;
    model?: string;
    speed?: number;
  };
  stt_config?: {
    api_key?: string;
    model?: string;
    language?: string;
  };
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  location?: string;
  attendees?: any[];
  description?: string;
}

export default function Dashboard() {
  const { accessToken, user, loading, orgHelper } = useAuthInfo();
  const [callbackCompleted, setCallbackCompleted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [showOrgChoice, setShowOrgChoice] = useState(false);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'agents'>('calendar');
  const { showError, showSuccess } = useErrorHandler();

  // Calendar states
  const [hasCalendarAccess, setHasCalendarAccess] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // Agents states
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(false);

  // Services states
  const [showCalendarSetup, setShowCalendarSetup] = useState(false);

  useEffect(() => {
    if (!loading && orgHelper) {
      const orgs = orgHelper.getOrgs?.() || [];
      setOrgs(orgs);
      if (orgs.length === 0) {
        setShowOrgSetup(true);
        setShowOrgChoice(false);
      } else if (orgs.length > 1) {
        setShowOrgSetup(false);
        setShowOrgChoice(true);
      } else {
        setShowOrgSetup(false);
        setShowOrgChoice(false);
      }
    }
  }, [loading, orgHelper]);

  useEffect(() => {
    const callAuthCallback = async () => {
      if (!accessToken) {
        setCallbackCompleted(true);
        return;
      }
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/callback`, {
          access_token: accessToken
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setCallbackCompleted(true);
      } catch (error: any) {
        console.error('Auth callback failed:', error?.response?.data || error?.message || error);
        setCallbackCompleted(true);
      }
    };
    callAuthCallback();
  }, [accessToken]);

  useEffect(() => {
    const checkWelcome = async () => {
      if (!accessToken) {
        setCallbackCompleted(true);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/welcome-form/status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000
        });
        setShowWelcome(!res.data.has_completed_welcome_form);
      } catch (error: any) {
        console.error('Welcome form status check failed:', error?.response?.data || error?.message || error);
        setShowWelcome(false);
      }
    };
    checkWelcome();
  }, [accessToken]);

  // Load calendar access
  useEffect(() => {
    if (!accessToken) return;
    const fetchCalendarAccess = async () => {
      try {
        const result = await calendarServiceAPI.getCalendarAccess(accessToken);
        setHasCalendarAccess(result.has_calendar_access || false);
      } catch {
        setHasCalendarAccess(false);
      }
    };
    fetchCalendarAccess();
  }, [accessToken]);

  // Load calendar events
  useEffect(() => {
    if (!accessToken || !hasCalendarAccess) return;
    const loadCalendarEvents = async () => {
      setLoadingCalendar(true);
      try {
        const result = await calendarServiceAPI.getServices(accessToken);
        if (result.success && result.events) {
          setCalendarEvents(result.events);
        }
      } catch (error) {
        console.error('Failed to load calendar events:', error);
      } finally {
        setLoadingCalendar(false);
      }
    };
    loadCalendarEvents();
  }, [accessToken, hasCalendarAccess]);

  // Load agent info
  useEffect(() => {
    if (!orgs.length) return;
    const orgId = orgs[0]?.orgId;
    if (!orgId) return;

    const fetchAgent = async () => {
      setLoadingAgent(true);
      try {
        const data = await getAgentInfo(orgId);
        if (data.success && data.agent && !(data.agent.status === "error" && data.agent.message)) {
          setAgent(data.agent);
        } else {
          setAgent(null);
        }
      } catch (error: any) {
        console.error('Failed to fetch agent:', error);
        setAgent(null);
      } finally {
        setLoadingAgent(false);
      }
    };
    fetchAgent();
  }, [orgs]);

  const handleChooseOrg = async (chosenOrgId: string) => {
    if (!user?.userId) {
      showError('User not found. Please log in again.');
      return;
    }
    const orgsToRemove = orgs.filter((org: any) => (org.orgId || org.id) !== chosenOrgId);
    try {
      await Promise.all(orgsToRemove.map((org: any) =>
        removeUserFromOrg(org.orgId || org.id, user.userId)
      ));
      showSuccess('Workspace selected successfully!');
      setShowOrgChoice(false);
      window.location.reload();
    } catch (err: any) {
      showError(err?.message || 'Failed to update workspace selection. Please try again.');
    }
  };

  const buyCalendarService = async () => {
    if (!accessToken) {
      showError('No access token available');
      return;
    }
    try {
      const result = await calendarServiceAPI.buyService(accessToken);
      window.location.href = result.redirect_url;
      showSuccess('Redirecting to purchase calendar service...');
    } catch (error) {
      showError('Failed to initiate calendar service purchase');
    }
  };

  if (!callbackCompleted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <SyncLoader size={15} color="#000000" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {showOrgSetup && <OrgSetup onOrgCreated={() => setShowOrgSetup(false)} />}
      {showOrgChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in max-h-[90vh] flex flex-col border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Choose Your Workspace</h2>
            <ul className="space-y-4">
              {orgs.map((org: any) => (
                <li
                  key={org.orgId || org.id}
                  className="border border-gray-300 rounded-xl p-4 flex flex-col bg-gray-50"
                >
                  <div className="font-semibold text-lg text-gray-900">{org.orgName || org.name}</div>
                  <div className="text-gray-600 text-sm mb-2">{org.description || org.metadata?.description || ''}</div>
                  <button
                    className="mt-2 px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition min-w-[160px]"
                    onClick={() => handleChooseOrg(org.orgId || org.id)}
                  >
                    Choose this workspace
                  </button>
                </li>
              ))}
            </ul>
            <div className="text-sm text-gray-500 mt-4">
              You can only be part of one workspace. Choosing one will remove you from the others.
            </div>
          </div>
        </div>
      )}
      {!showOrgSetup && !showOrgChoice && showWelcome && <WelcomeSetupModal onComplete={() => setShowWelcome(false)} />}
      
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-lg text-gray-600">
                  Manage your calendar and AI agents
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'calendar' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'agents' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Agents</span>
              </button>
            </div>



            {activeTab === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Section */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
                      {hasCalendarAccess && (
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                          + New Event
                        </button>
                      )}
                    </div>
                    
                    {!hasCalendarAccess ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-gray-100 p-3 mb-4">
                          <Lock className="h-8 w-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Calendar Access Required</h3>
                        <p className="text-gray-600 mb-6 max-w-md">
                          Get access to our powerful calendar management system to schedule meetings, track events, and manage your time effectively.
                        </p>
                        <div className="grid gap-4 mb-6 text-left">
                          <div className="flex items-center gap-2">
                            <CircleCheckBig className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Schedule and manage appointments</span>
                          </div>
                          <div className="flex items-center gap-2">
                          <CircleCheckBig className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Integration with external calendars</span>
                          </div>
                          <div className="flex items-center gap-2">
                          <CircleCheckBig className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Team collaboration features</span>
                          </div>
                          <div className="flex items-center gap-2">
                          <CircleCheckBig className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Automated reminders and notifications</span>
                          </div>
                        </div>
                        <button
                          onClick={buyCalendarService}
                          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <Star className="h-4 w-4" />
                          Request Calendar Access
                        </button>
                      </div>
                    ) : (
                      <div>
                        {loadingCalendar ? (
                          <div className="flex justify-center py-8">
                            <SyncLoader size={10} color="#3B82F6" />
                          </div>
                        ) : (
                          <div>
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold mb-4">Today's Events</h3>
                              {calendarEvents.length > 0 ? (
                                <div className="space-y-3">
                                  {calendarEvents.slice(0, 5).map((event) => (
                                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-semibold text-gray-900">{event.summary}</h4>
                                          <p className="text-sm text-gray-600">
                                            {new Date(event.start.dateTime).toLocaleTimeString()} - {new Date(event.end.dateTime).toLocaleTimeString()}
                                          </p>
                                          {event.location && (
                                            <p className="text-sm text-gray-500">📍 {event.location}</p>
                                          )}
                                        </div>
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                          {event.attendees?.length || 0} attendees
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-8">No events scheduled for today</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Events Sidebar - Only show when calendar access is available */}
                {hasCalendarAccess && (
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                      {calendarEvents.length > 0 ? (
                        <div className="space-y-3">
                          {calendarEvents.slice(0, 3).map((event) => (
                            <div key={event.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{event.summary}</h4>
                                  <p className="text-xs text-gray-500">
                                    {new Date(event.start.dateTime).toLocaleDateString()}
                                  </p>
                                </div>
                                <button className="text-xs text-gray-500 hover:text-gray-700">
                                  View Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No upcoming events</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">My Agents</h2>
                  <div className="bg-blue-50 flex items-center text-blue-700 px-4 py-2 rounded-lg text-sm">
                    <span className="mr-2"><Info className="w-4 h-4" /></span>
                    <span><span className="font-semibold">View Only:</span> You can view your assigned agents but cannot modify them</span>
                  </div>
                </div>

                {loadingAgent ? (
                  <div className="flex justify-center py-8">
                    <SyncLoader size={15} color="#3B82F6" />
                  </div>
                ) : agent ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-700">
                          <th className="px-6 py-3 text-left font-semibold">Agent ID</th>
                          <th className="px-6 py-3 text-left font-semibold">Phone Number</th>
                          <th className="px-6 py-3 text-left font-semibold">TTS Model</th>
                          <th className="px-6 py-3 text-left font-semibold">STT Model</th>
                          <th className="px-6 py-3 text-left font-semibold">Status</th>
                          <th className="px-6 py-3 text-left font-semibold">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="px-6 py-4 font-medium">{agent.agentId || 'Not set'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              agent.phone_number 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {agent.phone_number || 'Not set'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{agent.tts_config?.model || 'N/A'}</td>
                          <td className="px-6 py-4">{agent.stt_config?.model || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              agent.phone_number 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {agent.phone_number ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {agent.updated_at ? new Date(agent.updated_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Agent not assigned to you</h3>
                    <p className="text-gray-600">
                      No agent is currently assigned to this workspace. Please contact your administrator if you believe this is an error.
                    </p>
                  </div>
                )}
              </div>
            )}


          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 