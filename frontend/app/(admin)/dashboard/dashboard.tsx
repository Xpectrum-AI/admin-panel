"use client";

import { useEffect, useState } from 'react';
import { useAuthInfo } from '@propelauth/react';
import Header from './Header';

import { 
  DocInfoModal, 
  OrgSetup, 
  OrgChoiceModal,
  CalendarEventsList,
  AgentsSection,
  DoctorsSection,
  CalendarAssignmentModal,
  DoctorCalendars,
  CreateCalendarModal,
  ShareCalendarModal,
  CreateEventModal,
  EditEventModal,
  ShowDocInfoModal,
  EmailVerificationDialog,
  EmailVerificationNotification
} from '../components';
import { Calendar } from '../components/calendar';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { removeUserFromOrg } from '@/service/orgService';
import { CalendarEvent } from '../components/calendar/types';
import { Agent } from '../components/common/types';
import { doctorApiService } from '@/service/doctorService';
import { calendarService } from '@/service/calendarService';
import { eventService } from '@/service/eventService';
import { agentApiService } from '@/service/agentService';

// Import CalendarData type
interface CalendarData {
  name: string;
  timezone: string;
}

export default function Dashboard() {
  const {user, loading, orgHelper } = useAuthInfo();
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [showOrgChoice, setShowOrgChoice] = useState(false);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'agents' | 'doctors'>('doctors');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [calendarsLoading, setCalendarsLoading] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<any>(null);
  const [showDocInfoModal, setShowDocInfoModal] = useState(false);
  const [showShowDocInfoModal, setShowShowDocInfoModal] = useState(false);
  const [showCalendarAssignmentModal, setShowCalendarAssignmentModal] = useState(false);
  const [showShareCalendarModal, setShowShareCalendarModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showCreateCalendarModal, setShowCreateCalendarModal] = useState(false);
  const [createdCalendarId, setCreatedCalendarId] = useState<string | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [orgSetupComplete, setOrgSetupComplete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Add selected date state
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]); // Add filtered events state
  const [showEmailVerificationNotification, setShowEmailVerificationNotification] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState('');

  // Check for existing email verification state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('emailVerificationState');
    console.log('Dashboard: Checking localStorage for email verification state:', savedState);
    
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        console.log('Dashboard: Parsed state:', parsedState);
        
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
        
        // Only restore if the state is less than 1 hour old AND has a valid calendar ID
        if (parsedState.timestamp && (now - parsedState.timestamp) < oneHour && parsedState.calendarId) {
          console.log('Dashboard: Restoring email verification state with email:', parsedState.email);
          setInvitationEmail(parsedState.email);
          setShowEmailVerificationNotification(true);
        } else {
          // Clean up old state
          console.log('Dashboard: Cleaning up old email verification state');
          localStorage.removeItem('emailVerificationState');
        }
      } catch (error) {
        console.error('Error parsing saved email verification state:', error);
        localStorage.removeItem('emailVerificationState');
      }
    } else {
      console.log('Dashboard: No saved email verification state found');
    }
  }, []);

  // Force reset verification status on page load if calendar is not shared and state is old
  useEffect(() => {
    if (calendars.length > 0) {
      const savedState = localStorage.getItem('emailVerificationState');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          const calendarId = parsedState.calendarId;
          
          if (calendarId) {
            const calendar = calendars.find(cal => (cal.calendar_id || cal.id) === calendarId);
            if (calendar) {
              // Check if calendar is not shared
              const isShared = calendar.shared_with && 
                              calendar.shared_with.length > 0 && 
                              calendar.shared_with[0] !== 'No one';
              
              // Only clear if verification state is old (more than 5 minutes) and calendar is not shared
              const now = Date.now();
              const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
              const isOld = parsedState.timestamp && (now - parsedState.timestamp) > fiveMinutes;
              
              if (!isShared && isOld) {
                console.log('Dashboard: Calendar not shared and verification state is old, clearing');
                localStorage.removeItem('emailVerificationState');
                setShowEmailVerificationNotification(false);
                setInvitationEmail('');
                return;
              }
            } else {
              // Calendar not found, clear verification state
              console.log('Dashboard: Calendar not found, clearing verification state');
              localStorage.removeItem('emailVerificationState');
              setShowEmailVerificationNotification(false);
              setInvitationEmail('');
            }
          }
        } catch (error) {
          console.error('Error checking verification status on page load:', error);
          // Clear state on error
          localStorage.removeItem('emailVerificationState');
          setShowEmailVerificationNotification(false);
          setInvitationEmail('');
        }
      }
    }
  }, [calendars]);

  // Check if calendar sharing status has changed and hide notification if calendar is now shared
  useEffect(() => {
    // Only clear verification state if it's old (more than 5 minutes) and calendar is not shared
    if (calendars.length > 0) {
      const savedState = localStorage.getItem('emailVerificationState');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          const calendarId = parsedState.calendarId;
          
          if (calendarId) {
            const calendar = calendars.find(cal => (cal.calendar_id || cal.id) === calendarId);
            if (calendar) {
              // Check if calendar is not shared
              const isShared = calendar.shared_with && 
                              calendar.shared_with.length > 0 && 
                              calendar.shared_with[0] !== 'No one';
              
              // Only clear if verification state is old (more than 5 minutes) and calendar is not shared
              const now = Date.now();
              const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
              const isOld = parsedState.timestamp && (now - parsedState.timestamp) > fiveMinutes;
              
              if (!isShared && isOld) {
                console.log('Dashboard: Calendar not shared and verification state is old, clearing');
                localStorage.removeItem('emailVerificationState');
                setShowEmailVerificationNotification(false);
                setInvitationEmail('');
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error checking calendar sharing status:', error);
        }
      }
    }
    
    if (showEmailVerificationNotification && calendars.length > 0) {
      const savedState = localStorage.getItem('emailVerificationState');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          const calendarId = parsedState.calendarId;
          
          if (calendarId) {
            // Find the calendar that was shared
            const sharedCalendar = calendars.find(cal => 
              (cal.calendar_id || cal.id) === calendarId
            );
            
            if (sharedCalendar) {
              // Check if calendar name has changed - if so, reset verification status
              const currentCalendarName = sharedCalendar.user_name || sharedCalendar.name || 'Calendar';
              if (parsedState.calendarName && parsedState.calendarName !== currentCalendarName) {
                console.log('Dashboard: Calendar name changed, resetting verification status');
                console.log('Old name:', parsedState.calendarName, 'New name:', currentCalendarName);
                
                // Completely reset verification status when calendar name changes
                const updatedState = {
                  email: parsedState.email,
                  calendarId: parsedState.calendarId,
                  calendarName: currentCalendarName,
                  invitationType: 'calendar invitation',
                  isVerified: false, // Always reset to false when calendar name changes
                  verificationAttempts: 0,
                  timestamp: Date.now() // Update timestamp to indicate fresh verification needed
                };
                localStorage.setItem('emailVerificationState', JSON.stringify(updatedState));
                
                // Force the notification to show as not verified
                setShowEmailVerificationNotification(true);
                setInvitationEmail(parsedState.email);
                
                console.log('Dashboard: Verification status reset for calendar name change');
                return;
              }
              
              // Check if the calendar is now shared with someone (not "No one")
              const isShared = sharedCalendar.shared_with && 
                              sharedCalendar.shared_with.length > 0 && 
                              sharedCalendar.shared_with[0] !== 'No one';
              
              console.log('Dashboard: Calendar sharing status check:', {
                calendarId,
                calendarName: currentCalendarName,
                shared_with: sharedCalendar.shared_with,
                isShared,
                showNotification: showEmailVerificationNotification
              });
              
              // If calendar is now shared, hide the notification
              if (isShared) {
                console.log('Dashboard: Calendar is now shared, hiding notification');
                setShowEmailVerificationNotification(false);
                localStorage.removeItem('emailVerificationState');
              } else {
                // If calendar is not shared, ensure notification shows as not verified
                console.log('Dashboard: Calendar is not shared, notification should show as pending');
                // Always reset verification status to false if calendar is not shared
                const updatedState = {
                  email: parsedState.email,
                  calendarId: parsedState.calendarId,
                  calendarName: currentCalendarName,
                  invitationType: 'calendar invitation',
                  isVerified: false, // Always false when not shared
                  verificationAttempts: 0,
                  timestamp: Date.now()
                };
                localStorage.setItem('emailVerificationState', JSON.stringify(updatedState));
                
                // Ensure notification is visible and shows as not verified
                if (!showEmailVerificationNotification) {
                  setShowEmailVerificationNotification(true);
                  setInvitationEmail(parsedState.email);
                }
              }
            } else {
              // Calendar not found (probably deleted), clear the verification state
              console.log('Dashboard: Calendar not found, clearing verification state');
              setShowEmailVerificationNotification(false);
              localStorage.removeItem('emailVerificationState');
            }
          }
        } catch (error) {
          console.error('Error checking calendar sharing status:', error);
        }
      }
    }
  }, [calendars, showEmailVerificationNotification]);




  const { showError, showSuccess, showWarning } = useErrorHandler();

  const fetchDoctors = async () => {
    // Only fetch doctors if organization setup is complete
    if (!orgSetupComplete || !orgHelper?.getOrgs()?.[0]?.orgId){ 
      return;
    }
    
    setDoctorsLoading(true);
    try {
      const orgId = orgHelper.getOrgs()[0].orgId;
      const response = await doctorApiService.getDoctorsByOrg(orgId);
      if (response.doctors.length === 0 && orgSetupComplete){
        showWarning('No doctors found. Please add a doctor first.');
      }
      setDoctors(response.doctors || []);
    } catch (error) {
      showError('Failed to load doctors');
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && orgHelper) {
      const orgs = orgHelper.getOrgs?.() || [];
      setOrgs(orgs);
      if (orgs.length === 0) {
        setShowOrgSetup(true);
        setShowOrgChoice(false);
        setOrgSetupComplete(false);
      } else if (orgs.length > 1) {
        setShowOrgSetup(false);
        setShowOrgChoice(true);
        setOrgSetupComplete(false);
      } else {
        setShowOrgSetup(false);
        setShowOrgChoice(false);
        setOrgSetupComplete(true);
      }
    }
  }, [loading, orgHelper]);

  // Handle initial state when organization setup is already complete
  useEffect(() => {
    if (!loading && orgHelper && orgHelper.getOrgs?.()?.length === 1) {
      setOrgSetupComplete(true);
    }
  }, [loading, orgHelper]);


  useEffect(() => {
    fetchDoctors();
  }, [orgSetupComplete, orgHelper?.getOrgs()?.[0]?.orgId]);

  useEffect(() => {
    let isMounted = true;
    const fetchCalendars = async () => {
      // Only fetch calendars if organization setup is complete
      if (!orgSetupComplete || !orgHelper?.getOrgs()?.[0]?.orgId){ 
        return;
      }
      
      setCalendarsLoading(true);
      try {
        const orgId = orgHelper.getOrgs()[0].orgId;
        const response = await calendarService.getOrgCalendars(orgId);
        
        // Unwrap the nested response structure
        const calendars = 
          response?.data?.data?.calendars ||
          response?.data?.calendars ||
          response?.calendars ||
          [];
          
        if (isMounted) {
          setCalendars(calendars);
          // Auto-select the first calendar if there are calendars and no calendar is currently selected
          if (calendars.length > 0 && !selectedCalendar) {
            handleCalendarSelect(calendars[0]);
          }
        }
      } catch (error) {
        if (isMounted) {
          showError('Failed to load calendars');
          setCalendars([]);
        }
      } finally {
        if (isMounted) setCalendarsLoading(false);
      }
    };

    fetchCalendars();
    return () => { isMounted = false; };
  }, [orgSetupComplete, orgHelper?.getOrgs()?.[0]?.orgId]);

  const handleAddDoctor = () => {
    // Show the DocInfoModal for doctor setup
    setShowDocInfoModal(true);
  };

  const handleSearchDoctors = (query: string) => {
  };

  const handleEditDoctor = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowDocInfoModal(true);
  };

  const handleAssignCalendar = (doctor: any) => {
    // Check if doctor already has a calendar assigned
    const doctorCalendar = calendars?.find((calendar) => calendar.doctor_id === doctor.doctor_id);
    if (doctorCalendar) {
      showWarning('Only 1 calendar is allowed per doctor for now.');
      return;
    }
    
    setSelectedDoctor(doctor);
    setShowCreateCalendarModal(true);
  };

  const handleCalendarAssignmentClose = () => {
    setShowCreateCalendarModal(false);
    setSelectedDoctor(null);
  };
  
  const handleCreateCalendarForDoctor = async (doctorId: string, calendarData: any) => {
    try {
      const res = await calendarService.createCalendar({
        doctor_id: doctorId,
        user_name: calendarData.name,
        timezone: calendarData.timezone
      });

      showSuccess('Calendar created successfully!');
      
      // Clear any existing verification state when a new calendar is created
      localStorage.removeItem('emailVerificationState');
      setShowEmailVerificationNotification(false);
      setInvitationEmail('');

      // Refresh calendars after creating a new one
      if (orgHelper?.getOrgs()?.[0]?.orgId) {
        const orgId = orgHelper.getOrgs()[0].orgId;
        const calendarsResponse = await calendarService.getOrgCalendars(orgId);
        
        // Unwrap the nested response structure
        const calendars = 
          calendarsResponse?.data?.data?.calendars ||
          calendarsResponse?.data?.calendars ||
          calendarsResponse?.calendars ||
          [];
          
        setCalendars(calendars);
        // Auto-select the first calendar if there are calendars and no calendar is currently selected
        if (calendars.length > 0 && !selectedCalendar) {
          handleCalendarSelect(calendars[0]);
        }
      }

      // UNWRAP the calendar_id from the nested response
      const calendarId =
        res?.data?.data?.calendar_id ||
        res?.data?.calendar_id ||
        res?.calendar_id ||
        null;

      return calendarId;
    } catch (error) {
      showError('Failed to create calendar for doctor');
      return null;
    }
  };

  const handleCreateCalendarSubmit = async (calendarData: CalendarData) => {
    if (selectedDoctor) {
      const calendarId = await handleCreateCalendarForDoctor(selectedDoctor.doctor_id, calendarData);
      if (calendarId) {
        setCreatedCalendarId(calendarId);
        setShowCreateCalendarModal(false);
        setShowShareCalendarModal(true);
      }
    }
  };

  const handleAssignExistingCalendar = async (doctorId: string, calendarId: string) => {
    try {

      setDoctors(prevDoctors => 
        prevDoctors.map(doctor => 
          doctor._id === doctorId 
            ? { ...doctor, calendarId: calendarId }
            : doctor
        )
      );
      
      showSuccess('Calendar assigned successfully!');
    } catch (error) {
      showError('Failed to assign calendar to doctor');
    }
  };

  // Mock data for agent - replace with actual API call
  useEffect(() => {
    let isMounted = true;
    setAgentLoading(true);
    agentApiService.getAllAgents().then((res) => {
      if (isMounted) {
        setAgent(res.agents[0]);
        setAgentLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Handler for choosing an org
  const handleChooseOrg = async (chosenOrgId: string) => {
    if (!user?.userId) {
      showError('User not found. Please log in again.');
      return;
    }
    // Remove user from all orgs except the chosen one
    const orgsToRemove = orgs.filter((org: any) => (org.orgId || org.id) !== chosenOrgId);
    try {
      await Promise.all(orgsToRemove.map((org: any) =>
        removeUserFromOrg(org.orgId || org.id, user.userId)
      ));
      showSuccess('Workspace selected successfully!');
      setShowOrgChoice(false);
      setOrgSetupComplete(true);
      window.location.reload();
    } catch (err: any) {
      showError(err?.message || 'Failed to update workspace selection. Please try again.');
    }
  };

  const handleNewEvent = async () => {
    setShowCreateEventModal(true);
    setSelectedCalendar(selectedCalendar);
  };

  const handleCreateEventClose = () => {
    setShowCreateEventModal(false);
    setSelectedCalendar(null);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEditEventModal(true);
  };

  const handleEditEventClose = () => {
    setShowEditEventModal(false);
    setSelectedEvent(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    if (!events || events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    // Filter events for the selected date
    const filtered = events.filter((event) => {
      try {
        const eventDate = new Date(event.start.dateTime);
        const selectedDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        return eventDateOnly.getTime() === selectedDateOnly.getTime();
      } catch (error) {
        console.error('Error filtering event by date:', error);
        return false;
      }
    });

    setFilteredEvents(filtered);
    
  };

  const handleShowAllEvents = () => {
    setSelectedDate(null);
    setFilteredEvents([]);
  };

  const handleDeleteDoctor = async (doctor: any) => {
    // Show confirmation first
    const confirmed = window.confirm(`Are you sure you want to delete Dr. ${doctor.first_name} ${doctor.last_name}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      await doctorApiService.deleteDoctor(doctor.doctor_id);
      showSuccess('Doctor deleted successfully'); 
      
      // Clear email verification state when doctor is deleted
      localStorage.removeItem('emailVerificationState');
      setShowEmailVerificationNotification(false);
      setInvitationEmail('');
      
      // Reload the page to ensure all related data (calendars, events) are properly cleaned up
      window.location.reload();
    } catch (error) {
      showError('Failed to delete doctor. Please try again.');
      console.error('Delete doctor error:', error);
      setDeleteLoading(false);
    }
  };

  const handleNewCalendar = () => {
    setShowCreateCalendarModal(true);
  };

  const handleCreateCalendarClose = () => {
    setShowCreateCalendarModal(false);
  };

  const handleShareCalendarClose = () => {
    setShowShareCalendarModal(false);
    setCreatedCalendarId(null);
    // Don't reload immediately - let the notification show first
    // window.location.reload();
  };

  const handleCalendarSelect = async (calendar: any) => {
    setSelectedCalendar(calendar);
    setSelectedDate(null); // Reset selected date when calendar changes
    setFilteredEvents([]); // Reset filtered events
    setEventsLoading(true);
    try {
      // Fetch events for the selected calendar
      
      const response = await eventService.listEvents(calendar.calendar_id, false); // Set upcomingOnly to false to get all events
      
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      showError('Failed to load calendar events');
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleViewDetails = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowShowDocInfoModal(true);
  };

  return (
    <>
      {showOrgSetup && <OrgSetup onOrgCreated={() => {
        setShowOrgSetup(false);
        setOrgSetupComplete(true);
      }} />}
      {showOrgChoice && (
        <OrgChoiceModal 
          orgs={orgs} 
          onOrgChosen={() => {
            setShowOrgChoice(false);
            setOrgSetupComplete(true);
          }} 
          userId={user?.userId}
          handleChooseOrg={handleChooseOrg}
        />
      )}
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
                         {/* Welcome Section */}
                           <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.firstName || 'User'}!
                </h1>
                                 <p className="text-gray-600">
                   Manage your healthcare organization efficiently
                 </p>
                
              </div>

            {/* Main Content */}
            {activeTab === 'calendar' && orgSetupComplete && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <DoctorCalendars 
                    calendars={calendars} 
                    loading={calendarsLoading} 
                    selectedCalendar={selectedCalendar}
                    onCalendarSelect={handleCalendarSelect}
                    onNewCalendar={handleNewCalendar}
                  />
                </div>
              </div>
            )}
            {activeTab === 'calendar' && orgSetupComplete && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column - Calendar */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <Calendar
                      events={events}
                      selectedDate={selectedDate || undefined} // Convert null to undefined
                      onDateSelect={handleDateSelect}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Right Column - Today's Events */}
                <div className="lg:col-span-3">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <CalendarEventsList
                      events={selectedDate ? filteredEvents : events} // Use filtered events if date is selected
                      loading={eventsLoading}
                      selectedCalendar={selectedCalendar}
                      selectedDate={selectedDate} // Pass selected date to show in header
                      onNewEvent={handleNewEvent}
                      onEventsRefresh={() => {
                        if (selectedCalendar) {
                          handleCalendarSelect(selectedCalendar);
                        }
                      }}
                      onShowAllEvents={handleShowAllEvents}
                      onEditEvent={handleEditEvent}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && !orgSetupComplete && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Organization Setup</h3>
                  <p className="text-gray-600 mb-4">Please complete organization setup first</p>
                  <p className="text-sm text-gray-500">You need to create or select an organization before managing calendars.</p>
                </div>
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <AgentsSection 
                    agent={agent} 
                    loading={agentLoading} 
                  />
                </div>
              </div>
            )}

{activeTab === 'doctors' && orgSetupComplete && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <DoctorsSection 
                    doctors={doctors} 
                    loading={doctorsLoading}
                    calendars={calendars}
                    onAddDoctor={handleAddDoctor}
                    onSearch={handleSearchDoctors}
                    onEditDoctor={handleEditDoctor}
                    onAssignCalendar={handleAssignCalendar}
                    onDeleteDoctor={handleDeleteDoctor}
                    onViewDetails={handleViewDetails}
                  />
                </div>
              </div>
            )}

            {activeTab === 'doctors' && !orgSetupComplete && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Organization Setup</h3>
                  <p className="text-gray-600 mb-4">Please complete organization setup first</p>
                  <p className="text-sm text-gray-500">You need to create or select an organization before managing doctors.</p>
                </div>
              </div>
            )}

            
          </div>
        </main>
      </div>
            {showDocInfoModal && (
         <DocInfoModal 
           isEdit={!!selectedDoctor}
           doctorData={selectedDoctor}
           onComplete={() => {
            setShowDocInfoModal(false);
            setSelectedDoctor(null);
            try{
              doctorApiService.getDoctorsByOrg(orgHelper?.getOrgs()?.[0]?.orgId || '').then((res) => {
                setDoctors(res.doctors);
                // After fetching updated doctors, trigger calendar assignment for the newly created doctor
                if (!selectedDoctor) { // Only for new doctors, not when editing
                  const newDoctor = res.doctors.find((doc: any) => 
                    !doctors.some((existingDoc: any) => existingDoc.doctor_id === doc.doctor_id)
                  );
                  if (newDoctor) {
                    setSelectedDoctor(newDoctor);
                    setShowCreateCalendarModal(true);
                  }
                }
              });
            }catch(error){
              showError('Failed to fetch doctors');
            }finally{
              setDoctorsLoading(false);
            }

           }}
         />
       )}

      {showCalendarAssignmentModal && (
        <CalendarAssignmentModal
          isOpen={showCalendarAssignmentModal}
          onClose={handleCalendarAssignmentClose}
          doctor={selectedDoctor}
          calendars={calendars}
          onCreateCalendar={handleCreateCalendarForDoctor}
          onAssignCalendar={handleAssignExistingCalendar}
        />
      )}
      {showCreateCalendarModal && (
        <CreateCalendarModal
          isOpen={showCreateCalendarModal}
          onClose={handleCreateCalendarClose}
          onSubmit={handleCreateCalendarSubmit}
        />
      )}
      {showShareCalendarModal && (
        <ShareCalendarModal
          isOpen={showShareCalendarModal}
          onClose={handleShareCalendarClose}
          calendarId={createdCalendarId}
                   onComplete={() => {
           // Don't close immediately - let onInvitationSent handle it
         }}
                     onInvitationSent={(email) => {
             setInvitationEmail(email);
             setShowEmailVerificationNotification(true);
             // Close the modal after setting the notification
             handleShareCalendarClose();
           }}
        />
      )}
      {showCreateEventModal && (
        <CreateEventModal
          isOpen={showCreateEventModal}
          onClose={handleCreateEventClose}
          calendarId={selectedCalendar?.calendar_id}
          selectedCalendar={selectedCalendar}
          onEventCreated={() => {
            if (selectedCalendar) {
              handleCalendarSelect(selectedCalendar);
            }
          }}
        />
      )}
      {showEditEventModal && (
        <EditEventModal
          isOpen={showEditEventModal}
          onClose={handleEditEventClose}
          event={selectedEvent}
          calendarId={selectedCalendar?.calendar_id}
          selectedCalendar={selectedCalendar}
          onEventUpdated={() => {
            if (selectedCalendar) {
              handleCalendarSelect(selectedCalendar);
            }
          }}
        />
      )}
      {showShowDocInfoModal && (
        <ShowDocInfoModal
          isOpen={showShowDocInfoModal}
          onClose={() => setShowShowDocInfoModal(false)}
          doctor={selectedDoctor}
        />
            )}

      {/* Delete Loading Overlay */}
      {deleteLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl border">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent"></div>
              <div>
                <p className="font-medium text-gray-900">Deleting Doctor</p>
                <p className="text-sm text-gray-500">Please wait, this may take a moment...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Calendar Invitation Notification */}
             <EmailVerificationNotification
         isVisible={showEmailVerificationNotification}
         onClose={() => {
           setShowEmailVerificationNotification(false);
         }}
         email={invitationEmail}
         invitationType="calendar invitation"
         calendarName={(() => {
           // Try to get calendar name from localStorage first
           const savedState = localStorage.getItem('emailVerificationState');
           if (savedState) {
             try {
               const parsedState = JSON.parse(savedState);
               if (parsedState.calendarName) {
                 return parsedState.calendarName;
               }
             } catch (error) {
               console.error('Error parsing saved verification state:', error);
             }
           }
           // Fallback to selected calendar name
           return selectedCalendar?.user_name || selectedCalendar?.name || 'Calendar';
         })()}
         onVerificationComplete={() => {
           // Don't hide notification immediately - let the calendar sharing status check handle it
           showSuccess('Email verified successfully! Calendar access will be granted once sharing is confirmed.');
         }}
       />
    </>
  );
} 

