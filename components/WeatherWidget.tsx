"use client";

import { useEffect, useState } from "react";

// ── WMO weather code → label + emoji ─────────────────────────────────────────
function wmoLabel(code: number): { label: string; emoji: string } {
  if (code === 0)  return { label: "Clear",         emoji: "☀️" };
  if (code === 1)  return { label: "Mostly Clear",  emoji: "🌤️" };
  if (code === 2)  return { label: "Partly Cloudy", emoji: "⛅" };
  if (code === 3)  return { label: "Overcast",      emoji: "☁️" };
  if (code <= 48)  return { label: "Foggy",         emoji: "🌫️" };
  if (code <= 55)  return { label: "Drizzle",       emoji: "🌦️" };
  if (code <= 65)  return { label: "Rain",          emoji: "🌧️" };
  if (code <= 77)  return { label: "Snow",          emoji: "🌨️" };
  if (code <= 82)  return { label: "Showers",       emoji: "🌧️" };
  if (code <= 84)  return { label: "Snow Showers",  emoji: "🌨️" };
  if (code <= 99)  return { label: "Thunderstorm",  emoji: "⛈️" };
  return { label: "Unknown", emoji: "🌡️" };
}

function formatHour(hour: number): string {
  if (hour === 0)  return "12am";
  if (hour < 12)  return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TODAY_START_HOUR = 7;
const TODAY_END_HOUR   = 23; // inclusive

type HourlySlot = {
  hour: number;       // 0–23
  temp: number;
  code: number;
  precipPct: number;
};

type WeatherData = {
  city: string;
  current: {
    temp: number;
    feelsLike: number;
    code: number;
    windMph: number;
  };
  todayHourly: HourlySlot[];
  daily: Array<{
    date: string;
    high: number;
    low: number;
    code: number;
    precipIn: number;
  }>;
};

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const [weatherRes, geoRes] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch` +
      `&timezone=auto&forecast_days=5`
    ),
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "en" } }
    ),
  ]);

  const weather = await weatherRes.json();
  const geo     = await geoRes.json();

  const city =
    geo.address?.city ??
    geo.address?.town ??
    geo.address?.village ??
    geo.address?.county ??
    "Your Location";

  const todayPrefix = weather.daily.time[0] as string; // e.g. "2025-05-14"

  // Hourly times look like "2025-05-14T07:00" — filter to today, 7am–11pm
  const todayHourly: HourlySlot[] = (weather.hourly.time as string[])
    .map((t: string, i: number) => ({ t, i }))
    .filter(({ t }) => {
      const [date, time] = t.split("T");
      const hour = parseInt(time.slice(0, 2), 10);
      return date === todayPrefix && hour >= TODAY_START_HOUR && hour <= TODAY_END_HOUR;
    })
    .map(({ i }) => ({
      hour:       parseInt((weather.hourly.time[i] as string).split("T")[1].slice(0, 2), 10),
      temp:       Math.round(weather.hourly.temperature_2m[i]),
      code:       weather.hourly.weather_code[i],
      precipPct:  weather.hourly.precipitation_probability[i] ?? 0,
    }));

  return {
    city,
    current: {
      temp:      Math.round(weather.current.temperature_2m),
      feelsLike: Math.round(weather.current.apparent_temperature),
      code:      weather.current.weather_code,
      windMph:   Math.round(weather.current.wind_speed_10m),
    },
    todayHourly,
    daily: weather.daily.time.map((date: string, i: number) => ({
      date,
      high:     Math.round(weather.daily.temperature_2m_max[i]),
      low:      Math.round(weather.daily.temperature_2m_min[i]),
      code:     weather.daily.weather_code[i],
      precipIn: weather.daily.precipitation_sum[i] ?? 0,
    })),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WeatherWidget() {
  const [data,    setData]    = useState<WeatherData | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          setData(result);
        } catch {
          setError("Could not load weather");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-8 bg-surface rounded" />
          <div className="w-32 h-4 bg-surface rounded" />
        </div>
        <div className="h-16 bg-surface rounded-lg mb-3" />
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-14 bg-surface rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5 flex items-center gap-3 text-fg-3 text-sm">
        <span className="text-xl">🌡️</span>
        <span>{error ?? "Weather unavailable"}</span>
      </div>
    );
  }

  const { label, emoji } = wmoLabel(data.current.code);
  const nowHour = new Date().getHours();
  const futureDays = data.daily.slice(1); // skip today

  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-5 space-y-4">
      {/* Current conditions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl leading-none">{emoji}</span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-fg tracking-tight">{data.current.temp}°</span>
              <span className="text-sm text-fg-3 font-medium">{label}</span>
            </div>
            <p className="text-xs text-fg-3 mt-0.5">
              Feels like {data.current.feelsLike}° · Wind {data.current.windMph} mph
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-fg-2">{data.city}</p>
          <p className="text-xs text-fg-3 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Today's hourly strip */}
      {data.todayHourly.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3 mb-2">Today&apos;s Forecast</p>
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex gap-1.5" style={{ minWidth: "max-content" }}>
              {data.todayHourly.map((slot) => {
                const { emoji: slotEmoji } = wmoLabel(slot.code);
                const isCurrent = slot.hour === nowHour || (nowHour < TODAY_START_HOUR && slot.hour === TODAY_START_HOUR);
                const isPast    = slot.hour < nowHour;
                return (
                  <div
                    key={slot.hour}
                    className={`flex flex-col items-center gap-1 py-2 px-2.5 rounded-lg border min-w-[52px] transition-colors
                      ${isCurrent
                        ? "bg-accent/15 border-accent/30"
                        : isPast
                        ? "bg-surface/50 border-surface-border opacity-50"
                        : "bg-surface border-surface-border"}`}
                  >
                    <span className={`text-[11px] font-semibold ${isCurrent ? "text-accent" : "text-fg-3"}`}>
                      {formatHour(slot.hour)}
                    </span>
                    <span className="text-base leading-none">{slotEmoji}</span>
                    <span className="text-xs font-semibold text-fg">{slot.temp}°</span>
                    {slot.precipPct >= 20 && (
                      <span className="text-[10px] text-blue-400">{slot.precipPct}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming days */}
      {futureDays.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-3 mb-2">Upcoming</p>
          <div className="flex gap-2">
            {futureDays.map((day) => {
              const d = new Date(day.date + "T12:00:00");
              const { emoji: dayEmoji } = wmoLabel(day.code);
              const showPrecip = day.precipIn >= 0.05;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg bg-surface border border-surface-border"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-3">
                    {DAY_NAMES[d.getDay()]}
                  </span>
                  <span className="text-lg leading-none">{dayEmoji}</span>
                  <span className="text-xs font-semibold text-fg">{day.high}°</span>
                  <span className="text-xs text-fg-3">{day.low}°</span>
                  {showPrecip && (
                    <span className="text-[10px] text-blue-400">{day.precipIn.toFixed(2)}&quot;</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
