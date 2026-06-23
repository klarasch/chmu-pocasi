import { WeatherIcon } from "@/components/icons/WeatherIcon";
import {
  CONDITION_LABEL,
  conditionFor,
  isNightHour,
} from "@/lib/weather-codes";

export function CurrentConditions({
  time,
  temperatureC,
  precipMm,
  cloudCoverPct,
  windSpeedKmh,
  highC,
  lowC,
  locationLabel = "Praha",
}: {
  time: string;
  temperatureC: number;
  precipMm: number;
  cloudCoverPct: number;
  windSpeedKmh: number;
  highC?: number;
  lowC?: number;
  locationLabel?: string;
}) {
  const condition = conditionFor(precipMm, cloudCoverPct);
  const isNight = isNightHour(time);

  return (
    <div className="[text-shadow:0_1px_10px_rgba(0,0,0,0.35)] flex flex-col items-center gap-3 px-4 pb-10 pt-[max(3.5rem,calc(env(safe-area-inset-top)+1.5rem))]">
      <div className="text-sm font-medium text-white/70">{locationLabel}</div>
      <div className="flex items-center gap-3">
        <WeatherIcon
          condition={condition}
          isNight={isNight}
          size={40}
          className="text-white/90"
        />
        <div className="text-[5.5rem] font-light leading-none tracking-tight tabular-nums">
          {Math.round(temperatureC)}°
        </div>
      </div>
      <div className="text-[15px] text-white/80">
        {CONDITION_LABEL[condition]}
      </div>
      {highC !== undefined && lowC !== undefined && (
        <div className="text-sm text-white/80">
          H:{Math.round(highC)}° L:{Math.round(lowC)}° · Vítr{" "}
          {Math.round(windSpeedKmh)} km/h
        </div>
      )}
    </div>
  );
}
