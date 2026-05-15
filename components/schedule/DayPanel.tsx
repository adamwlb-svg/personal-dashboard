"use client";

import { isSameDay, format, getHours, getMinutes } from "date-fns";
import { CalendarEvent, TodoDue, CATEGORIES, CategoryKey } from "@/lib/calendar";

type Props = {
  date: Date;
  events: CalendarEvent[];
  todos: TodoDue[];
  onClose: () => void;
  onNewEvent: (date: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
};

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_PX = 52;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX;
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function eventPosition(event: CalendarEvent) {
  const startH = getHours(event.startTime) + getMinutes(event.startTime) / 60;
  const endH   = getHours(event.endTime)   + getMinutes(event.endTime)   / 60;
  const top    = (Math.max(startH, START_HOUR) - START_HOUR) * HOUR_PX;
  const height = Math.max(
    (Math.min(endH, END_HOUR) - Math.max(startH, START_HOUR)) * HOUR_PX,
    22
  );
  return { top, height };
}

const PRIORITY_LABEL: Record<string, string> = { high: "High", medium: "Med", low: "Low" };
const PRIORITY_COLOR: Record<string, string> = {
  high:   "bg-red-500/20 text-red-400",
  medium: "bg-red-500/20 text-red-400",
  low:    "bg-fg-4/20 text-fg-3",
};

export function DayPanel({ date, events, todos, onClose, onNewEvent, onEditEvent }: Props) {
  const dayTodos = todos.filter((t) => isSameDay(t.dueDate, date));
  const allDayEvents = events.filter((e) => e.allDay && isSameDay(e.startTime, date));
  const timedEvents  = events
    .filter((e) => !e.allDay && isSameDay(e.startTime, date))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="w-72 flex-shrink-0 bg-surface-raised border-l border-surface-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border flex-shrink-0">
        <div>
          <p className="text-xs text-fg-3 uppercase tracking-wider">{format(date, "EEEE")}</p>
          <p className="text-lg font-semibold text-fg">{format(date, "MMMM d")}</p>
        </div>
        <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Due to-dos */}
        {dayTodos.length > 0 && (
          <div className="px-3 pt-3 pb-2 space-y-1.5 border-b border-surface-border">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide flex items-center gap-1">
              <span>!</span> Due Today
            </p>
            {dayTodos.map((todo) => (
              <a
                key={todo.id}
                href="/todo"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <span className="text-red-400 font-bold text-sm flex-shrink-0">!</span>
                <span className="text-sm text-fg flex-1 truncate">{todo.title}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLOR[todo.priority] ?? PRIORITY_COLOR.medium}`}>
                  {PRIORITY_LABEL[todo.priority] ?? todo.priority}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="px-3 pt-3 pb-2 space-y-1.5 border-b border-surface-border">
            <p className="text-xs font-semibold text-fg-3 uppercase tracking-wide">All Day</p>
            {allDayEvents.map((event) => {
              const cat = CATEGORIES[event.category as CategoryKey] ?? CATEGORIES.other;
              return (
                <button
                  key={event.id}
                  onClick={() => onEditEvent(event)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80 ${cat.border} ${cat.bg} ${cat.text}`}
                >
                  {event.emoji && <span className="mr-1">{event.emoji}</span>}
                  {event.title}
                </button>
              );
            })}
          </div>
        )}

        {/* Timeline */}
        {timedEvents.length === 0 && allDayEvents.length === 0 && dayTodos.length === 0 ? (
          <p className="text-sm text-fg-3 text-center py-10">No events scheduled</p>
        ) : (
          <div className="relative flex" style={{ height: TOTAL_HEIGHT }}>
            {/* Hour labels */}
            <div className="w-10 flex-shrink-0 relative select-none">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-1 text-[10px] text-fg-3 leading-none"
                  style={{ top: (hour - START_HOUR) * HOUR_PX - 6 }}
                >
                  {format(new Date(2024, 0, 1, hour), "ha")}
                </div>
              ))}
            </div>

            {/* Grid + events */}
            <div className="flex-1 relative border-l border-surface-border/40">
              {/* Hour lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-surface-border/40"
                  style={{ top: (hour - START_HOUR) * HOUR_PX }}
                />
              ))}

              {/* Event blocks */}
              {timedEvents.map((event) => {
                const { top, height } = eventPosition(event);
                const cat = CATEGORIES[event.category as CategoryKey] ?? CATEGORIES.other;
                return (
                  <button
                    key={`${event.id}-${event.startTime.toISOString()}`}
                    onClick={() => onEditEvent(event)}
                    style={{ top, height, left: 4, right: 4 }}
                    className={`absolute rounded-md px-2 py-0.5 text-left overflow-hidden border transition-opacity hover:opacity-75 z-10
                      ${cat.bg} ${cat.text} ${cat.border}`}
                  >
                    <p className="text-xs font-semibold truncate leading-tight">
                      {event.isRecurring && <span className="opacity-50 mr-0.5">↻</span>}
                      {event.emoji && <span className="mr-0.5">{event.emoji}</span>}
                      {event.title}
                    </p>
                    {height > 28 && (
                      <p className="text-xs opacity-60 leading-tight">
                        {format(event.startTime, "h:mm")}–{format(event.endTime, "h:mm a")}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-surface-border flex-shrink-0">
        <button
          onClick={() => onNewEvent(date)}
          className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover text-fg text-sm font-medium transition-colors"
        >
          + Add Event
        </button>
      </div>
    </div>
  );
}
