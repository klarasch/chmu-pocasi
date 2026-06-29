"use client";

import { useForecast } from "@/components/forecast/ForecastView";
import { WeatherIcon } from "@/components/icons/WeatherIcon";
import { conditionFor, isNightHour } from "@/lib/weather-codes";

type HourlyPoint = {
  time: string;
  temperatureC: number;
  precipMm: number;
  cloudCoverPct: number;
  windSpeedKmh: number;
};

export function HourlyStrip({ hourly }: { hourly: HourlyPoint[] }) {
  const { lat, lon } = useForecast();
  return (
    <div className="py-[13px] bg-background text-foreground">
      {/* Scrollable Row */}
      <div className="flex overflow-x-auto scrollbar-none px-0 gap-0">
        {hourly.map((h, i) => {
          const condition = conditionFor(
            h.precipMm,
            h.cloudCoverPct,
            h.temperatureC,
          );
          const isNight = isNightHour(h.time, lat, lon);
          const timeLabel = new Date(h.time).toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
          });

          // Show "Nyní" for the first hour if it's within the current hour,
          // or just display the hour number.
          const isCurrent = i === 0;

          // Determine precipitation probability percentage
          let precipPctVal = 0;
          if (h.precipMm > 0) {
            precipPctVal = Math.min(
              100,
              Math.max(10, Math.round(h.precipMm * 80)),
            );
            if (h.precipMm > 1.0) precipPctVal = 100;
          }
          const precipPct = `${precipPctVal}%`;
          const pColor =
            precipPctVal === 0 ? "var(--foreground-muted)" : "var(--accent)";

          return (
            <div
              key={h.time}
              className="w-[64px] shrink-0 border-l border-border-subtle px-[2px] flex flex-col items-center gap-[6px]"
            >
              <div className="text-[11px] text-foreground-muted font-normal">
                {isCurrent ? "Nyní" : timeLabel}
              </div>
              <WeatherIcon condition={condition} isNight={isNight} size={30} />
              <div className="text-[16px] font-semibold tracking-tight">
                {Math.round(h.temperatureC)}°
              </div>
              <div className="text-[10px] font-bold" style={{ color: pColor }}>
                {precipPct}
              </div>
              <div className="text-[9px] text-foreground-muted font-medium leading-none">
                {Math.round(h.windSpeedKmh / 3.6)} m/s
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
