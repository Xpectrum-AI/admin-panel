import CalendarDay from './CalendarDay';
import { CalendarEvent } from './types';

interface CalendarGridProps {
  days: Date[];
  selectedDate: Date;
  getEventsForDate: (date: Date) => CalendarEvent[];
  isToday: (date: Date) => boolean;
  isSelected: (date: Date) => boolean;
  isOutsideMonth: (date: Date) => boolean;
  onDateSelect: (date: Date) => void;
}

export default function CalendarGrid({
  days,
  selectedDate,
  getEventsForDate,
  isToday,
  isSelected,
  isOutsideMonth,
  onDateSelect,
}: CalendarGridProps) {
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <table className="w-full border-collapse space-y-2" role="grid">
      <thead className="rdp-head">
        <tr className="flex">
          {weekDays.map((day) => (
            <th
              key={day}
              scope="col"
              className="text-muted-foreground rounded-md flex-1 font-normal text-sm min-w-0"
              aria-label={day}
            >
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="rdp-tbody">
        {weeks.map((week, weekIndex) => (
          <tr key={weekIndex} className="flex w-full mt-2">
            {week.map((date) => (
              <CalendarDay
                key={date.toISOString()}
                date={date}
                isSelected={isSelected(date)}
                isToday={isToday(date)}
                isOutsideMonth={isOutsideMonth(date)}
                events={getEventsForDate(date)}
                onClick={onDateSelect}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
} 