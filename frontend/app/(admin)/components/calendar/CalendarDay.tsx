import { CalendarDayProps } from './types';

export default function CalendarDay({
  date,
  isSelected,
  isToday,
  isOutsideMonth,
  events = [],
  onClick,
}: CalendarDayProps) {
  const dayNumber = date.getDate();
  const hasEvents = events.length > 0;

  const getButtonClasses = () => {
    let classes = [
      'rdp-button_reset',
      'rdp-button',
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'whitespace-nowrap',
      'rounded-md',
      'text-sm',
      'ring-offset-background',
      'transition-colors',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2',
      'disabled:pointer-events-none',
      'disabled:opacity-50',
      'hover:bg-accent',
      'hover:text-accent-foreground',
      'h-10',
      'w-full',
      'aspect-square',
      'p-0',
      'font-normal',
      'aria-selected:opacity-100',
    ];

    if (isOutsideMonth) {
      classes.push('day-outside', 'text-muted-foreground', 'opacity-50');
    }

    if (isSelected) {
      classes.push(
        'bg-blue-600',
        'text-white',
        'hover:bg-blue-700',
        'hover:text-white',
        'focus:bg-blue-700',
        'focus:text-white',
        'font-semibold',
        'ring-2',
        'ring-blue-300',
        'ring-offset-2'
      );
    }

    if (isToday && !isSelected) {
      classes.push('font-semibold', 'bg-green-100', 'text-green-800', 'border-2', 'border-green-300');
    }

    return classes.join(' ');
  };

  return (
    <td
      className="flex-1 text-center text-sm p-1 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
      role="presentation"
    >
      <button
        name="day"
        className={getButtonClasses()}
        role="gridcell"
        type="button"
        onClick={() => onClick(date)}
        aria-selected={isSelected}
        tabIndex={isSelected ? 0 : -1}
      >
        {dayNumber}
        {hasEvents && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-1 bg-primary rounded-full"></div>
          </div>
        )}
      </button>
    </td>
  );
} 