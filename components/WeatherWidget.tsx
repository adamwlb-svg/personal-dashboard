"use client";

import { useEffect, useState } from "react";

// ── WMO weather code → label + emoji ─────────────────────────────────────────
function wmoLabel(code: number): { label: string; emoji: string } {
  if (code === 0)               return { label: "Clear",          emoji: "☀️" };
  if (code === 1)               return { label: "Mostly Clear",   emoji: "🌤️" };
  if (code === 2)               return { label: "Partly Cloudy",  emoji: "⛅" };
  if (code === 3)               return { label: "Overcast",       emoji: "☁️" };
  if (code <= 48)               return { label: "Foggy",          emoji: "🌫️" };
  if (code <= 55)               return { label: "Drizzle",        emoji: "🌦️" };
  if (code <= 65)               return { label: "Rain",           emoji: "🌧️" };
  if (code <= 77)               return { label: "Snow",           emoji: "🌨️" };
  if (code <= 82)               return { label: "Showers",        emoji: "🌧️" };
  if (code <= 84)               return { label: "Snow Showers",   emoji: "🌨️" };
  if (code <= 99)               return { label: "Thunderstorm",   emoji: "⛈️" };
  return { label: "Unknown", emoji: "🌡️" };
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type WeatherData = {
  city: string;
  current: {
    temp: number;
    feelsLike: number;
    code: number;
    windMph: number;
  };
  daily: Array<{
    date: string;        // ISO date string
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

  return {
    city,
    current: {
      temp:      Math.round(weather.current.temperature_2m),
      feelsLike: Math.round(weather.current.apparent_temperature),
      code:      weather.current.weather_code,
      windMph:   Math.round(weather.current.wind_speed_10m),
    },
    daily: weather.daily.time.map((date: string, i: number) => ({
      date,
      high:      Math.round(weather.daily.temperature_2m_max[i]),
      low:       Math.round(weather.daily.temperature_2m_min[i]),
      code:      weather.daily.weather_code[i],
      precipIn:  weather.daily.precipitation_sum[i] ?? 0,
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
        <div className="flex gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
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
  const today = new Date().toISOString().slice(0, 10);

  // Forecast = today + next 4 days
  const forecast = data.daily.slice(0, 5);

  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
      {/* Current conditions */}
      <div className="flex items-start justify-between mb-4">
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

      {/* 5-day forecast */}
      <div className="flex gap-2">
        {forecast.map((day) => {
          const d = new Date(day.date + "T12:00:00");
          const isToday = day.date === today;
          const { emoji: dayEmoji } = wmoLabel(day.code);
          const showPrecip = day.precipIn >= 0.05;

          return (
            <div
              key={day.date}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg
                ${isToday ? "bg-accent/10 border border-accent/20" : "bg-surface border border-surface-border"}`}
            >
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${isToday ? "text-accent" : "text-fg-3"}`}>
                {isToday ? "Now" : DAY_NAMES[d.getDay()]}
              </span>
              <span className="text-lg leading-none">{dayEmoji}</span>
              <span className="text-xs font-semibold text-fg">{day.high}°</span>
              <span className="text-xs text-fg-3">{day.low}°</span>
              {showPrecip && (
                <span className="text-[10px] text-blue-400">{day.precipIn.toFixed(2)}"</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
