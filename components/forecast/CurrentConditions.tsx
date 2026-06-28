"use client";

import {
  CONDITION_LABEL,
  type Condition,
  conditionFor,
  isNightHour,
} from "@/lib/weather-codes";

// Shared decorative fills for the hero illustration (graphic shapes, not text).
// Text / sky / border colors are CSS tokens (see --hero-* in globals.css) so
// the day↔night theme and its contrast live in one place.
const FILL = {
  sun: "#f2c12e",
  lightning: "#f2c12e",
  moon: "#eef0f5",
  moonCrater: "#c3c6d4",
  moonGlow: "rgba(238, 240, 245, 0.5)",
  rain: "var(--accent)",
  snow: "#9cc0ef",
} as const;

// Day color fields + clouds (warm stone) and night clouds (cool slate).
// One named source per tone keeps the per-state palettes consistent.
const DAY = {
  clearField: FILL.sun,
  partlyField: FILL.sun,
  partlyCloud: "#fbfaf7",
  cloudyField: "#a8a59c",
  cloudyCloud: "#d0cdc6",
  rainField: "#7c7a72",
  rainCloud: "#8c8a82",
  stormField: "#3c3a34",
  stormCloud: "#5c5a52",
  snowField: "#c8c6c0",
  snowCloud: "#e8e6e0",
  fogField: "#c0bdb4",
} as const;

const NIGHT_CLOUD = {
  partly: "#3c4254",
  cloudy: "#4c5266",
  rain: "#4c5266",
  storm: "#444a5c",
  snow: "#525872",
} as const;

type Graphic = {
  // Color of the giant day field disc (unused at night, where the sky is dark).
  field: string;
  cloud: string;
  showCloud: boolean;
  showRain: boolean;
  showLightning: boolean;
  showSnow: boolean;
  showFog: boolean;
};

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
  const condition =
    conditionOverride ?? conditionFor(precipMm, cloudCoverPct, temperatureC);
  const isNight = isNightOverride ?? isNightHour(time);

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

  // Per-condition illustration config. At night the giant day field is replaced
  // by the dark sky token + a moon, so `field` only matters during the day.
  const getConfig = (): Graphic => {
    const off = {
      showCloud: false,
      showRain: false,
      showLightning: false,
      showSnow: false,
      showFog: false,
    };
    if (isNight) {
      const base: Graphic = { field: "", cloud: "", ...off };
      switch (condition) {
        case "clear":
          return base;
        case "partly-cloudy":
          return { ...base, cloud: NIGHT_CLOUD.partly, showCloud: true };
        case "cloudy":
          return { ...base, cloud: NIGHT_CLOUD.cloudy, showCloud: true };
        case "rain":
          return {
            ...base,
            cloud: NIGHT_CLOUD.rain,
            showCloud: true,
            showRain: true,
          };
        case "storm":
          return {
            ...base,
            cloud: NIGHT_CLOUD.storm,
            showCloud: true,
            showRain: true,
            showLightning: true,
          };
        case "snow":
          return {
            ...base,
            cloud: NIGHT_CLOUD.snow,
            showCloud: true,
            showSnow: true,
          };
        case "fog":
          return { ...base, showFog: true };
        default:
          return base;
      }
    }

    switch (condition) {
      case "clear":
        return { field: DAY.clearField, cloud: "", ...off };
      case "partly-cloudy":
        return {
          field: DAY.partlyField,
          cloud: DAY.partlyCloud,
          ...off,
          showCloud: true,
        };
      case "cloudy":
        return {
          field: DAY.cloudyField,
          cloud: DAY.cloudyCloud,
          ...off,
          showCloud: true,
        };
      case "rain":
        return {
          field: DAY.rainField,
          cloud: DAY.rainCloud,
          ...off,
          showCloud: true,
          showRain: true,
        };
      case "storm":
        return {
          field: DAY.stormField,
          cloud: DAY.stormCloud,
          ...off,
          showCloud: true,
          showRain: true,
          showLightning: true,
        };
      case "snow":
        return {
          field: DAY.snowField,
          cloud: DAY.snowCloud,
          ...off,
          showCloud: true,
          showSnow: true,
        };
      case "fog":
        return { field: DAY.fogField, cloud: "", ...off, showFog: true };
      default:
        return { field: DAY.clearField, cloud: "", ...off };
    }
  };

  const {
    field,
    cloud,
    showCloud,
    showRain,
    showLightning,
    showSnow,
    showFog,
  } = getConfig();

  // Day shows the giant abstract sun field; night shows a contained moon
  // (only when the sky is actually visible, i.e. clear or partly cloudy).
  const showSun = !isNight;
  const showMoon =
    isNight && (condition === "clear" || condition === "partly-cloudy");

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
        style={{ "--moon-glow": FILL.moonGlow } as React.CSSProperties}
      >
        {/* Day: giant abstract sun field with a bold lagging drift trail */}
        {showSun && (
          <>
            <div
              className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full opacity-[0.12] animate-[fpFloatA_9s_ease-in-out_0.9s_infinite]"
              style={{ backgroundColor: field }}
            />
            <div
              className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full opacity-[0.22] animate-[fpFloatA_9s_ease-in-out_0.6s_infinite]"
              style={{ backgroundColor: field }}
            />
            <div
              className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full opacity-[0.34] animate-[fpFloatA_9s_ease-in-out_0.3s_infinite]"
              style={{ backgroundColor: field }}
            />
            <div
              className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full animate-[fpFloatA_9s_ease-in-out_infinite]"
              style={{ backgroundColor: field }}
            />
          </>
        )}

        {/* Night: a real, visible moon — silver disc, soft pulsing halo, and a
            bold trail of lagging echoes that smear as it drifts. */}
        {showMoon && (
          <div className="absolute top-[20px] right-[38px] w-[122px] h-[122px]">
            <div
              className="absolute inset-0 rounded-full opacity-[0.14] animate-[moonDrift_8s_ease-in-out_1.05s_infinite]"
              style={{ backgroundColor: FILL.moon }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-[0.26] animate-[moonDrift_8s_ease-in-out_0.7s_infinite]"
              style={{ backgroundColor: FILL.moon }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-[0.45] animate-[moonDrift_8s_ease-in-out_0.35s_infinite]"
              style={{ backgroundColor: FILL.moon }}
            />
            <div
              className="absolute inset-0 rounded-full animate-[moonDrift_8s_ease-in-out_infinite,moonGlow_5s_ease-in-out_infinite]"
              style={{ backgroundColor: FILL.moon }}
            >
              <div
                className="absolute left-[22%] top-[26%] w-[18px] h-[18px] rounded-full opacity-60"
                style={{ backgroundColor: FILL.moonCrater }}
              />
              <div
                className="absolute right-[20%] top-[20%] w-[11px] h-[11px] rounded-full opacity-50"
                style={{ backgroundColor: FILL.moonCrater }}
              />
              <div
                className="absolute left-[44%] bottom-[22%] w-[13px] h-[13px] rounded-full opacity-45"
                style={{ backgroundColor: FILL.moonCrater }}
              />
            </div>
          </div>
        )}

        {/* Cloud + Echo */}
        {showCloud && (
          <>
            <div className="absolute top-[64px] right-[6px] w-[216px] h-[80px] opacity-[0.28] animate-[fpFloatB_11s_ease-in-out_0.5s_infinite]">
              <div
                className="absolute left-0 bottom-0 w-[216px] h-[48px] rounded-[24px]"
                style={{ backgroundColor: cloud }}
              />
              <div
                className="absolute right-[30px] top-0 w-[80px] h-[80px] rounded-full"
                style={{ backgroundColor: cloud }}
              />
            </div>
            <div className="absolute top-[64px] right-[6px] w-[216px] h-[80px] animate-[fpFloatB_11s_ease-in-out_infinite]">
              <div
                className="absolute left-0 bottom-0 w-[216px] h-[48px] rounded-[24px]"
                style={{ backgroundColor: cloud }}
              />
              <div
                className="absolute left-[36px] top-[6px] w-[62px] h-[62px] rounded-full"
                style={{ backgroundColor: cloud }}
              />
              <div
                className="absolute right-[30px] top-0 w-[80px] h-[80px] rounded-full"
                style={{ backgroundColor: cloud }}
              />
            </div>
          </>
        )}

        {/* Rain Drops */}
        {showRain && (
          <div className="absolute right-[55px] top-[116px] flex gap-[11px]">
            <div
              className="w-[3px] h-[14px] rounded-[2px] animate-[fpRain_1.0s_linear_infinite]"
              style={{ backgroundColor: FILL.rain }}
            />
            <div
              className="w-[3px] h-[14px] rounded-[2px] animate-[fpRain_1.0s_linear_0.3s_infinite]"
              style={{ backgroundColor: FILL.rain }}
            />
            <div
              className="w-[3px] h-[14px] rounded-[2px] animate-[fpRain_1.0s_linear_0.6s_infinite]"
              style={{ backgroundColor: FILL.rain }}
            />
            <div
              className="w-[3px] h-[14px] rounded-[2px] animate-[fpRain_1.0s_linear_0.15s_infinite]"
              style={{ backgroundColor: FILL.rain }}
            />
            <div
              className="w-[3px] h-[14px] rounded-[2px] animate-[fpRain_1.0s_linear_0.45s_infinite]"
              style={{ backgroundColor: FILL.rain }}
            />
          </div>
        )}

        {/* Lightning Bolt */}
        {showLightning && (
          <div
            className="absolute right-[112px] top-[118px] w-[22px] h-[30px] animate-[fpFlash_2.2s_linear_infinite]"
            style={{
              backgroundColor: FILL.lightning,
              clipPath:
                "polygon(62% 0,18% 52%,50% 52%,30% 100%,88% 38%,54% 38%)",
            }}
          />
        )}

        {/* Snow Dots */}
        {showSnow && (
          <div className="absolute right-[60px] top-[110px] flex gap-[13px]">
            <div
              className="w-2 h-2 rounded-full animate-[fpSnow_1.5s_linear_infinite]"
              style={{ backgroundColor: FILL.snow }}
            />
            <div
              className="w-2 h-2 rounded-full animate-[fpSnow_1.5s_linear_0.5s_infinite]"
              style={{ backgroundColor: FILL.snow }}
            />
            <div
              className="w-2 h-2 rounded-full animate-[fpSnow_1.5s_linear_1s_infinite]"
              style={{ backgroundColor: FILL.snow }}
            />
          </div>
        )}

        {/* Fog Bars — tied to the ink token so they read on both day and night */}
        {showFog && (
          <div className="absolute right-[10px] top-[76px] w-[180px] flex flex-col gap-[9px] animate-[fpFloatB_8s_ease-in-out_infinite] text-[var(--hero-ink)]">
            <div className="h-[5px] rounded-[3px] bg-current opacity-[0.45]" />
            <div className="h-[5px] rounded-[3px] bg-current opacity-[0.3] ml-[14px]" />
            <div className="h-[5px] rounded-[3px] bg-current opacity-[0.45] ml-[6px]" />
            <div className="h-[5px] rounded-[3px] bg-current opacity-[0.24] ml-[20px]" />
          </div>
        )}

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
