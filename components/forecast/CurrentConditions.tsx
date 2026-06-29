"use client";

import { useForecast } from "@/components/forecast/ForecastView";
import { HeroIllustration } from "@/components/forecast/HeroIllustration";
import {
  CONDITION_LABEL,
  type Condition,
  conditionFor,
  isNightHour,
} from "@/lib/weather-codes";

export function CurrentConditions({
  time,
  temperatureC,
  precipMm,
  cloudCoverPct,
  windSpeedKmh,
  windDirDeg,
  highC,
  lowC,
  locationLabel = "Praha",
  conditionOverride,
  isNightOverride,
}: {
  time: string;
  temperatureC: number;
  precipMm: number;
  cloudCoverPct: number;
  windSpeedKmh: number;
  windDirDeg?: number;
  highC?: number;
  lowC?: number;
  locationLabel?: string;
  // Debug-mode overrides so the /debug screen can force any weather state
  // regardless of the (fake) numeric inputs.
  conditionOverride?: Condition;
  isNightOverride?: boolean;
}) {
  const { lat, lon } = useForecast();
  const condition =
    conditionOverride ?? conditionFor(precipMm, cloudCoverPct, temperatureC);
  const isNight = isNightOverride ?? isNightHour(time, lat, lon);

  // Format the date label for the masthead
  const dateLabel = new Date()
    .toLocaleDateString("cs-CZ", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();

  // Convert wind degrees to Czech compass direction
  const getWindDirection = (deg?: number): string => {
    if (deg === undefined) return "";
    const val = Math.floor(deg / 22.5 + 0.5);
    const directions = [
      "S",
      "SSV",
      "SV",
      "VSV",
      "V",
      "VJV",
      "JV",
      "JJV",
      "J",
      "JJZ",
      "JZ",
      "ZJZ",
      "Z",
      "SZZ",
      "SZ",
      "SSZ",
    ];
    return directions[val % 16];
  };

  const windDirection = getWindDirection(windDirDeg);
  const windSpeedMs = Math.round(windSpeedKmh / 3.6);

  // Estimate relative humidity since it is not parsed from GRIB2 directly
  const calculatedHumidity = Math.min(
    100,
    Math.max(
      30,
      Math.round(
        40 +
          cloudCoverPct * 0.4 +
          (precipMm > 0 ? 30 : 0) -
          (temperatureC > 20 ? (temperatureC - 20) * 1.5 : 0),
      ),
    ),
  );

  // Srážky/vítr/vlhkost never go dark at night — only the temperature +
  // condition graphic above them does (see data-hero-night on that element).
  const precipColor =
    precipMm > 0 ? "var(--accent)" : "var(--foreground-muted)";
  const hiLoText =
    highC !== undefined && lowC !== undefined
      ? `H${Math.round(highC)} · L${Math.round(lowC)}`
      : "";

  return (
    <div className="flex flex-col select-none">
      {/* Masthead — always day-themed, independent of the hero's night state */}
      <div className="px-[26px] pt-[max(1.25rem,calc(env(safe-area-inset-top)+6px))] pb-[9px] flex justify-between items-center border-b-[1.5px] border-foreground text-foreground z-10">
        <span className="text-xs font-bold tracking-[0.18em] flex items-center gap-[7px]">
          <span className="w-[7px] h-[7px] rounded-full bg-foreground" />
          {locationLabel.toUpperCase()}
        </span>
        <span className="text-[11px] tracking-[0.06em] text-foreground-muted">
          {dateLabel}
        </span>
      </div>

      {/* Hero graphic area — the only part that swaps to the night palette */}
      <div
        className="relative h-[190px] shrink-0 overflow-hidden bg-[var(--hero-sky)]"
        data-hero-night={isNight ? "true" : undefined}
      >
        <HeroIllustration
          condition={condition}
          isNight={isNight}
          windSpeedKmh={windSpeedKmh}
        />

        {/* Temp + Desc Overlay */}
        <div className="absolute left-[26px] bottom-[14px] z-10 text-[var(--hero-ink)]">
          <div className="text-[116px] font-semibold leading-[0.7] tracking-[-0.05em]">
            {Math.round(temperatureC)}
            <span className="text-[36px] align-top font-normal">°</span>
          </div>
          <div className="flex items-baseline gap-3 mt-[16px]">
            <span className="text-[18px] font-semibold">
              {CONDITION_LABEL[condition]}
            </span>
            {hiLoText && (
              <span className="text-[13px] opacity-65 font-normal">
                {hiLoText}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conditions Strip — always day-themed, independent of the hero's night state */}
      <div className="flex border-t-[1.5px] border-t-foreground border-b border-b-border-subtle bg-background text-foreground">
        <div className="flex-1 py-[11px] pl-[26px]">
          <div className="text-[9px] tracking-[0.13em] font-bold text-foreground-muted">
            SRÁŽKY
          </div>
          <div
            className="text-[19px] font-semibold mt-[3px]"
            style={{ color: precipColor }}
          >
            {precipMm > 0 ? Math.round(precipMm * 10) : 0}
            <span className="text-[12px] font-medium text-foreground-muted">
              %
            </span>
          </div>
        </div>
        <div className="flex-1 py-[11px] pl-[18px] border-l border-l-border-subtle">
          <div className="text-[9px] tracking-[0.13em] font-bold text-foreground-muted">
            VÍTR
          </div>
          <div className="text-[19px] font-semibold mt-[3px] truncate pr-1">
            {windSpeedMs}
            <span className="text-[12px] font-medium ml-1 text-foreground-muted">
              m/s {windDirection}
            </span>
          </div>
        </div>
        <div className="flex-1 py-[11px] pl-[18px] border-l border-l-border-subtle">
          <div className="text-[9px] tracking-[0.13em] font-bold text-foreground-muted">
            VLHKOST
          </div>
          <div className="text-[19px] font-semibold mt-[3px]">
            {calculatedHumidity}
            <span className="text-[12px] font-medium text-foreground-muted">
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
