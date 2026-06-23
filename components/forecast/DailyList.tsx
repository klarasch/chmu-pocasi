import { WeatherIcon } from "@/components/icons/WeatherIcon";
import type { DailyTextForecast } from "@/lib/chmi/text";
import { temperatureRangeGradient } from "@/lib/condition-gradients";
import { conditionFor } from "@/lib/weather-codes";

type DailyPoint = {
  date: string;
  highC: number;
  lowC: number;
  precipMm: number;
};

const DAY_LABEL = (iso: string) =>
  new Date(iso).toLocaleDateString("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    timeZone: "Europe/Prague",
  });

export function DailyList({
  numericDays,
  qualitativeDays,
}: {
  numericDays: DailyPoint[];
  qualitativeDays: DailyTextForecast[];
}) {
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

  const allLows = numericDays.map((d) => d.lowC);
  const allHighs = numericDays.map((d) => d.highC);
  const rangeMin = Math.min(...allLows);
  const rangeMax = Math.max(...allHighs);
  const span = Math.max(1, rangeMax - rangeMin);

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface">
      <div className="px-4 pt-3.5 pb-1 text-xs font-medium uppercase tracking-wide text-white/60">
        7denní výhled
      </div>
      {numericDays.map((d, i) => {
        const condition = conditionFor(d.precipMm, 35);
        const leftPct = ((d.lowC - rangeMin) / span) * 100;
        const widthPct = ((d.highC - d.lowC) / span) * 100;
        return (
          <div
            key={d.date}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i > 0 ? "border-t border-border-subtle" : ""}`}
          >
            <span className="w-16 shrink-0 text-white/70">
              {DAY_LABEL(d.date)}
            </span>
            <WeatherIcon
              condition={condition}
              size={18}
              className="shrink-0 text-white/60"
            />
            {d.precipMm > 0.1 ? (
              <span className="w-10 shrink-0 text-right text-[11px] text-accent/80 tabular-nums">
                {d.precipMm.toFixed(0)}mm
              </span>
            ) : (
              <span className="w-10 shrink-0" />
            )}
            <span className="w-7 shrink-0 text-right text-white/60 tabular-nums">
              {Math.round(d.lowC)}°
            </span>
            <div className="relative h-1 flex-1 rounded-full bg-white/8">
              <div
                className="absolute h-1 rounded-full"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  background: temperatureRangeGradient(
                    (d.lowC - rangeMin) / span,
                    (d.highC - rangeMin) / span,
                  ),
                }}
              />
            </div>
            <span className="w-7 shrink-0 font-medium tabular-nums">
              {Math.round(d.highC)}°
            </span>
          </div>
        );
      })}
      {tail.map((d, i) => (
        <div
          key={d.headline}
          className={`flex flex-col gap-1 px-4 py-3 text-sm ${
            i > 0 || numericDays.length > 0
              ? "border-t border-border-subtle"
              : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-white/70">{DAY_LABEL(d.startTime)}</span>
            <span className="text-[11px] uppercase tracking-wide text-white/55">
              výhled
            </span>
          </div>
          <span className="text-white/55">
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
  );
}
