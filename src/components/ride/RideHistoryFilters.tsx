import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export type RideStatus = "all" | "completed" | "cancelled" | "in_progress";

interface RideHistoryFiltersProps {
  dateRange: DateRange | undefined;
  status: RideStatus;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onStatusChange: (status: RideStatus) => void;
  onClearFilters: () => void;
}

const presetRanges = [
  { label: "Last 7 days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "This month", getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last month", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
];

export const RideHistoryFilters = ({
  dateRange,
  status,
  onDateRangeChange,
  onStatusChange,
  onClearFilters,
}: RideHistoryFiltersProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const hasActiveFilters = dateRange?.from || status !== "all";

  const activeFilterCount = [
    dateRange?.from ? 1 : 0,
    status !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range Picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal min-w-[240px]",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Select date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              {/* Presets */}
              <div className="border-r p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Quick select</p>
                {presetRanges.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      onDateRangeChange(preset.getValue());
                      setCalendarOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-muted-foreground"
                  onClick={() => {
                    onDateRangeChange(undefined);
                    setCalendarOpen(false);
                  }}
                >
                  All time
                </Button>
              </div>
              {/* Calendar */}
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                disabled={(date) => date > new Date()}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Select value={status} onValueChange={(value) => onStatusChange(value as RideStatus)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Active filters:
          </span>
          {dateRange?.from && (
            <Badge variant="secondary" className="gap-1">
              {dateRange.to
                ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
                : format(dateRange.from, "MMM d, yyyy")}
              <button
                onClick={() => onDateRangeChange(undefined)}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {status !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {status.replace("_", " ")}
              <button
                onClick={() => onStatusChange("all")}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
