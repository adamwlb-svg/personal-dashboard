"use client";

import { useState, useRef } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
  getHours,
  getMinutes,
  addDays,
  differenceInCalendarDays,
} from "date-fns";
import { CalendarEvent, TodoDue, CATEGORIES, CategoryKey } from "@/lib/calendar";

type Props = {
  currentDate: Date;
  events: CalendarEvent[];
  todos: TodoDue[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
  onMoveEvent: (id: number, newStart: Date, newEnd: Date) => void;
};

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_PX = 64;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX;
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const DRAG_KEY = "text/x-calendar-event";

function eventPosition(event: CalendarEvent) {
  const startH = getHours(event.startTime) + getMinutes(event.startTime) / 60;
  const endH = getHours(event.endTime) + getMinutes(event.endTime) / 60;
  const top = (Math.max(startH, START_HOUR) - START_HOUR) * HOUR_PX;
  const height = Math.max(
    (Math.min(endH, END_HOUR) - Math.max(startH, START_HOUR)) * HOUR_PX,
    24
  );
  return { top, height };
}

export function WeekView({
  currentDate,
  events,
  todos,
  onEventClick,
  onSlotClick,
  onMoveEvent,
}: Props) {
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  // Track mouse-Y offset within the dragged event block so drop lands at the right time
  const dragOffsetY = useRef(0);

  const days = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate),
  });

  function handleDragStart(e: React.DragEvent, event: CalendarEvent, blockTop: number) {
    e.stopPropagation();
    setDraggingId(event.id);
    e.dataTransfer.effectAllowed = "move";
    dragOffsetY.current = e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top;
    e.dataTransfer.setData(
      DRAG_KEY,
      JSON.stringify({
        eventId: event.id,
        originalStart: event.startTime.toISOString(),
        originalEnd: event.endTime.toISOString(),
        durationMs: event.endTime.getTime() - event.startTime.getTime(),
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
    const { eventId, originalStart, originalEnd, durationMs } = JSON.parse(raw);
    const origStart = new Date(originalStart);
    const origEnd = new Date(originalEnd);

    // Snap drop position to 15-min increments within the target day column
    const colRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - colRect.top - dragOffsetY.current;
    const droppedHour = Math.max(START_HOUR, Math.min(END_HOUR - 0.25, START_HOUR + relY / HOUR_PX));
    const snappedMinutes = Math.round((droppedHour % 1) * 4) * 15;
    const snappedHour = Math.floor(droppedHour);

    const dayDelta = differenceInCalendarDays(targetDay, origStart);
    const isSameColumn = dayDelta === 0;

    // If dropped in same column without Y data meaningful, just use day delta
    const newStart = addDays(new Date(origStart), dayDelta);
    if (!isSameColumn || e.dataTransfer.types.includes(DRAG_KEY)) {
      // Set time from drop position
      newStart.setHours(snappedHour, snappedMinutes, 0, 0);
    }
    const newEnd = new Date(newStart.getTime() + durationMs);

    if (newStart.getTime() === origStart.getTime() && newEnd.getTime() === origEnd.getTime()) return;
    onMoveEvent(eventId, newStart, newEnd);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-surface-border flex-shrink-0">
        <div className="w-14 flex-shrink-0" />
        {days.map((day) => (
          <div key={day.toISOString()} className="flex-1 py-2 text-center border-l border-surface-border">
            <p className="text-xs text-fg-3 uppercase">{format(day, "EEE")}</p>
            <p className={`text-sm font-semibold mx-auto w-7 h-7 flex items-center justify-center rounded-full mt-0.5
              ${isToday(day) ? "bg-accent text-fg" : "text-fg-2"}`}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Due-date strip */}
      {days.some((day) => todos.some((t) => isSameDay(t.dueDate, day))) && (
        <div className="flex border-b border-surface-border flex-shrink-0 bg-red-500/5">
          <div className="w-14 flex-shrink-0 flex items-center justify-end pr-2">
            <span className="text-xs text-red-400 font-bold">!</span>
          </div>
          {days.map((day) => {
            const dayTodos = todos.filter((t) => isSameDay(t.dueDate, day));
            return (
              <div key={day.toISOString()} className="flex-1 border-l border-surface-border/40 py-1 px-1 flex flex-col gap-0.5 min-h-[24px]">
                {dayTodos.map((todo) => (
                  <a
                    key={todo.id}
                    href="/todo"
                    className="text-xs px-1.5 py-0.5 rounded truncate font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-0.5"
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
        <div className="w-14 flex-shrink-0 relative select-none" style={{ height: TOTAL_HEIGHT }}>
          {hours.map((hour) => (
            <div key={hour} className="absolute right-2 text-xs text-fg-3" style={{ top: (hour - START_HOUR) * HOUR_PX - 8 }}>
              {format(new Date(2024, 0, 1, hour), "h a")}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayKey = day.toISOString();
          const dayEvents = events.filter((e) => !e.allDay && isSameDay(e.startTime, day));
          const isDropTarget = dragOverDay === dayKey;

          return (
            <div
              key={dayKey}
              className={`flex-1 border-l border-surface-border relative cursor-pointer transition-colors
                ${isDropTarget ? "bg-accent/5" : ""}`}
              style={{ height: TOTAL_HEIGHT }}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const relY = e.clientY - rect.top;
                const hour = Math.floor(relY / HOUR_PX) + START_HOUR;
                const date = new Date(day);
                date.setHours(hour, 0, 0, 0);
                onSlotClick(date);
              }}
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <div key={hour} className="absolute inset-x-0 border-t border-surface-border/40" style={{ top: (hour - START_HOUR) * HOUR_PX }} />
              ))}

              {/* Drop indicator line */}
              {isDropTarget && (
                <div className="absolute inset-x-0 h-0.5 bg-accent/60 pointer-events-none z-20" style={{ top: "50%" }} />
              )}

              {/* Events */}
              {dayEvents.map((event) => {
                const { top, height } = eventPosition(event);
                const cat = CATEGORIES[event.category as CategoryKey] ?? CATEGORIES.other;
                const isDragging = draggingId === event.id;
                const canDrag = !event.isRecurringInstance;
                return (
                  <button
                    key={`${event.id}-${event.startTime.toISOString()}`}
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => { e.stopPropagation(); handleDragStart(e, event, top); } : undefined}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    style={{ top, height, left: 3, right: 3 }}
                    className={`absolute rounded-md px-2 py-0.5 text-left overflow-hidden border transition-all z-10
                      ${cat.bg} ${cat.text} ${cat.border}
                      ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}
                      ${isDragging ? "opacity-30 scale-95" : "hover:opacity-75"}`}
                  >
                    <p className="text-xs font-medium truncate leading-tight">
                      {event.isRecurring && <span className="opacity-50 mr-0.5">↻</span>}
                      {event.emoji && <span className="mr-0.5">{event.emoji}</span>}
                      {event.title}
                    </p>
                    {height > 30 && (
                      <p className="text-xs opacity-60">{format(event.startTime, "h:mm a")}</p>
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
