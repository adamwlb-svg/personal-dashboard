"use client";

import { useState } from "react";
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
  addDays,
  differenceInCalendarDays,
} from "date-fns";
import { CalendarEvent, TodoDue, CATEGORIES, CategoryKey } from "@/lib/calendar";

type Props = {
  currentDate: Date;
  events: CalendarEvent[];
  todos: TodoDue[];
  selectedDay: Date | null;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onMoveEvent: (id: number, newStart: Date, newEnd: Date) => void;
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS = 3;
const DRAG_KEY = "text/x-calendar-event";

export function MonthGrid({
  currentDate,
  events,
  todos,
  selectedDay,
  onDayClick,
  onEventClick,
  onMoveEvent,
}: Props) {
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const rows = days.length / 7;

  function handleDragStart(e: React.DragEvent, event: CalendarEvent) {
    e.stopPropagation();
    setDraggingId(event.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      DRAG_KEY,
      JSON.stringify({
        eventId: event.id,
        originalStart: event.startTime.toISOString(),
        originalEnd: event.endTime.toISOString(),
      })
    );
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverDay(null);
  }

  function handleDragOver(e: React.DragEvent, day: Date) {
    if (!e.dataTransfer.types.includes(DRAG_KEY)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(day.toISOString());
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the cell itself, not a child
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverDay(null);
    }
  }

  function handleDrop(e: React.DragEvent, targetDay: Date) {
    e.preventDefault();
    setDragOverDay(null);
    setDraggingId(null);
    const raw = e.dataTransfer.getData(DRAG_KEY);
    if (!raw) return;
    const { eventId, originalStart, originalEnd } = JSON.parse(raw);
    const origStart = new Date(originalStart);
    const origEnd = new Date(originalEnd);
    const delta = differenceInCalendarDays(targetDay, origStart);
    if (delta === 0) return;
    onMoveEvent(eventId, addDays(origStart, delta), addDays(origEnd, delta));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-7 border-b border-surface-border flex-shrink-0">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-fg-3 uppercase tracking-wider">
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
          const dayKey = day.toISOString();
          const dayEvents = events.filter((e) => isSameDay(e.startTime, day));
          const dayTodos = todos.filter((t) => isSameDay(t.dueDate, day));
          const totalItems = dayEvents.length + dayTodos.length;
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const isDropTarget = dragOverDay === dayKey;

          return (
            <div
              key={dayKey}
              onClick={() => onDayClick(day)}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
              className={`border-b border-r border-surface-border p-1.5 flex flex-col gap-0.5 cursor-pointer transition-colors overflow-hidden
                ${isDropTarget ? "bg-accent/10 ring-1 ring-inset ring-accent/40" : isSelected ? "bg-accent/5" : "hover:bg-white/[0.02]"}`}
            >
              <div className="flex justify-end mb-0.5">
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium transition-colors
                  ${today ? "bg-accent text-fg" : ""}
                  ${!today && inMonth ? "text-fg-2" : ""}
                  ${!today && !inMonth ? "text-fg-3" : ""}`}
                >
                  {format(day, "d")}
                </span>
              </div>

              {dayEvents.slice(0, MAX_CHIPS).map((event) => {
                const cat = CATEGORIES[event.category as CategoryKey] ?? CATEGORIES.other;
                const isDragging = draggingId === event.id;
                const canDrag = !event.isRecurringInstance;
                return (
                  <button
                    key={`${event.id}-${event.startTime.toISOString()}`}
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => handleDragStart(e, event) : undefined}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium transition-all
                      ${cat.bg} ${cat.text}
                      ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}
                      ${isDragging ? "opacity-40 scale-95" : "hover:opacity-75"}`}
                  >
                    {event.isRecurring && <span className="opacity-50 mr-0.5">↻</span>}
                    {event.emoji && <span className="mr-0.5">{event.emoji}</span>}
                    {!event.allDay && <span className="opacity-60">{format(event.startTime, "h:mma")} </span>}
                    {event.title}
                  </button>
                );
              })}

              {dayTodos.slice(0, Math.max(0, MAX_CHIPS - dayEvents.length)).map((todo) => (
                <a
                  key={`todo-${todo.id}`}
                  href="/todo"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium transition-opacity hover:opacity-75 bg-red-500/20 text-red-400 flex items-center gap-0.5"
                >
                  <span className="font-bold flex-shrink-0">!</span>
                  <span className="truncate">{todo.title}</span>
                </a>
              ))}

              {totalItems > MAX_CHIPS && (
                <span className="text-xs text-fg-3 pl-1">+{totalItems - MAX_CHIPS} more</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
