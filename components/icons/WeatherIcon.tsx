"use client";

import type { Condition } from "@/lib/weather-codes";

export function WeatherIcon({
  condition,
  isNight = false,
  size = 30,
  className = "",
}: {
  condition: Condition;
  isNight?: boolean;
  size?: number;
  className?: string;
}) {
  const scale = size / 30;

  // Map our Condition types to Bauhaus icon types
  let iconType:
    | "sun"
    | "moon"
    | "partly"
    | "partly-night"
    | "cloud"
    | "rain"
    | "storm"
    | "snow"
    | "fog" = "sun";
  if (condition === "clear") {
    iconType = isNight ? "moon" : "sun";
  } else if (condition === "partly-cloudy") {
    iconType = isNight ? "partly-night" : "partly";
  } else if (condition === "cloudy") {
    iconType = "cloud";
  } else if (condition === "rain") {
    iconType = "rain";
  } else if (condition === "storm") {
    iconType = "storm";
  } else if (condition === "snow") {
    iconType = "snow";
  } else if (condition === "fog") {
    iconType = "fog";
  }

  return (
    <div
      className={`relative select-none shrink-0 overflow-hidden ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: "30px",
          height: "30px",
          transform: `scale(${scale})`,
        }}
      >
        {/* CLEAR (day) - SUN */}
        {iconType === "sun" && (
          <div className="absolute left-[5px] top-[5px] w-5 h-5 rounded-full bg-[#f2c12e]" />
        )}

        {/* CLEAR (night) - MOON CRESCENT (using box-shadow to be transparent) */}
        {iconType === "moon" && (
          <div
            className="absolute left-[10px] top-[2px] w-[18px] h-[18px] rounded-full"
            style={{
              boxShadow: "-6px 5px 0 0 var(--icon-moon)",
            }}
          />
        )}

        {/* PARTLY (day) */}
        {iconType === "partly" && (
          <>
            <div className="absolute right-[2px] top-[1px] w-[15px] h-[15px] rounded-full bg-[#f2c12e]" />
            <div
              className="absolute left-[2px] bottom-[7px] w-10 h-10 rounded-full bg-[#c9c6bd] scale-25 origin-bottom-left"
              style={{ width: "10px", height: "10px" }}
            />
            <div
              className="absolute right-[5px] bottom-[8px] w-9 h-9 rounded-full bg-[#c9c6bd] scale-25 origin-bottom-right"
              style={{ width: "9px", height: "9px" }}
            />
            <div
              className="absolute left-[3px] bottom-[5px] w-6 h-[11px] rounded-[6px] bg-[#c9c6bd]"
              style={{ width: "24px" }}
            />
          </>
        )}

        {/* PARTLY (night) */}
        {iconType === "partly-night" && (
          <>
            <div
              className="absolute right-[4px] top-[-1px] w-[12px] h-[12px] rounded-full"
              style={{
                boxShadow: "-3px 3px 0 0 var(--icon-moon)",
              }}
            />
            <div className="absolute left-[2px] bottom-[7px] w-[10px] h-[10px] rounded-full bg-[#c9c6bd]" />
            <div className="absolute right-[5px] bottom-[8px] w-[9px] h-[9px] rounded-full bg-[#c9c6bd]" />
            <div className="absolute left-[3px] bottom-[5px] w-[24px] h-[11px] rounded-[6px] bg-[#c9c6bd]" />
          </>
        )}

        {/* CLOUDY */}
        {iconType === "cloud" && (
          <>
            <div className="absolute left-[3px] top-[6px] w-[12px] h-[12px] rounded-full bg-[#a8a59c]" />
            <div className="absolute right-[3px] top-[9px] w-[10px] h-[10px] rounded-full bg-[#a8a59c]" />
            <div className="absolute left-[3px] bottom-[6px] w-[24px] h-[12px] rounded-[6px] bg-[#a8a59c]" />
          </>
        )}

        {/* RAIN */}
        {iconType === "rain" && (
          <>
            <div className="absolute left-[3px] top-[3px] w-[12px] h-[12px] rounded-full bg-[#9a978e]" />
            <div className="absolute right-[3px] top-[6px] w-[10px] h-[10px] rounded-full bg-[#9a978e]" />
            <div className="absolute left-[3px] top-[9px] w-[24px] h-[11px] rounded-[6px] bg-[#9a978e]" />
            <div className="absolute left-[8px] bottom-0 w-[2px] h-[7px] rounded-[1px] bg-[#2b5fd9] animate-[wi-rain_1.1s_linear_infinite]" />
            <div className="absolute left-[15px] bottom-0 w-[2px] h-[7px] rounded-[1px] bg-[#2b5fd9] animate-[wi-rain_1.1s_linear_0.35s_infinite]" />
            <div className="absolute left-[21px] bottom-0 w-[2px] h-[7px] rounded-[1px] bg-[#2b5fd9] animate-[wi-rain_1.1s_linear_0.65s_infinite]" />
          </>
        )}

        {/* THUNDERSTORM */}
        {iconType === "storm" && (
          <>
            <div className="absolute left-[3px] top-[3px] w-[12px] h-[12px] rounded-full bg-[#7c7a72]" />
            <div className="absolute right-[3px] top-[6px] w-[10px] h-[10px] rounded-full bg-[#7c7a72]" />
            <div className="absolute left-[3px] top-[9px] w-[24px] h-[11px] rounded-[6px] bg-[#7c7a72]" />
            <div
              className="absolute left-[11px] bottom-[-1px] w-[11px] h-[14px] bg-[#f2c12e] animate-[wi-flash_2.4s_linear_infinite]"
              style={{
                clipPath:
                  "polygon(52% 0, 18% 58%, 44% 58%, 28% 100%, 84% 36%, 54% 36%)",
              }}
            />
          </>
        )}

        {/* SNOW */}
        {iconType === "snow" && (
          <>
            <div className="absolute left-[3px] top-[3px] w-[12px] h-[12px] rounded-full bg-[#a8a59c]" />
            <div className="absolute right-[3px] top-[6px] w-[10px] h-[10px] rounded-full bg-[#a8a59c]" />
            <div className="absolute left-[3px] top-[9px] w-[24px] h-[11px] rounded-[6px] bg-[#a8a59c]" />
            <div className="absolute left-[8px] bottom-[1px] w-[4px] h-[4px] rounded-full bg-[#9cc0ef] animate-[wi-snow_1.6s_linear_infinite]" />
            <div className="absolute left-[14px] bottom-[-1px] w-[4px] h-[4px] rounded-full bg-[#9cc0ef] animate-[wi-snow_1.6s_linear_0.5s_infinite]" />
            <div className="absolute left-[20px] bottom-[1px] w-[4px] h-[4px] rounded-full bg-[#9cc0ef] animate-[wi-snow_1.6s_linear_1s_infinite]" />
          </>
        )}

        {/* FOG */}
        {iconType === "fog" && (
          <>
            <div className="absolute left-[3px] top-[5px] w-[24px] h-[3px] rounded-[2px] bg-[#a8a59c]" />
            <div className="absolute left-[6px] top-[12px] w-[21px] h-[3px] rounded-[2px] bg-[#bdbab1]" />
            <div className="absolute left-[3px] top-[19px] w-[24px] h-[3px] rounded-[2px] bg-[#a8a59c]" />
            <div className="absolute left-[7px] top-[26px] w-[16px] h-[3px] rounded-[2px] bg-[#bdbab1]" />
          </>
        )}
      </div>
    </div>
  );
}
