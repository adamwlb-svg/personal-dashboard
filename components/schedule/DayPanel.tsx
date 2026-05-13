"use client";

import { isSameDay, format } from "date-fns";
import { CalendarEvent, TodoDue, CATEGORIES, CategoryKey } from "@/lib/calendar";

type Props = {
  date: Date;
  events: CalendarEvent[];
  todos: TodoDue[];
  onClose: () => void;
  onNewEvent: (date: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
};

const PRIORITY_LABEL: Record<string, string> = { high: "High", medium: "Med", low: "Low" };
const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-red-500/20 text-red-400",
  low: "bg-fg-4/20 text-fg-3",
};

export function DayPanel({
  date,
  events,
  todos,
  onClose,
  onNewEvent,
  onEditEvent,
}: Props) {
  const dayTodos = todos.filter((t) => isSameDay(t.dueDate, date));
  const dayEvents = events
    .filter((e) => isSameDay(e.startTime, date))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="w-72 flex-shrink-0 bg-surface-raised border-l border-surface-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div>
          <p className="text-xs text-fg-3 uppercase tracking-wider">
            {format(date, "EEEE")}
          </p>
          <p className="text-lg font-semibold text-fg">
            {format(date, "MMMM d")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-fg-3 hover:text-fg-2 transition-colors p-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Due to-dos */}
        {dayTodos.length > 0 && (
          <div className="space-y-1.5">
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

        {/* Empty state */}
        {dayEvents.length === 0 && dayTodos.length === 0 && (
          <p className="text-sm text-fg-3 text-center py-10">No events scheduled</p>
        )}

        {/* Events */}
        {dayEvents.length > 0 && (
          <div className="space-y-2">
            {dayTodos.length > 0 && (
              <p className="text-xs font-semibold text-fg-3 uppercase tracking-wide">Events</p>
            )}
            {dayEvents.map((event) => {
              const cat = CATEGORIES[event.category as CategoryKey] ?? CATEGORIES.other;
              return (
                <button
                  key={`${event.id}-${event.startTime.toISOString()}`}
                  onClick={() => onEditEvent(event)}
                  className={`w-full text-left p-3 rounded-lg border transition-opacity hover:opacity-80 ${cat.border} ${cat.bg}`}
                >
                  <p className={`text-sm font-medium ${cat.text}`}>
                    {event.isRecurring && <span className="opacity-50 mr-1">↻</span>}
                    {event.emoji && <span className="mr-1">{event.emoji}</span>}
                    {event.title}
                  </p>
                  {event.allDay ? (
                    <p className="text-xs text-fg-2 mt-0.5">All day</p>
                  ) : (
                    <p className="text-xs text-fg-2 mt-0.5">
                      {format(event.startTime, "h:mm a")} – {format(event.endTime, "h:mm a")}
                    </p>
                  )}
                  {event.location && (
                    <p className="text-xs text-fg-3 mt-1 truncate">📍 {event.location}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-surface-border">
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
