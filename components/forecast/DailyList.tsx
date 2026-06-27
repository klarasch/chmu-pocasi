"use client";

import { WeatherIcon } from "@/components/icons/WeatherIcon";
import type { DailyTextForecast } from "@/lib/chmi/text";
import { conditionFor } from "@/lib/weather-codes";

type DailyPoint = {
  date: string;
  highC: number;
  lowC: number;
  precipMm: number;
  maxWindSpeedKmh?: number;
};

const getDayLabel = (iso: string) => {
  const date = new Date(iso);
  return date
    .toLocaleDateString("cs-CZ", {
      weekday: "short",
      timeZone: "Europe/Prague",
    })
    .toUpperCase();
};

export function DailyList({
  numericDays,
  qualitativeDays,
}: {
  numericDays: DailyPoint[];
  qualitativeDays: DailyTextForecast[];
}) {
  // Let's filter qualitative days that aren't in numeric days, just like the old component did
  const numericDates = new Set(numericDays.map((d) => d.date));
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const tail = qualitativeDays.filter((d) => {
    const date = formatter.format(new Date(d.startTime));
    return !numericDates.has(date);
  });

  // Calculate temp bounds for range bar rendering
  const allLows = numericDays.map((d) => d.lowC);
  const allHighs = numericDays.map((d) => d.highC);
  const rangeMin = allLows.length > 0 ? Math.min(...allLows) : 0;
  const rangeMax = allHighs.length > 0 ? Math.max(...allHighs) : 30;
  const span = Math.max(1, rangeMax - rangeMin);

  // We show 5 days in the main dashboard index
  const displayedDays = numericDays.slice(0, 5);

  return (
    <div className="bg-[#f4f3f0] text-[#16161a] pb-[52px]">
      {/* Header */}
      <div className="text-[9px] tracking-[0.16em] text-[#6b6b70] font-bold mb-[2px] px-0 border-t border-[#cfcdc6] pt-3">
        DALŠÍ DNY
      </div>

      {/* Rows */}
      <div className="px-0">
        {displayedDays.map((d, i) => {
          // Check for snow condition
          const condition = conditionFor(d.precipMm, 35, d.lowC);

          // Estimate probability based on precip amount
          let precipVal = 0;
          if (d.precipMm > 0.1) {
            precipVal = Math.min(
              100,
              Math.max(10, Math.round(d.precipMm * 15 + 20)),
            );
          }
          const precipText = `${precipVal}%`;
          const pColor = precipVal === 0 ? "#bdbbb4" : "oklch(0.55 0.17 256)";

          // Calculate bar left & right percentage
          const leftPct = ((d.lowC - rangeMin) / span) * 100;
          const widthPct = ((d.highC - d.lowC) / span) * 100;
          const barL = `${leftPct.toFixed(1)}%`;
          const barR = `${(100 - (leftPct + widthPct)).toFixed(1)}%`;

          return (
            <div
              key={d.date}
              className={`flex items-center py-[6px] ${i === 0 ? "" : "border-t border-[#cfcdc6]"}`}
            >
              {/* Day label */}
              <span className="w-[40px] shrink-0 text-[13px] font-semibold tracking-[0.04em]">
                {getDayLabel(d.date)}
              </span>

              {/* Weather icon */}
              <WeatherIcon condition={condition} size={26} />

              {/* Precip% */}
              <span
                className="w-[42px] shrink-0 text-center text-[11px] font-bold"
                style={{ color: pColor }}
              >
                {precipText}
              </span>

              {/* Spacer */}
              <span className="flex-1" />

              {/* Wind Speed */}
              {d.maxWindSpeedKmh !== undefined && (
                <span className="w-[50px] shrink-0 text-right text-[11px] text-[#6b6b70] font-medium tabular-nums mr-3">
                  {Math.round(d.maxWindSpeedKmh / 3.6)} m/s
                </span>
              )}

              {/* Temp range bar */}
              <span className="w-[54px] h-[3px] bg-[#e4e2db] rounded-[2px] relative mr-[12px] overflow-hidden shrink-0">
                <span
                  className="absolute top-0 bottom-0 bg-[#16161a] rounded-[2px]"
                  style={{ left: barL, right: barR }}
                />
              </span>

              {/* Low Temp */}
              <span className="text-[13px] text-[#9a9a9f] w-[24px] text-right shrink-0">
                {Math.round(d.lowC)}
              </span>

              {/* High Temp */}
              <span className="text-[13px] font-semibold text-[#16161a] w-[24px] text-right shrink-0 ml-[4px]">
                {Math.round(d.highC)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tail Qualitative Days - for backup/additional context if desired */}
      {tail.length > 0 && (
        <div className="mt-4 px-0">
          <div className="text-[9px] tracking-[0.16em] text-[#6b6b70] font-bold mb-[6px] border-t border-[#cfcdc6] pt-3">
            VÝHLED
          </div>
          <div className="flex flex-col gap-3">
            {tail.slice(0, 3).map((d) => (
              <div
                key={d.headline}
                className="flex flex-col gap-1 border-t border-[#cfcdc6]/40 pt-2 first:border-0 first:pt-0"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#16161a]">
                    {getDayLabel(d.startTime)}
                  </span>
                </div>
                <span className="text-[13px] leading-[1.4] text-[#16161a] font-normal">
                  {[
                    d.sections.find((s) => s.name === "textIntro")?.text,
                    d.sections.find((s) => s.name === "textWeather")?.text,
                  ]
                    .filter(Boolean)
                    .join(" ") || d.headline}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
