import { Calendar } from 'lucide-react';

interface CalendarHeaderProps {
  title?: string;
}

export default function CalendarHeader({ title = "Calendar" }: CalendarHeaderProps) {
  return (
    <div className="flex flex-col space-y-1.5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </h3>
      </div>
    </div>
  );
} 