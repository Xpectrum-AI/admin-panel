import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarNavigationProps } from './types';

export default function CalendarNavigation({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarNavigationProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = monthNames[currentMonth.getMonth()];
  const currentYear = currentMonth.getFullYear();

  return (
    <div className="flex justify-center pt-1 relative items-center">
      <div className="text-sm font-medium" aria-live="polite" role="presentation">
        {currentMonthName} {currentYear}
      </div>
      <div className="space-x-1 flex items-center">
        <button
          name="previous-month"
          aria-label="Go to previous month"
          className="rdp-button_reset rdp-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
          type="button"
          onClick={onPreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          name="next-month"
          aria-label="Go to next month"
          className="rdp-button_reset rdp-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
          type="button"
          onClick={onNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 