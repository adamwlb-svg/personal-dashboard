"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { CalendarEvent, CATEGORIES, CategoryKey } from "@/lib/calendar";

type Props = {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDay: Date | null;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS = 3;

export function MonthGrid({
  currentDate,
  events,
  selectedDay,
  onDayClick,
  onEventClick,
}: Props) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const rows = days.length / 7;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-7 border-b border-surface-border flex-shrink-0">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-fg-3 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="flex-1 grid grid-cols-7 overflow-hidden"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(e.startTime, day));
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`border-b border-r border-surface-border p-1.5 flex flex-col gap-0.5 cursor-pointer transition-colors overflow-hidden
                ${isSelected ? "bg-accent/5" : "hover:bg-white/[0.02]"}`}
            >
              <div className="flex justify-end mb-0.5">
                <span
                  className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium transition-colors
                    ${today ? "bg-accent text-fg" : ""}
                    ${!today && inMonth ? "text-fg-2" : ""}
                    ${!today && !inMonth ? "text-fg-3" : ""}`}
                >
                  {format(day, "d")}
                </span>
              </div>

              {dayEvents.slice(0, MAX_CHIPS).map((event) => {
                const cat =
                  CATEGORIES[event.category as CategoryKey] ??
                  CATEGORIES.other;
                return (
                  <button
                    key={`${event.id}-${event.startTime.toISOString()}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium transition-opacity hover:opacity-75 ${cat.bg} ${cat.text}`}
                  >
                    {event.isRecurring && (
                      <span className="opacity-50 mr-0.5">↻</span>
                    )}
                    {!event.allDay && (
                      <span className="opacity-60">
                        {format(event.startTime, "h:mma")}{" "}
                      </span>
                    )}
                    {event.title}
                  </button>
                );
              })}

              {dayEvents.length > MAX_CHIPS && (
                <span className="text-xs text-fg-3 pl-1">
                  +{dayEvents.length - MAX_CHIPS} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
