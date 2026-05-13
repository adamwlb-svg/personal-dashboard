import { rrulestr } from "rrule";

export type TodoDue = {
  id: number;
  title: string;
  priority: string; // "high" | "medium" | "low"
  dueDate: Date;
};

export type CalendarEvent = {
  id: number;
  title: string;
  emoji: string | null;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  category: string;
  isRecurring: boolean;
  rrule: string | null;
  recurrenceEnd: Date | null;
  googleEventId: string | null;
  appleEventId: string | null;
  iCalUID: string | null;
  syncSource: string | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Set on expanded recurring instances
  originalId?: number;
  isRecurringInstance?: boolean;
};

export const CATEGORIES = {
  work: {
    label: "Work",
    bg: "bg-blue-500/20",
    text: "text-blue-300",
    dot: "bg-blue-400",
    border: "border-blue-500/30",
  },
  personal: {
    label: "Personal",
    bg: "bg-violet-500/20",
    text: "text-violet-300",
    dot: "bg-violet-400",
    border: "border-violet-500/30",
  },
  health: {
    label: "Health",
    bg: "bg-emerald-500/20",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    border: "border-emerald-500/30",
  },
  social: {
    label: "Social",
    bg: "bg-amber-500/20",
    text: "text-amber-300",
    dot: "bg-amber-400",
    border: "border-amber-500/30",
  },
  other: {
    label: "Other",
    bg: "bg-gray-500/20",
    text: "text-gray-300",
    dot: "bg-gray-400",
    border: "border-gray-500/30",
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

function formatDTSTART(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

export function expandEvents(
  events: CalendarEvent[],
  viewStart: Date,
  viewEnd: Date
): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.isRecurring || !event.rrule) {
      if (event.startTime <= viewEnd && event.endTime >= viewStart) {
        result.push(event);
      }
      continue;
    }

    try {
      const fullStr = `DTSTART:${formatDTSTART(event.startTime)}\nRRULE:${event.rrule}`;
      const rule = rrulestr(fullStr);
      const duration = event.endTime.getTime() - event.startTime.getTime();
      const occurrences = rule.between(viewStart, viewEnd, true);

      for (const occurrence of occurrences) {
        result.push({
          ...event,
          startTime: occurrence,
          endTime: new Date(occurrence.getTime() + duration),
          originalId: event.id,
          isRecurringInstance: true,
        });
      }
    } catch {
      if (event.startTime <= viewEnd && event.endTime >= viewStart) {
        result.push(event);
      }
    }
  }

  return result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}
