import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { unstable_cache } from "next/cache";
import Bunzip from "seek-bzip";
import { CHMI_BASE } from "./config";

const RUN_HOURS = ["00", "06", "12", "18"] as const;
const ALADIN_DIR = (hour: string) => `${CHMI_BASE}/nwp_aladin/CZ_1km/${hour}/`;

/**
 * eccodes (grib_ls) is required to decode ALADIN's GRIB2 files — confirmed during
 * build that pure-JS parsers (grib2-simple) don't support CHMI's grid/parameter
 * encoding. This means the forecast API needs a Node server/container with
 * eccodes installed (`brew install eccodes` / `apt install libeccodes-tools`),
 * not an edge runtime.
 */
type ParamKey =
  | "temperatureC"
  | "precipMm"
  | "windSpeedKmh"
  | "windDirDeg"
  | "cloudCoverPct";

const PARAMS: Record<
  ParamKey,
  { suffix: string; transform: (raw: number) => number; cumulative?: boolean }
> = {
  temperatureC: { suffix: "CLSTEMPERATURE", transform: (k) => k - 273.15 },
  precipMm: {
    suffix: "SURFPREC_TOTAL",
    transform: (mm) => mm,
    cumulative: true,
  },
  windSpeedKmh: { suffix: "CLSWIND_SPEED", transform: (ms) => ms * 3.6 },
  windDirDeg: { suffix: "CLSWIND_DIREC", transform: (deg) => deg },
  cloudCoverPct: {
    suffix: "SURFNEBUL_TOTALE",
    transform: (frac) => frac * 100,
  },
};

export type HourlyPoint = {
  time: string; // ISO
  temperatureC: number;
  precipMm: number;
  windSpeedKmh: number;
  windDirDeg: number;
  cloudCoverPct: number;
};

export type DailyPoint = {
  date: string; // YYYY-MM-DD
  highC: number;
  lowC: number;
  precipMm: number;
};

export type AladinForecast = {
  runTimestamp: string; // YYYYMMDDHH
  hourly: HourlyPoint[];
  daily: DailyPoint[];
};

type RunInfo = { hourFolder: string; timestamp: string };

async function listDir(url: string): Promise<string[]> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Failed to list ${url}: ${res.status}`);
  const html = await res.text();
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

/** Picks the most recent run that has all required parameter files present. */
async function discoverLatestRunUncached(): Promise<RunInfo> {
  const requiredSuffixes = Object.values(PARAMS).map((p) => p.suffix);

  // The 4 run-hour directories are independent — list them concurrently
  // instead of paying 4x sequential round-trips to a flaky upstream server.
  const listings = await Promise.all(
    RUN_HOURS.map((hour) => listDir(ALADIN_DIR(hour))),
  );

  const candidates: RunInfo[] = [];
  RUN_HOURS.forEach((hour, i) => {
    const entries = listings[i];
    const timestamps = new Set<string>();
    for (const e of entries) {
      const m = e.match(/ALADCZ1K4opendata_(\d{10})_/);
      if (m) timestamps.add(m[1]);
    }
    for (const ts of timestamps) {
      const hasAll = requiredSuffixes.every((suffix) =>
        entries.includes(`ALADCZ1K4opendata_${ts}_${suffix}.grb.bz2`),
      );
      if (hasAll) candidates.push({ hourFolder: hour, timestamp: ts });
    }
  });

  candidates.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latest = candidates[0];
  if (!latest) throw new Error("No complete ALADIN run found");
  return latest;
}

// Persisted via Next's Data Cache instead of a process-local Map, so a dev
// server restart or a fresh serverless cold start doesn't pay the full
// discovery cost again within the revalidate window.
const discoverLatestRun = unstable_cache(
  discoverLatestRunUncached,
  ["aladin-latest-run"],
  { revalidate: 30 * 60 },
);

function runGribLs(
  filePath: string,
  lat: number,
  lon: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "grib_ls",
      [
        "-l",
        `${lat},${lon},1`,
        "-p",
        "validityDate,validityTime",
        "-W",
        "14",
        filePath,
      ],
      { maxBuffer: 32 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) reject(new Error(`grib_ls failed: ${stderr || err.message}`));
        else resolve(stdout);
      },
    );
  });
}

function parseGribLsTable(
  stdout: string,
): { validityIso: string; value: number }[] {
  const lines = stdout.split("\n").slice(2); // skip filename + header
  const rows: { validityIso: string; value: number }[] = [];
  for (const line of lines) {
    const m = line.trim().match(/^(\d{8})\s+(\d{1,4})\s+([-\d.]+)/);
    if (!m) continue;
    const [, date, time, value] = m;
    const hhmm = time.padStart(4, "0");
    const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}:00Z`;
    rows.push({ validityIso: iso, value: Number(value) });
  }
  return rows;
}

async function fetchParamSeries(
  run: RunInfo,
  suffix: string,
  lat: number,
  lon: number,
  workDir: string,
): Promise<{ validityIso: string; value: number }[]> {
  const url = `${ALADIN_DIR(run.hourFolder)}ALADCZ1K4opendata_${run.timestamp}_${suffix}.grb.bz2`;
  // Multi-MB GRIB2 file — needs more headroom than the small listing/JSON fetches.
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const compressed = Buffer.from(await res.arrayBuffer());
  const decompressed = Bunzip.decode(compressed);

  const filePath = path.join(workDir, `${suffix}.grb`);
  await writeFile(filePath, decompressed);

  const stdout = await runGribLs(filePath, lat, lon);
  return parseGribLsTable(stdout);
}

async function getAladinForecastForRunUncached(
  run: RunInfo,
  lat: number,
  lon: number,
): Promise<AladinForecast> {
  const workDir = await mkdtemp(path.join(tmpdir(), `aladin-${randomUUID()}-`));
  try {
    const seriesByParam = await Promise.all(
      (Object.entries(PARAMS) as [ParamKey, (typeof PARAMS)[ParamKey]][]).map(
        async ([key, cfg]) => {
          const series = await fetchParamSeries(
            run,
            cfg.suffix,
            lat,
            lon,
            workDir,
          );
          return [key, series, cfg] as const;
        },
      ),
    );

    const timeline = new Map<string, Partial<Record<ParamKey, number>>>();
    for (const [key, series, cfg] of seriesByParam) {
      let prevCumulative: number | null = null;
      for (const { validityIso, value } of series) {
        let v = cfg.transform(value);
        if (cfg.cumulative) {
          const cumulativeMm = value;
          v =
            prevCumulative === null
              ? 0
              : Math.max(0, cumulativeMm - prevCumulative);
          prevCumulative = cumulativeMm;
        }
        const entry = timeline.get(validityIso) ?? {};
        entry[key] = v;
        timeline.set(validityIso, entry);
      }
    }

    const hourly: HourlyPoint[] = [...timeline.entries()]
      .filter(([, v]) => Object.keys(v).length === Object.keys(PARAMS).length)
      // biome-ignore-start lint/style/noNonNullAssertion: the filter above guarantees every param key is present
      .map(([time, v]) => ({
        time,
        temperatureC: v.temperatureC!,
        precipMm: v.precipMm!,
        windSpeedKmh: v.windSpeedKmh!,
        windDirDeg: v.windDirDeg!,
        cloudCoverPct: v.cloudCoverPct!,
      }))
      // biome-ignore-end lint/style/noNonNullAssertion: see above
      .sort((a, b) => a.time.localeCompare(b.time));

    const daily = aggregateDaily(hourly);
    return {
      runTimestamp: run.timestamp,
      hourly,
      daily,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

// Keyed on the run object, not just lat/lon, so a newly-published model run
// naturally produces a fresh cache entry instead of serving a stale forecast
// for up to the revalidate window.
const getAladinForecastForRun = unstable_cache(
  getAladinForecastForRunUncached,
  ["aladin-forecast"],
  { revalidate: 60 * 60 },
);

export async function getAladinForecast(
  lat: number,
  lon: number,
): Promise<AladinForecast> {
  const run = await discoverLatestRun();
  return getAladinForecastForRun(run, lat, lon);
}

// `hourly` starts at the model run's first output time (e.g. 00 UTC), which
// is usually well before "now" — callers must drop the already-elapsed
// hours before treating hourly[0] as the current conditions.
export function fromNow(hourly: HourlyPoint[]): HourlyPoint[] {
  const cutoff = Date.now() - 30 * 60_000;
  return hourly.filter((h) => new Date(h.time).getTime() >= cutoff);
}

function aggregateDaily(hourly: HourlyPoint[]): DailyPoint[] {
  const byDate = new Map<string, HourlyPoint[]>();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  for (const h of hourly) {
    const date = formatter.format(new Date(h.time));
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)?.push(h);
  }
  return [...byDate.entries()].map(([date, points]) => ({
    date,
    highC: Math.max(...points.map((p) => p.temperatureC)),
    lowC: Math.min(...points.map((p) => p.temperatureC)),
    precipMm: points.reduce((sum, p) => sum + p.precipMm, 0),
  }));
}
