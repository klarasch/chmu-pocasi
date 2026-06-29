import { unstable_cache } from "next/cache";
import { CHMI_BASE } from "./config";

const TEXT_DIR = `${CHMI_BASE}/forecast/now/`;

export type ForecastSection = {
  name: string;
  headline: string | null;
  text: string;
};

export type DailyTextForecast = {
  dayOffset: number;
  headline: string;
  startTime: string;
  endTime: string;
  sections: ForecastSection[];
};

// pCR0..pCR5tx = today..day+5 (daily), pCR8tx = multi-day outlook beyond that.
const NATIONAL_CODES = [
  "pCR0tx",
  "pCR1tx",
  "pCR2tx",
  "pCR3tx",
  "pCR4tx",
  "pCR5tx",
  "pCR8tx",
];

let lastSuccessfulTextForecast: DailyTextForecast[] = [];

async function listTextDirUncached(): Promise<string[]> {
  const res = await fetch(TEXT_DIR, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Failed to list ${TEXT_DIR}: ${res.status}`);
  const html = await res.text();
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

function latestFileFor(entries: string[], code: string): string | null {
  const matches = entries
    .filter(
      (e) =>
        e.startsWith(`web_${code}_`) &&
        e.endsWith(".json") &&
        !e.includes("_CCA"),
    )
    .sort();
  return matches.at(-1) ?? null;
}

async function fetchDailyForecastWithEntries(
  entries: string[],
  code: string,
  dayOffset: number,
): Promise<DailyTextForecast | null> {
  const file = latestFileFor(entries, code);
  if (!file) return null;

  try {
    const res = await fetch(`${TEXT_DIR}${file}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const props = json?.data?.features?.[0]?.properties;
    if (!props) return null;

    return {
      dayOffset,
      headline: props["headline-main"]?.headline ?? "",
      startTime: props["headline-main"]?.startTime ?? "",
      endTime: props["headline-main"]?.endTime ?? "",
      sections: (props.data ?? [])
        .filter((d: { displayText?: string }) => d.displayText)
        .map(
          (d: {
            name: string;
            headline: string | null;
            displayText: string;
          }) => ({
            name: d.name,
            headline: d.headline,
            text: d.displayText,
          }),
        ),
    };
  } catch (err) {
    console.warn(`Failed to fetch daily text forecast for ${code}:`, err);
    return null;
  }
}

async function getNationalTextForecastUncached(): Promise<DailyTextForecast[]> {
  try {
    const entries = await listTextDirUncached();
    const results = await Promise.all(
      NATIONAL_CODES.map((code, i) =>
        fetchDailyForecastWithEntries(entries, code, i === 6 ? 6 : i),
      ),
    );
    const filtered = results.filter((r): r is DailyTextForecast => r !== null);
    if (filtered.length > 0) {
      lastSuccessfulTextForecast = filtered;
      return filtered;
    }
  } catch (err) {
    console.error("Failed to fetch national text forecast:", err);
  }
  return lastSuccessfulTextForecast;
}

export const getNationalTextForecast = unstable_cache(
  getNationalTextForecastUncached,
  ["national-text-forecast"],
  { revalidate: 30 * 60 },
);
