"use client";

import { WeatherIcon } from "@/components/icons/WeatherIcon";
import { conditionFor, isNightHour } from "@/lib/weather-codes";

type HourlyPoint = {
  time: string;
  temperatureC: number;
  precipMm: number;
  cloudCoverPct: number;
};

export function HourlyStrip({ hourly }: { hourly: HourlyPoint[] }) {
  // Show exactly the next 6 hours as specified in the prototype
  const nextSix = hourly.slice(0, 6);

  return (
    <div className="py-[13px] bg-[#f4f3f0] text-[#16161a]">
      {/* Header */}
      <div className="flex justify-between items-baseline px-[26px] mb-[9px]">
        <span className="text-[9px] tracking-[0.16em] text-[#6b6b70] font-bold">
          HOURLY
        </span>
        <span className="text-[9px] tracking-[0.13em] text-[#9a9a9f] font-semibold">
          PRECIP %
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-template-cols grid-cols-6 px-[24px]">
        {nextSix.map((h, i) => {
          const condition = conditionFor(h.precipMm, h.cloudCoverPct, h.temperatureC);
          const isNight = isNightHour(h.time);
          const timeLabel = new Date(h.time).toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
          });

          // Show "Nyní" for the first hour if it's within the current hour,
          // or just display the hour number.
          const isCurrent = i === 0;

          // Determine precipitation probability percentage
          // For ALADIN we have precipMm (mm/hour). We can map this to a percentage representation:
          // 0mm -> 0%, 0.1-0.5mm -> 10%-40%, >0.5mm -> 50%-100%
          let precipPctVal = 0;
          if (h.precipMm > 0) {
            precipPctVal = Math.min(100, Math.max(10, Math.round(h.precipMm * 80)));
            if (h.precipMm > 1.0) precipPctVal = 100;
          }
          const precipPct = `${precipPctVal}%`;
          const pColor = precipPctVal === 0 ? "#bdbbb4" : "oklch(0.55 0.17 256)";

          return (
            <div
              key={h.time}
              className="border-l border-[#cfcdc6] px-[2px] flex flex-col items-center gap-[6px]"
            >
              <div className="text-[11px] text-[#6b6b70] font-normal">
                {isCurrent ? "Nyní" : timeLabel}
              </div>
              <WeatherIcon
                condition={condition}
                isNight={isNight}
                size={30}
              />
              <div className="text-[16px] font-semibold tracking-tight">
                {Math.round(h.temperatureC)}°
              </div>
              <div
                className="text-[10px] font-bold"
                style={{ color: pColor }}
              >
                {precipPct}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
