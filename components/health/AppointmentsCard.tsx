"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { SerializedAppointment } from "@/lib/health";

function formatApptDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Today · ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "h:mm a")}`;
  return format(d, "MMM d · h:mm a");
}

export function AppointmentsCard({
  appointments,
}: {
  appointments: SerializedAppointment[];
}) {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        🏥 Upcoming Health Appointments
      </h3>

      {appointments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No upcoming health appointments — add one in Schedule.
        </p>
      ) : (
        <div className="space-y-2">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">
                  {appt.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatApptDate(appt.startTime)}
                </p>
                {appt.location && (
                  <p className="text-xs text-gray-600 truncate mt-0.5">
                    📍 {appt.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
