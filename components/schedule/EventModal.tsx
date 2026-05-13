"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarEvent, CATEGORIES, CategoryKey } from "@/lib/calendar";
import { createEvent, updateEvent, deleteEvent } from "@/app/schedule/actions";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { useRouter } from "next/navigation";

type Props = {
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
  onClose: () => void;
};

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom days..." },
];

const WEEK_DAYS = [
  { label: "S", value: "SU" },
  { label: "M", value: "MO" },
  { label: "T", value: "TU" },
  { label: "W", value: "WE" },
  { label: "T", value: "TH" },
  { label: "F", value: "FR" },
  { label: "S", value: "SA" },
];

const DOW_ABBR = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function toDateTimeLocal(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

function toDateLocal(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function EventModal({ event, defaultDate, onClose }: Props) {
  const router = useRouter();
  const isEditing = !!event;

  const initStart = defaultDate ?? event?.startTime ?? new Date();
  const initEnd =
    event?.endTime ?? new Date(initStart.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(event?.title ?? "");
  const [emoji, setEmoji] = useState(event?.emoji ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [category, setCategory] = useState<CategoryKey>(
    (event?.category as CategoryKey) ?? "personal"
  );
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startTime, setStartTime] = useState(toDateTimeLocal(initStart));
  const [endTime, setEndTime] = useState(toDateTimeLocal(initEnd));
  const [recurrence, setRecurrence] = useState("none");
  const [customDays, setCustomDays] = useState<string[]>(["MO"]);
  const [endsOn, setEndsOn] = useState(false);
  const [endsOnDate, setEndsOnDate] = useState(
    toDateLocal(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!event?.isRecurring || !event.rrule) return;
    const r = event.rrule;
    if (r.includes("FREQ=DAILY")) setRecurrence("daily");
    else if (r.includes("FREQ=YEARLY")) setRecurrence("yearly");
    else if (r.includes("FREQ=MONTHLY")) setRecurrence("monthly");
    else if (r.includes("BYDAY=MO,TU,WE,TH,FR")) setRecurrence("weekdays");
    else if (r.includes("FREQ=WEEKLY")) {
      const match = r.match(/BYDAY=([^;]+)/);
      if (match) {
        setCustomDays(match[1].split(","));
        setRecurrence("custom");
      } else {
        setRecurrence("weekly");
      }
    }
    if (event.recurrenceEnd) {
      setEndsOn(true);
      setEndsOnDate(toDateLocal(event.recurrenceEnd));
    }
  }, [event]);

  function buildRRule(): string | undefined {
    const until = endsOn
      ? `;UNTIL=${new Date(endsOnDate + "T23:59:59").toISOString().replace(/[-:.]/g, "").slice(0, 15)}Z`
      : "";

    switch (recurrence) {
      case "daily":
        return `FREQ=DAILY${until}`;
      case "weekly": {
        const dow = DOW_ABBR[new Date(startTime).getDay()];
        return `FREQ=WEEKLY;BYDAY=${dow}${until}`;
      }
      case "weekdays":
        return `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR${until}`;
      case "monthly":
        return `FREQ=MONTHLY${until}`;
      case "yearly":
        return `FREQ=YEARLY${until}`;
      case "custom":
        if (customDays.length === 0) return undefined;
        return `FREQ=WEEKLY;BYDAY=${customDays.join(",")}${until}`;
      default:
        return undefined;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const rrule = buildRRule();
    const data = {
      title: title.trim(),
      emoji: emoji || undefined,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      allDay,
      category,
      isRecurring: recurrence !== "none",
      rrule,
      recurrenceEnd:
        endsOn && recurrence !== "none"
          ? new Date(endsOnDate).toISOString()
          : undefined,
    };

    if (isEditing) {
      await updateEvent(event.originalId ?? event.id, data);
    } else {
      await createEvent(data);
    }

    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!event) return;
    setDeleting(true);
    await deleteEvent(event.originalId ?? event.id);
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface-raised border border-surface-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-fg">
            {isEditing ? "Edit Event" : "New Event"}
          </h2>
          <button
            onClick={onClose}
            className="text-fg-3 hover:text-fg-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
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

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {/* Title + Emoji */}
          <div className="flex gap-2">
            <EmojiPicker value={emoji} onChange={setEmoji} />
            <input
              type="text"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="flex-1 bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>

          {/* All day */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              role="checkbox"
              aria-checked={allDay}
              onClick={() => setAllDay((v) => !v)}
              className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${allDay ? "bg-accent" : "bg-surface-border"}`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allDay ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-sm text-fg-2">All day</span>
          </label>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Start</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? startTime.slice(0, 10) : startTime}
                onChange={(e) =>
                  setStartTime(
                    allDay ? e.target.value + "T00:00" : e.target.value
                  )
                }
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-fg-3 mb-1 block">End</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? endTime.slice(0, 10) : endTime}
                onChange={(e) =>
                  setEndTime(
                    allDay ? e.target.value + "T23:59" : e.target.value
                  )
                }
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-fg-3 mb-2 block">
              Category
            </label>
            <div className="flex gap-2 flex-wrap">
              {(
                Object.entries(CATEGORIES) as [
                  CategoryKey,
                  (typeof CATEGORIES)[CategoryKey],
                ][]
              ).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border
                    ${category === key ? `${cat.bg} ${cat.text} ${cat.border}` : "bg-surface border-surface-border text-fg-3 hover:border-gray-500"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs text-fg-3 mb-2 block">Repeat</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-accent"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom day picker */}
          {recurrence === "custom" && (
            <div>
              <label className="text-xs text-fg-3 mb-2 block">
                Repeat on
              </label>
              <div className="flex gap-1.5">
                {WEEK_DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      setCustomDays((prev) =>
                        prev.includes(day.value)
                          ? prev.filter((d) => d !== day.value)
                          : [...prev, day.value]
                      )
                    }
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors
                      ${customDays.includes(day.value) ? "bg-accent text-fg" : "bg-surface border border-surface-border text-fg-2 hover:border-gray-500"}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recurrence end */}
          {recurrence !== "none" && (
            <div>
              <label className="text-xs text-fg-3 mb-2 block">Ends</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!endsOn}
                    onChange={() => setEndsOn(false)}
                    className="accent-indigo-500"
                  />
                  <span className="text-sm text-fg-2">Never</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={endsOn}
                    onChange={() => setEndsOn(true)}
                    className="accent-indigo-500"
                  />
                  <span className="text-sm text-fg-2">On</span>
                </label>
                {endsOn && (
                  <input
                    type="date"
                    value={endsOnDate}
                    onChange={(e) => setEndsOnDate(e.target.value)}
                    className="bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-fg text-sm focus:outline-none focus:border-accent"
                  />
                )}
              </div>
            </div>
          )}

          {/* Location */}
          <input
            type="text"
            placeholder="Add location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
          />

          {/* Description */}
          <textarea
            placeholder="Add description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-gray-500 focus:outline-none focus:border-accent text-sm resize-none"
          />

          {/* Footer actions */}
          <div className="flex items-center gap-2 pt-1">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-fg-2 hover:text-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
