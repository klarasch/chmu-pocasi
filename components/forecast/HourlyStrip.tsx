import { WeatherIcon } from "@/components/icons/WeatherIcon";
import { conditionFor, isNightHour } from "@/lib/weather-codes";

type HourlyPoint = {
  time: string;
  temperatureC: number;
  precipMm: number;
  cloudCoverPct: number;
};

export function HourlyStrip({ hourly }: { hourly: HourlyPoint[] }) {
  return (
    <div
      data-horizontal-scroll
      className="scrollbar-none flex gap-5 overflow-x-auto px-4 py-4"
    >
      {hourly.map((h, i) => {
        const condition = conditionFor(h.precipMm, h.cloudCoverPct);
        const hour = new Date(h.time).toLocaleTimeString("cs-CZ", {
          hour: "2-digit",
        });
        return (
          <div
            key={h.time}
            className="flex w-11 shrink-0 flex-col items-center gap-2 text-sm"
          >
            <span className="text-xs font-medium text-white/60">
              {i === 0 ? "Nyní" : hour}
            </span>
            <WeatherIcon
              condition={condition}
              isNight={isNightHour(h.time)}
              size={20}
              className="text-white/80"
            />
            <span className="font-medium tabular-nums">
              {Math.round(h.temperatureC)}°
            </span>
            <span className="h-3 text-[11px] tabular-nums text-accent/80">
              {h.precipMm > 0.1 ? `${h.precipMm.toFixed(1)}mm` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
