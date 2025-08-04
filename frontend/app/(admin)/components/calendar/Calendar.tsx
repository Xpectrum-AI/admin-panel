import { CalendarProps } from './types';
import useCalendar from './useCalendar';
import CalendarHeader from './CalendarHeader';
import CalendarNavigation from './CalendarNavigation';
import CalendarGrid from './CalendarGrid';

export default function Calendar({
  events = [],
  selectedDate,
  onDateSelect,
  onEventClick,
  className = '',
}: CalendarProps) {
  const {
    currentMonth,
    selectedDate: internalSelectedDate,
    calendarDays,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
    getEventsForDate,
    isToday,
    isSelected,
    isOutsideMonth,
  } = useCalendar(events);

  const handleDateSelect = (date: Date) => {
    selectDate(date);
    onDateSelect?.(date);
  };

  const finalSelectedDate = selectedDate || internalSelectedDate;

  return (
    <div className={`rounded-lg border bg-card text-card-foreground border-gray-300 flex flex-col h-full ${className}`}>
      <CalendarHeader />
      <div className="p-6 pt-0 flex-1 flex flex-col">
        <div className="rdp p-3 rounded-md border border-gray-300 flex-1 flex flex-col">
          <div className="flex flex-col space-y-4 flex-1">
            <div className="space-y-4 rdp-caption_start rdp-caption_end flex-1 flex flex-col">
              <CalendarNavigation
                currentMonth={currentMonth}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
              />
              <div className="flex-1">
                <CalendarGrid
                  days={calendarDays}
                  selectedDate={finalSelectedDate}
                  getEventsForDate={getEventsForDate}
                  isToday={isToday}
                  isSelected={isSelected}
                  isOutsideMonth={isOutsideMonth}
                  onDateSelect={handleDateSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 