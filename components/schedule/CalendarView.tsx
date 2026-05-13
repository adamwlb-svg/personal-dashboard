"use client";

import { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { CalendarEvent, TodoDue, expandEvents } from "@/lib/calendar";
import { MonthGrid } from "./MonthGrid";
import { WeekView } from "./WeekView";
import { DayPanel } from "./DayPanel";
import { EventModal } from "./EventModal";

type SerializedEvent = Omit<
  CalendarEvent,
  | "startTime"
  | "endTime"
  | "recurrenceEnd"
  | "lastSyncedAt"
  | "createdAt"
  | "updatedAt"
> & {
  startTime: string;
  endTime: string;
  recurrenceEnd: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SerializedTodoDue = {
  id: number;
  title: string;
  priority: string;
  dueDate: string;
};

type ModalState = {
  open: boolean;
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
};

export function CalendarView({
  events: serialized,
  todos: serializedTodos = [],
}: {
  events: SerializedEvent[];
  todos?: SerializedTodoDue[];
}) {
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });

  const todos: TodoDue[] = useMemo(
    () => serializedTodos.map((t) => ({ ...t, dueDate: new Date(t.dueDate) })),
    [serializedTodos]
  );

  const rawEvents: CalendarEvent[] = useMemo(
    () =>
      serialized.map((e) => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: new Date(e.endTime),
        recurrenceEnd: e.recurrenceEnd ? new Date(e.recurrenceEnd) : null,
        lastSyncedAt: e.lastSyncedAt ? new Date(e.lastSyncedAt) : null,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      })),
    [serialized]
  );

  const { viewStart, viewEnd } = useMemo(() => {
    if (view === "month") {
      return {
        viewStart: startOfWeek(startOfMonth(currentDate)),
        viewEnd: endOfWeek(endOfMonth(currentDate)),
      };
    }
    return {
      viewStart: startOfWeek(currentDate),
      viewEnd: endOfWeek(currentDate),
    };
  }, [view, currentDate]);

  const events = useMemo(
    () => expandEvents(rawEvents, viewStart, viewEnd),
    [rawEvents, viewStart, viewEnd]
  );

  function navigate(dir: "prev" | "next") {
    const delta = dir === "prev" ? -1 : 1;
    setCurrentDate((d) =>
      view === "month" ? addMonths(d, delta) : addWeeks(d, delta)
    );
  }

  function openNew(date?: Date) {
    setModal({ open: true, defaultDate: date ?? selectedDay ?? new Date() });
  }

  function openEdit(event: CalendarEvent) {
    setModal({ open: true, event });
  }

  const heading =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : `${format(startOfWeek(currentDate), "MMM d")} – ${format(endOfWeek(currentDate), "MMM d, yyyy")}`;

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border flex-shrink-0 bg-surface-raised">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm font-medium border border-surface-border rounded-lg text-fg-2 hover:bg-white/5 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center">
            <button
              onClick={() => navigate("prev")}
              className="p-1.5 rounded-lg text-fg-2 hover:text-fg hover:bg-white/5 transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => navigate("next")}
              className="p-1.5 rounded-lg text-fg-2 hover:text-fg hover:bg-white/5 transition-colors"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <h2 className="text-base font-semibold text-fg min-w-[160px]">
            {heading}
          </h2>

          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex bg-surface border border-surface-border rounded-lg p-0.5 text-sm">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md font-medium transition-colors capitalize
                  ${view === v ? "bg-accent/20 text-accent" : "text-fg-2 hover:text-fg"}`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => openNew()}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-fg text-sm font-medium rounded-lg transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Event
          </button>
        </div>

        {/* Calendar body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {view === "month" ? (
            <MonthGrid
              currentDate={currentDate}
              events={events}
              todos={todos}
              selectedDay={selectedDay}
              onDayClick={(day) =>
                setSelectedDay((prev) =>
                  prev?.toDateString() === day.toDateString() ? null : day
                )
              }
              onEventClick={openEdit}
            />
          ) : (
            <WeekView
              currentDate={currentDate}
              events={events}
              todos={todos}
              onEventClick={openEdit}
              onSlotClick={(date) => openNew(date)}
            />
          )}
        </div>
      </div>

      {/* Day panel (month view only) */}
      {selectedDay && view === "month" && (
        <DayPanel
          date={selectedDay}
          events={events}
          todos={todos}
          onClose={() => setSelectedDay(null)}
          onNewEvent={openNew}
          onEditEvent={openEdit}
        />
      )}

      {/* Event modal */}
      {modal.open && (
        <EventModal
          event={modal.event}
          defaultDate={modal.defaultDate}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
