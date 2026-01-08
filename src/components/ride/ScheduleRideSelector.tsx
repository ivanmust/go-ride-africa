import { useState } from "react";
import { format, addHours, setHours, setMinutes, isBefore, startOfToday } from "date-fns";
import { Calendar, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ScheduleRideSelectorProps {
  scheduledDate: Date | null;
  onScheduleChange: (date: Date | null) => void;
}

const timeSlots = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
];

export const ScheduleRideSelector = ({
  scheduledDate,
  onScheduleChange,
}: ScheduleRideSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    scheduledDate || undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    scheduledDate ? format(scheduledDate, "HH:mm") : "09:00"
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledDateTime = setMinutes(setHours(selectedDate, hours), minutes);
      onScheduleChange(scheduledDateTime);
      setIsOpen(false);
    }
  };

  const handleClearSchedule = () => {
    onScheduleChange(null);
    setSelectedDate(undefined);
    setSelectedTime("09:00");
  };

  const now = new Date();
  const minDate = startOfToday();
  const minTime = addHours(now, 1);

  const isTimeDisabled = (time: string) => {
    if (!selectedDate) return false;
    const [hours, minutes] = time.split(":").map(Number);
    const dateWithTime = setMinutes(setHours(selectedDate, hours), minutes);
    return isBefore(dateWithTime, minTime);
  };

  return (
    <div className="space-y-2">
      {scheduledDate ? (
        <div className="flex items-center justify-between p-3 bg-goride-green-light border border-primary/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                Scheduled for
              </div>
              <div className="text-sm text-primary font-semibold">
                {format(scheduledDate, "EEE, MMM d 'at' h:mm a")}
              </div>
            </div>
          </div>
          <button
            onClick={handleClearSchedule}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 p-3 w-full bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-left">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  Schedule for later
                </div>
                <div className="text-xs text-muted-foreground">
                  Book a ride in advance
                </div>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" side="top">
            <div className="p-4 space-y-4">
              <div className="font-semibold text-foreground">Schedule your ride</div>
              
              {/* Calendar */}
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => isBefore(date, minDate)}
                initialFocus
                className="rounded-md border pointer-events-auto"
              />

              {/* Time Selector */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Select time
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      disabled={isTimeDisabled(time)}
                      className={cn(
                        "px-3 py-2 text-sm rounded-lg transition-colors",
                        selectedTime === time
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80 text-foreground",
                        isTimeDisabled(time) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                variant="goride"
                className="w-full"
                onClick={handleConfirm}
                disabled={!selectedDate}
              >
                Confirm Schedule
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
