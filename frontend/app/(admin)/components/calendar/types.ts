export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  location?: string;
  attendees?: any[];
}

export interface CalendarProps {
  events?: CalendarEvent[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onShare?: () => void;
  className?: string;
}

export interface CalendarDayProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  isOutsideMonth: boolean;
  events?: CalendarEvent[];
  onClick: (date: Date) => void;
}

export interface CalendarNavigationProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
} 