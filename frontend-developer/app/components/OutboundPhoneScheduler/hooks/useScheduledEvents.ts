import { useState, useCallback } from 'react';
import { getScheduledEventsByOrganization, deleteScheduledEvent } from '../../../../service/phoneNumberService';
import { ScheduledEvent, ApiResponse } from '../types';
import { useOrganizationId } from '../../utils/phoneNumberUtils';

export function useScheduledEvents() {
  const getOrganizationId = useOrganizationId();
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [selectedScheduledEvent, setSelectedScheduledEvent] = useState<ScheduledEvent | null>(null);
  const [loadingScheduledEvents, setLoadingScheduledEvents] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const loadScheduledEvents = useCallback(async () => {
    setLoadingScheduledEvents(true);
    try {
      const orgId = getOrganizationId();
      if (!orgId) {
        setScheduledEvents([]);
        return;
      }

      const response: ApiResponse<{ scheduled_events: ScheduledEvent[] }> = await getScheduledEventsByOrganization(orgId);
      if (response.success && response.data) {
        const eventsData = response.data;
        if (eventsData.scheduled_events && Array.isArray(eventsData.scheduled_events)) {
          setScheduledEvents(eventsData.scheduled_events);
        } else {
          setScheduledEvents([]);
        }
      } else {
        setScheduledEvents([]);
      }
    } catch (err: unknown) {
      setScheduledEvents([]);
    } finally {
      setLoadingScheduledEvents(false);
    }
  }, [getOrganizationId]);

  const handleDeleteScheduledEvent = useCallback(async (eventId: string) => {
    setDeletingEvent(eventId);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const result = await deleteScheduledEvent(eventId);
      if (result.success) {
        setDeleteSuccess('Scheduled event deleted successfully');
        await loadScheduledEvents();
      } else {
        setDeleteError(result.message || 'Failed to delete scheduled event');
      }
    } catch (error: any) {
      setDeleteError('Failed to delete scheduled event: ' + error.message);
    } finally {
      setDeletingEvent(null);
    }
  }, [loadScheduledEvents]);

  return {
    scheduledEvents,
    setScheduledEvents,
    selectedScheduledEvent,
    setSelectedScheduledEvent,
    loadingScheduledEvents,
    deletingEvent,
    deleteError,
    deleteSuccess,
    loadScheduledEvents,
    handleDeleteScheduledEvent
  };
}

