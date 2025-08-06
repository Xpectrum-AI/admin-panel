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
  const { accessToken, user, loading, orgHelper } = useAuthInfo();
  const [showWelcome, setShowWelcome] = useState(false);
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
  const { showError, showSuccess, showWarning } = useErrorHandler();

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
    const fetchDoctors = async () => {
      if (!orgHelper?.getOrgs()?.[0]?.orgId){ 
        return;
      }
      
      setDoctorsLoading(true);
      try {
        const orgId = orgHelper.getOrgs()[0].orgId;
        const response = await doctorApiService.getDoctorsByOrg(orgId);
        if (response.doctors.length === 0){
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

    fetchDoctors();
  }, [orgHelper?.getOrgs()?.[0]?.orgId]);

  useEffect(() => {
    const fetchCalendars = async () => {
      if (!orgHelper?.getOrgs()?.[0]?.orgId){ 
        return;
      }
      
      setCalendarsLoading(true);
      try {
        const orgId = orgHelper.getOrgs()[0].orgId;
        const response = await calendarService.getOrgCalendars(orgId);
        setCalendars(response.calendars || []);
      } catch (error) {
        showError('Failed to load calendars');
        setCalendars([]);
      } finally {
        setCalendarsLoading(false);
      }
    };

    fetchCalendars();
  }, [orgHelper?.getOrgs()?.[0]?.orgId]);

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
        setCalendars(calendarsResponse.calendars || []);
      }
      
      return res.calendar_id; // Return the calendar ID
      
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
    setAgentLoading(true);
    agentApiService.getAllAgents().then((res) => {
      setAgent(res.agents[0]);
      setAgentLoading(false);
    });
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

  const handleDateSelect = (date: Date) => {
  };

  const handleDeleteDoctor = async (doctor: any) => {
    // Handle delete doctor functionality
    await doctorApiService.deleteDoctor(doctor.doctor_id);
    showSuccess('Doctor deleted successfully'); 
    doctorApiService.getDoctorsByOrg(orgHelper?.getOrgs()?.[0]?.orgId || '').then((res) => {
      setDoctors(res.doctors);
    });
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
    setEventsLoading(true);
    try {
      // Fetch events for the selected calendar
      const response = await eventService.listEvents(calendar.calendar_id);
      setEvents(response.events || []);
    } catch (error) {
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
      {showOrgSetup && <OrgSetup onOrgCreated={() => setShowOrgSetup(false)} />}
      {showOrgChoice && (
        <OrgChoiceModal 
          orgs={orgs} 
          onOrgChosen={() => {
            setShowOrgChoice(false);
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
            {activeTab === 'calendar' && (
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
            {activeTab === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column - Calendar */}
                <div className="lg:col-span-2 flex">
                  <div className="w-full">
                    <Calendar
                      events={events}
                      onDateSelect={handleDateSelect}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Right Column - Today's Events */}
                <div className="lg:col-span-3 flex">
                  <div className="w-full">
                    <CalendarEventsList
                      events={events}
                      loading={eventsLoading}
                      selectedCalendar={selectedCalendar}
                      onNewEvent={handleNewEvent}
                    />
                  </div>
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

{activeTab === 'doctors' && (
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
        />
      )}
      {showShowDocInfoModal && (
        <ShowDocInfoModal
          isOpen={showShowDocInfoModal}
          onClose={() => setShowShowDocInfoModal(false)}
          doctor={selectedDoctor}
        />
      )}
      </ProtectedRoute>
  );
} 

