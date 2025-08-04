import { useState, useMemo } from 'react';
import { CalendarEvent } from './types';

export default function useCalendar(events: CalendarEvent[] = []) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month
    const firstDayOfMonth = new Date(year, month, 1);
    // Get last day of month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Get start of calendar (previous month days to fill first week)
    const startOfCalendar = new Date(firstDayOfMonth);
    startOfCalendar.setDate(startOfCalendar.getDate() - firstDayOfMonth.getDay());
    
    // Get end of calendar (next month days to fill last week)
    const endOfCalendar = new Date(lastDayOfMonth);
    endOfCalendar.setDate(endOfCalendar.getDate() + (6 - lastDayOfMonth.getDay()));
    
    const days: Date[] = [];
    const current = new Date(startOfCalendar);
    
    while (current <= endOfCalendar) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isOutsideMonth = (date: Date) => {
    return date.getMonth() !== currentMonth.getMonth();
  };

  return {
    currentMonth,
    selectedDate,
    calendarDays,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
    getEventsForDate,
    isToday,
    isSelected,
    isOutsideMonth,
  };
} 