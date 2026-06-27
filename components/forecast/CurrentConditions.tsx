"use client";

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
  windDirDeg,
  highC,
  lowC,
  locationLabel = "Praha",
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
}) {
  const condition = conditionFor(precipMm, cloudCoverPct, temperatureC);
  const isNight = isNightHour(time);

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

  // Configuration for the giant Bauhaus graphic
  const dark = "#16161a";

  // Map Condition to config values
  const getConfig = (): {
    heroColor: string;
    cloudColor: string;
    tempColor: string;
    showCloud: boolean;
    showRain: boolean;
    showLightning: boolean;
    showSnow: boolean;
    showFog: boolean;
    isNightState: boolean;
  } => {
    if (isNight) {
      if (condition === "partly-cloudy") {
        return {
          heroColor: "#1e2d4a",
          cloudColor: "#2e3e58",
          tempColor: dark,
          showCloud: true,
          showRain: false,
          showLightning: false,
          showSnow: false,
          showFog: false,
          isNightState: true,
        };
      }
      if (condition === "clear") {
        return {
          heroColor: "#1e2d4a",
          cloudColor: "",
          tempColor: dark,
          showCloud: false,
          showRain: false,
          showLightning: false,
          showSnow: false,
          showFog: false,
          isNightState: true,
        };
      }
    }

    switch (condition) {
      case "clear":
        return {
          heroColor: "#f2c12e",
          cloudColor: "",
          tempColor: dark,
          showCloud: false,
          showRain: false,
          showLightning: false,
          showSnow: false,
          showFog: false,
          isNightState: false,
        };
      case "partly-cloudy":
        return {
          heroColor: "#f2c12e",
          cloudColor: "#fbfaf7",
          tempColor: dark,
          showCloud: true,
          showRain: false,
          showLightning: false,
          showSnow: false,
          showFog: false,
          isNightState: false,
        };
      case "cloudy":
        return {
          heroColor: "#a8a59c",
          cloudColor: "#d0cdc6",
          tempColor: dark,
          showCloud: true,
          showRain: false,
          showLightning: false,
          showSnow: false,
          showFog: false,
          isNightState: false,
        };
      case "rain":
        return {
          heroColor: "#7c7a72",
          cloudColor: "#8c8a82",
          tempColor: dark,
          showCloud: true,
          showRain: true,
          showLightning: false,
          showSnow: false,
          showFog: false,
          isNightState: isNight,
        };
      case "storm":
        return {
          heroColor: "#3c3a34",
          cloudColor: "#5c5a52",
          tempColor: dark,
          showCloud: true,
          showRain: true,
          showLightning: true,
          showSnow: false,
          showFog: false,
          isNightState: isNight,
        };
      case "snow":
        return {
          heroColor: "#c8c6c0",
          cloudColor: "#e8e6e0",
          tempColor: dark,
          showCloud: true,
          showRain: false,
          showLightning: false,
          showSnow: true,
          showFog: false,
          isNightState: isNight,
        };
      case "fog":
        return {
          heroColor: "#c0bdb4",
          cloudColor: "",
          tempColor: dark,
          showCloud: false,
          showRain: false,
          showLightning: false,
          showSnow: false,
          showFog: true,
          isNightState: isNight,
        };
      default:
        return {
          heroColor: "#f2c12e",
          cloudColor: "",
          tempColor: dark,
          showCloud: false,
          showRain: false,
          showLightning: false,
          showSnow: false,
          showFog: false,
          isNightState: false,
        };
    }
  };

  const {
    heroColor,
    cloudColor,
    tempColor,
    showCloud,
    showRain,
    showLightning,
    showSnow,
    showFog,
    isNightState,
  } = getConfig();

  const condPrecipColor = precipMm === 0 ? "#bdbbb4" : "oklch(0.55 0.17 256)";
  const hiLoText =
    highC !== undefined && lowC !== undefined
      ? `H${Math.round(highC)} · L${Math.round(lowC)}`
      : "";

  return (
    <div className="flex flex-col select-none">
      {/* Masthead */}
      <div className="px-[26px] pt-[max(3rem,calc(env(safe-area-inset-top)+8px))] pb-[9px] flex justify-between items-center border-b-[1.5px] border-[#16161a] z-10 text-[#16161a]">
        <span className="text-xs font-bold tracking-[0.18em] flex items-center gap-[7px]">
          <span className="w-[7px] h-[7px] rounded-full bg-[#16161a]" />
          {locationLabel.toUpperCase()}
        </span>
        <span className="text-[11px] tracking-[0.06em] text-[#6b6b70]">
          {dateLabel}
        </span>
      </div>

      {/* Hero graphic area */}
      <div className="relative h-[190px] shrink-0 overflow-hidden bg-[#f4f3f0]">
        {/* Drift Echoes */}
        <div
          className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full opacity-[0.08] animate-[fpFloatA_9s_ease-in-out_0.9s_infinite]"
          style={{ backgroundColor: heroColor }}
        />
        <div
          className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full opacity-[0.16] animate-[fpFloatA_9s_ease-in-out_0.6s_infinite]"
          style={{ backgroundColor: heroColor }}
        />
        <div
          className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full opacity-[0.27] animate-[fpFloatA_9s_ease-in-out_0.3s_infinite]"
          style={{ backgroundColor: heroColor }}
        />
        {/* Main Circle */}
        <div
          className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full animate-[fpFloatA_9s_ease-in-out_infinite]"
          style={{ backgroundColor: heroColor }}
        />

        {/* Night Crescent Mask */}
        {isNightState && (
          <div className="absolute top-[-120px] right-[-120px] w-[460px] h-[460px] rounded-full bg-[#f4f3f0] translate-x-[-90px] translate-y-[-60px] animate-[fpFloatA_9s_ease-in-out_infinite] pointer-events-none" />
        )}

        {/* Cloud + Echo */}
        {showCloud && (
          <>
            <div className="absolute top-[64px] right-[6px] w-[216px] h-[80px] opacity-[0.22] animate-[fpFloatB_11s_ease-in-out_0.5s_infinite]">
              <div className="absolute left-0 bottom-0 w-[216px] h-[48px] rounded-[24px] bg-[#fbfaf7]" />
              <div className="absolute right-[30px] top-0 w-[80px] h-[80px] rounded-full bg-[#fbfaf7]" />
            </div>
            <div className="absolute top-[64px] right-[6px] w-[216px] h-[80px] animate-[fpFloatB_11s_ease-in-out_infinite]">
              <div
                className="absolute left-0 bottom-0 w-[216px] h-[48px] rounded-[24px]"
                style={{ backgroundColor: cloudColor }}
              />
              <div
                className="absolute left-[36px] top-[6px] w-[62px] h-[62px] rounded-full"
                style={{ backgroundColor: cloudColor }}
              />
              <div
                className="absolute right-[30px] top-0 w-[80px] h-[80px] rounded-full"
                style={{ backgroundColor: cloudColor }}
              />
            </div>
          </>
        )}

        {/* Rain Drops */}
        {showRain && (
          <div className="absolute right-[55px] top-[116px] flex gap-[11px]">
            <div className="w-[3px] h-[14px] rounded-[2px] bg-[#2b5fd9] animate-[fpRain_1.0s_linear_infinite]" />
            <div className="w-[3px] h-[14px] rounded-[2px] bg-[#2b5fd9] animate-[fpRain_1.0s_linear_0.3s_infinite]" />
            <div className="w-[3px] h-[14px] rounded-[2px] bg-[#2b5fd9] animate-[fpRain_1.0s_linear_0.6s_infinite]" />
            <div className="w-[3px] h-[14px] rounded-[2px] bg-[#2b5fd9] animate-[fpRain_1.0s_linear_0.15s_infinite]" />
            <div className="w-[3px] h-[14px] rounded-[2px] bg-[#2b5fd9] animate-[fpRain_1.0s_linear_0.45s_infinite]" />
          </div>
        )}

        {/* Lightning Bolt */}
        {showLightning && (
          <div
            className="absolute right-[112px] top-[118px] w-[22px] h-[30px] bg-[#f2c12e] animate-[fpFlash_2.2s_linear_infinite]"
            style={{
              clipPath:
                "polygon(62% 0,18% 52%,50% 52%,30% 100%,88% 38%,54% 38%)",
            }}
          />
        )}

        {/* Snow Dots */}
        {showSnow && (
          <div className="absolute right-[60px] top-[110px] flex gap-[13px]">
            <div className="w-2 h-2 rounded-full bg-[#9cc0ef] animate-[fpSnow_1.5s_linear_infinite]" />
            <div className="w-2 h-2 rounded-full bg-[#9cc0ef] animate-[fpSnow_1.5s_linear_0.5s_infinite]" />
            <div className="w-2 h-2 rounded-full bg-[#9cc0ef] animate-[fpSnow_1.5s_linear_1s_infinite]" />
          </div>
        )}

        {/* Fog Bars */}
        {showFog && (
          <div className="absolute right-[10px] top-[76px] w-[180px] flex flex-col gap-[9px] animate-[fpFloatB_8s_ease-in-out_infinite]">
            <div className="h-[5px] rounded-[3px] bg-[rgba(120,118,112,0.5)]" />
            <div className="h-[5px] rounded-[3px] bg-[rgba(120,118,112,0.35)] ml-[14px]" />
            <div className="h-[5px] rounded-[3px] bg-[rgba(120,118,112,0.5)] ml-[6px]" />
            <div className="h-[5px] rounded-[3px] bg-[rgba(120,118,112,0.28)] ml-[20px]" />
          </div>
        )}

        {/* Temp + Desc Overlay */}
        <div
          className="absolute left-[26px] bottom-[14px] z-10"
          style={{ color: tempColor }}
        >
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

      {/* Conditions Strip */}
      <div className="flex border-t-[1.5px] border-[#16161a] border-b border-[#cfcdc6] bg-[#f4f3f0] text-[#16161a]">
        <div className="flex-1 py-[11px] pl-[26px]">
          <div className="text-[9px] tracking-[0.13em] text-[#6b6b70] font-bold">
            SRÁŽKY
          </div>
          <div
            className="text-[19px] font-semibold mt-[3px]"
            style={{ color: condPrecipColor }}
          >
            {precipMm > 0 ? Math.round(precipMm * 10) : 0}
            <span className="text-[12px] font-medium text-[#6b6b70]">%</span>
          </div>
        </div>
        <div className="flex-1 py-[11px] pl-[18px] border-l border-[#cfcdc6]">
          <div className="text-[9px] tracking-[0.13em] text-[#6b6b70] font-bold">
            VÍTR
          </div>
          <div className="text-[19px] font-semibold mt-[3px] truncate pr-1">
            {windSpeedMs}
            <span className="text-[12px] font-medium text-[#6b6b70] ml-1">
              m/s {windDirection}
            </span>
          </div>
        </div>
        <div className="flex-1 py-[11px] pl-[18px] border-l border-[#cfcdc6]">
          <div className="text-[9px] tracking-[0.13em] text-[#6b6b70] font-bold">
            VLHKOST
          </div>
          <div className="text-[19px] font-semibold mt-[3px]">
            {calculatedHumidity}
            <span className="text-[12px] font-medium text-[#6b6b70]">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
