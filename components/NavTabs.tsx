"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WeatherIcon } from "@/components/icons/WeatherIcon";
import type { HourlyPoint } from "@/lib/chmi/aladin";
import { DEFAULT_LOCATION } from "@/lib/chmi/config";
import { prefetchRadarFrames } from "@/lib/radar-frames-client";
import type { Condition } from "@/lib/weather-codes";
import { conditionFor, isNightHour } from "@/lib/weather-codes";
import { weatherState } from "@/lib/weather-state";

// Reuses the real weather glyph matching actual weather condition instead of a hand-rolled
// lookalike, so the forecast tab is pixel-identical to the icon language
// used throughout the rest of the app.
function ForecastTabIcon({
  condition,
  isNight,
  className,
}: {
  condition: Condition;
  isNight: boolean;
  className?: string;
}) {
  return (
    <WeatherIcon
      condition={condition}
      isNight={isNight}
      size={21}
      className={className}
    />
  );
}

function RadarTabIcon({
  className,
}: {
  className?: string;
  condition?: Condition;
  isNight?: boolean;
}) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative, label text is adjacent
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden
    >
      <path
        d="M12 12 21.5 12A9.5 9.5 0 0 0 12 2.5Z"
        fill="currentColor"
        stroke="none"
        opacity={0.22}
      />
      <circle cx="12" cy="12" r="9.5" opacity={0.35} />
      <circle cx="12" cy="12" r="6" opacity={0.55} />
      <circle cx="12" cy="12" r="2.2" fill="#5ab0ff" stroke="none" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Předpověď", Icon: ForecastTabIcon },
  { href: "/radar", label: "Radar", Icon: RadarTabIcon },
];

export function NavTabs() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const [weather, setWeather] = useState<{
    condition: Condition;
    isNight: boolean;
  }>({
    condition: "partly-cloudy",
    isNight: false,
  });

  useEffect(() => {
    // Initial sync
    setWeather({
      condition: weatherState.getCondition(),
      isNight: weatherState.getIsNight(),
    });

    const unsubscribe = weatherState.subscribe(() => {
      setWeather({
        condition: weatherState.getCondition(),
        isNight: weatherState.getIsNight(),
      });
    });

    let cached: string | null = null;
    try {
      cached = sessionStorage.getItem("current-weather");
    } catch (_e) {}

    if (cached) {
      try {
        const { condition, isNight } = JSON.parse(cached);
        weatherState.setWeather(condition, isNight);
      } catch (_e) {}
    } else {
      fetch(
        `/api/forecast?lat=${DEFAULT_LOCATION.lat}&lon=${DEFAULT_LOCATION.lon}`,
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.hourly) {
            const cutoff = Date.now() - 30 * 60_000;
            const current =
              data.hourly.find(
                (h: HourlyPoint) => new Date(h.time).getTime() >= cutoff,
              ) || data.hourly[0];
            if (current) {
              const cond = conditionFor(
                current.precipMm,
                current.cloudCoverPct,
              );
              const night = isNightHour(current.time);
              weatherState.setWeather(cond, night);
              try {
                sessionStorage.setItem(
                  "current-weather",
                  JSON.stringify({ condition: cond, isNight: night }),
                );
              } catch (_e) {}
            }
          }
        })
        .catch(() => {});
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const active = tabRefs.current.get(pathname);
    if (!container || !active) return;
    const containerRect = container.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setIndicator({ left: rect.left - containerRect.left, width: rect.width });
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        ref={containerRef}
        className="relative isolate flex gap-1 rounded-full border border-white/15 bg-white/10 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl backdrop-saturate-150"
      >
        {indicator && (
          <div
            className="absolute top-1.5 bottom-1.5 rounded-full bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-[left,width] duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
            aria-hidden
          />
        )}
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const isRadar = tab.href === "/radar";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.href, el);
              }}
              onPointerEnter={isRadar ? prefetchRadarFrames : undefined}
              onFocus={isRadar ? prefetchRadarFrames : undefined}
              className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-[color,transform] duration-150 active:scale-95 [text-shadow:0_1px_4px_rgba(0,0,0,0.3)] ${
                active ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
            >
              <tab.Icon
                condition={weather.condition}
                isNight={weather.isNight}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
