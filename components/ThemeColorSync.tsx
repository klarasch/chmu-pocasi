"use client";

import { useEffect } from "react";
import type { Condition } from "@/lib/weather-codes";
import { weatherState } from "@/lib/weather-state";

// Keeps the <meta name="theme-color"> tag in sync with the current weather
// gradient's top tone. Safari uses this value to paint the translucent
// status-bar strip in regular browser tabs — if it doesn't match the page's
// own top-of-viewport color, you get a visible seam right under the notch.
// Also syncs the current weather condition and night status to the global
// client-side state so the bottom tab bar can display the correct icon.
export function ThemeColorSync({
  color,
  condition,
  isNight,
}: {
  color: string;
  condition: Condition;
  isNight: boolean;
}) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", color);
  }, [color]);

  useEffect(() => {
    weatherState.setWeather(condition, isNight);
    try {
      sessionStorage.setItem(
        "current-weather",
        JSON.stringify({ condition, isNight }),
      );
    } catch (_e) {}
  }, [condition, isNight]);

  return null;
}
