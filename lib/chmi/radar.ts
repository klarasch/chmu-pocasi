import { unstable_cache } from "next/cache";
import { CHMI_BASE } from "./config";

export type RadarFrame =
  | { kind: "past"; timestamp: string; path: string }
  | {
      kind: "forecast";
      timestamp: string;
      leadMinutes: number;
      tarPath: string;
      entryName: string;
    };

const PAST_DIR = `${CHMI_BASE}/radar/composite/maxz/png/`;
const FORECAST_DIR = `${CHMI_BASE}/radar/composite/fct_maxz/png/`;

const PAST_RE = /pacz2gmaps3\.z_max3d\.(\d{8})\.(\d{4})\.0\.png/;
const FORECAST_TAR_RE =
  /pacz2gmaps3\.fct_z_max\.(\d{8})\.(\d{4})\.ft(\d+)s(\d+)\.tar/;

async function listDirectoryUncached(url: string): Promise<string[]> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Failed to list ${url}: ${res.status}`);
  const html = await res.text();
  return [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((href) => !href.startsWith(".."));
}

const listDirectory = unstable_cache(
  listDirectoryUncached,
  ["radar-dir-listing"],
  { revalidate: 60 },
);

function toIsoTimestamp(yyyymmdd: string, hhmm: string): string {
  const year = yyyymmdd.slice(0, 4);
  const month = yyyymmdd.slice(4, 6);
  const day = yyyymmdd.slice(6, 8);
  const hour = hhmm.slice(0, 2);
  const minute = hhmm.slice(2, 4);
  return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
}

/** Past frames on the 5-min grid, most recent last. `hours` controls how far back to look. */
export async function listPastFrames(hours = 2): Promise<RadarFrame[]> {
  const entries = await listDirectory(PAST_DIR);
  const frames = entries
    .map((name) => {
      const m = name.match(PAST_RE);
      if (!m) return null;
      return {
        kind: "past" as const,
        timestamp: toIsoTimestamp(m[1], m[2]),
        path: name,
      };
    })
    .filter((f): f is RadarFrame & { kind: "past" } => f !== null)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return frames.filter((f) => new Date(f.timestamp).getTime() >= cutoff);
}

/** Nowcast frames derived from the most recent forecast tar's filename — no download needed for listing. */
export async function listForecastFrames(): Promise<RadarFrame[]> {
  const entries = await listDirectory(FORECAST_DIR);
  const tars = entries
    .map((name) => {
      const m = name.match(FORECAST_TAR_RE);
      if (!m) return null;
      return {
        name,
        date: m[1],
        time: m[2],
        horizonMin: Number(m[3]),
        stepMin: Number(m[4]),
        baseIso: toIsoTimestamp(m[1], m[2]),
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => a.baseIso.localeCompare(b.baseIso));

  const latest = tars.at(-1);
  if (!latest) return [];

  const baseMs = new Date(latest.baseIso).getTime();
  const frames: RadarFrame[] = [];
  for (
    let lead = latest.stepMin;
    lead <= latest.horizonMin;
    lead += latest.stepMin
  ) {
    const validMs = baseMs + lead * 60_000;
    frames.push({
      kind: "forecast",
      timestamp: new Date(validMs).toISOString(),
      leadMinutes: lead,
      tarPath: latest.name,
      entryName: `${latest.date}.${latest.time}/pacz2gmaps3.fct_z_max.${formatYYYYMMDD(
        validMs,
      )}.${formatHHMM(validMs)}.${lead}.png`,
    });
  }
  return frames;
}

function formatYYYYMMDD(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

function formatHHMM(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export async function listAllFrames(): Promise<RadarFrame[]> {
  const [past, forecast] = await Promise.all([
    listPastFrames(),
    listForecastFrames(),
  ]);
  return [...past, ...forecast];
}

export { FORECAST_DIR, PAST_DIR };
