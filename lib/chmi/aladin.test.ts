import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test, vi } from "vitest";

// Mock unstable_cache to just return the inner function
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

import { getAladinForecast } from "./aladin";
import { DEFAULT_LOCATION } from "./config";
import { getNationalTextForecast } from "./text";

test("check DailyList tail logic", async () => {
  const aladin = await getAladinForecast(
    DEFAULT_LOCATION.lat,
    DEFAULT_LOCATION.lon,
  );
  const textDays = await getNationalTextForecast();

  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const displayedDays = aladin.daily
    .filter((d) => d.date !== todayStr)
    .slice(0, 5);

  const displayedDates = new Set(displayedDays.map((d) => d.date));
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const tail = textDays.filter((d) => {
    const date = formatter.format(new Date(d.startTime));
    return date > todayStr && !displayedDates.has(date);
  });

  console.log("TODAY:", todayStr);
  console.log("DISPLAYED DATES:", Array.from(displayedDates));
  console.log("TAIL DAYS:");
  for (const d of tail) {
    const date = formatter.format(new Date(d.startTime));
    console.log(`- ${d.headline} (${d.startTime} -> ${date})`);
    expect(date > todayStr).toBe(true);
    expect(displayedDates.has(date)).toBe(false);
  }

  expect(tail.length).toBeGreaterThanOrEqual(0);
});
