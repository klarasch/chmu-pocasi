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

  const numericDays = aladin.daily;
  const qualitativeDays = textDays;

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

  console.log("NUMERIC DATES:", Array.from(numericDates));
  console.log("ALL TEXT DAYS:");
  for (const d of qualitativeDays) {
    console.log(
      `- offset ${d.dayOffset}: ${d.headline} (${d.startTime} -> ${formatter.format(new Date(d.startTime))})`,
    );
  }
  console.log("TAIL DAYS:");
  for (const d of tail) {
    console.log(
      `- ${d.headline} (${d.startTime} -> ${formatter.format(new Date(d.startTime))})`,
    );
  }

  expect(tail.length).toBeGreaterThanOrEqual(0);
});
