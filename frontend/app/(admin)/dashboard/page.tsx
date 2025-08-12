"use client";

import { useEffect, useState } from 'react';
import { useAuthInfo } from '@propelauth/react';
import { ProtectedRoute } from "../../(admin)/auth/ProtectedRoute";
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
  ShowDocInfoModal
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
    console.log('Selected date:', date);
    console.log('Filtered events for date:', filtered);
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
    window.location.reload();
  };

  const handleCalendarSelect = async (calendar: any) => {
    setSelectedCalendar(calendar);
    setSelectedDate(null); // Reset selected date when calendar changes
    setFilteredEvents([]); // Reset filtered events
    setEventsLoading(true);
    try {
      // Fetch events for the selected calendar
      console.log('Fetching events for calendar:', calendar.calendar_id);
      const response = await eventService.listEvents(calendar.calendar_id, false); // Set upcomingOnly to false to get all events
      console.log('Calendar events response:', response);
      console.log('Events array:', response.events);
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
    <ProtectedRoute>
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
      <div className="flex flex-col min-h-screen">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">
          <div>

            {/* Main Content */}
            {activeTab === 'calendar' && orgSetupComplete && (
              <div className="grid grid-cols-1 gap-8 mb-8">
                <DoctorCalendars 
                  calendars={calendars} 
                  loading={calendarsLoading} 
                  selectedCalendar={selectedCalendar}
                  onCalendarSelect={handleCalendarSelect}
                  onNewCalendar={handleNewCalendar}
                />
              </div>
            )}
            {activeTab === 'calendar' && orgSetupComplete && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column - Calendar */}
                <div className="lg:col-span-2 flex">
                  <div className="w-full">
                    <Calendar
                      events={events}
                      selectedDate={selectedDate || undefined} // Convert null to undefined
                      onDateSelect={handleDateSelect}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Right Column - Today's Events */}
                <div className="lg:col-span-3 flex">
                  <div className="w-full">
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
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Please complete organization setup first</p>
                  <p className="text-sm text-gray-500">You need to create or select an organization before managing calendars.</p>
                </div>
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="grid grid-cols-1 gap-8">
                <AgentsSection 
                  agent={agent} 
                  loading={agentLoading} 
                />
              </div>
            )}

{activeTab === 'doctors' && orgSetupComplete && (
              <div className="grid grid-cols-1 gap-8">
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
            )}

            {activeTab === 'doctors' && !orgSetupComplete && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
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
          onComplete={handleShareCalendarClose}
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
    </ProtectedRoute>
  );
} 

