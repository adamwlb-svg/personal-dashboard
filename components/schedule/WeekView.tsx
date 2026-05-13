"use client";

import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
  getHours,
  getMinutes,
} from "date-fns";
import { CalendarEvent, TodoDue, CATEGORIES, CategoryKey } from "@/lib/calendar";

type Props = {
  currentDate: Date;
  events: CalendarEvent[];
  todos: TodoDue[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
};

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_PX = 64;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX;
const hours = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i
);

function eventPosition(event: CalendarEvent) {
  const startH = getHours(event.startTime) + getMinutes(event.startTime) / 60;
  const endH = getHours(event.endTime) + getMinutes(event.endTime) / 60;
  const top = (Math.max(startH, START_HOUR) - START_HOUR) * HOUR_PX;
  const height = Math.max(
    (Math.min(endH, END_HOUR) - Math.max(startH, START_HOUR)) * HOUR_PX,
    22
  );
  return { top, height };
}

export function WeekView({
  currentDate,
  events,
  todos,
  onEventClick,
  onSlotClick,
}: Props) {
  const days = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate),
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-surface-border flex-shrink-0">
        <div className="w-14 flex-shrink-0" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="flex-1 py-2 text-center border-l border-surface-border"
          >
            <p className="text-xs text-fg-3 uppercase">
              {format(day, "EEE")}
            </p>
            <p
              className={`text-sm font-semibold mx-auto w-7 h-7 flex items-center justify-center rounded-full mt-0.5
              ${isToday(day) ? "bg-accent text-fg" : "text-fg-2"}`}
            >
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Due-date strip */}
      {days.some((day) => todos.some((t) => isSameDay(t.dueDate, day))) && (
        <div className="flex border-b border-surface-border flex-shrink-0 bg-amber-500/5">
          <div className="w-14 flex-shrink-0 flex items-center justify-end pr-2">
            <span className="text-xs text-amber-400 font-bold">!</span>
          </div>
          {days.map((day) => {
            const dayTodos = todos.filter((t) => isSameDay(t.dueDate, day));
            return (
              <div key={day.toISOString()} className="flex-1 border-l border-surface-border/40 py-1 px-1 flex flex-col gap-0.5 min-h-[24px]">
                {dayTodos.map((todo) => (
                  <a
                    key={todo.id}
                    href="/todo"
                    className="text-xs px-1.5 py-0.5 rounded truncate font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center gap-0.5"
                  >
                    <span className="font-bold flex-shrink-0">!</span>
                    <span className="truncate">{todo.title}</span>
                  </a>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Hour labels */}
        <div
          className="w-14 flex-shrink-0 relative select-none"
          style={{ height: TOTAL_HEIGHT }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute right-2 text-xs text-fg-3"
              style={{ top: (hour - START_HOUR) * HOUR_PX - 8 }}
            >
              {format(new Date(2024, 0, 1, hour), "h a")}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayEvents = events.filter(
            (e) => !e.allDay && isSameDay(e.startTime, day)
          );

          return (
            <div
              key={day.toISOString()}
              className="flex-1 border-l border-surface-border relative cursor-pointer"
              style={{ height: TOTAL_HEIGHT }}
              onClick={(e) => {
                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                const relY = e.clientY - rect.top;
                const hour = Math.floor(relY / HOUR_PX) + START_HOUR;
                const date = new Date(day);
                date.setHours(hour, 0, 0, 0);
                onSlotClick(date);
              }}
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-surface-border/40"
                  style={{ top: (hour - START_HOUR) * HOUR_PX }}
                />
              ))}

              {/* Events */}
              {dayEvents.map((event) => {
                const { top, height } = eventPosition(event);
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
                    style={{ top, height, left: 3, right: 3 }}
                    className={`absolute rounded-md px-2 py-0.5 text-left overflow-hidden border transition-opacity hover:opacity-75 ${cat.bg} ${cat.text} ${cat.border}`}
                  >
                    <p className="text-xs font-medium truncate leading-tight">
                      {event.isRecurring && (
                        <span className="opacity-50 mr-0.5">↻</span>
                      )}
                      {event.title}
                    </p>
                    {height > 30 && (
                      <p className="text-xs opacity-60">
                        {format(event.startTime, "h:mm a")}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
