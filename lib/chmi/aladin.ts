import { promises as fs } from "node:fs";
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
  maxWindSpeedKmh?: number;
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

function readInt16Grib(buf: Buffer, offset: number): number {
  const val = buf.readUInt16BE(offset);
  if (val & 0x8000) {
    return -(val & 0x7fff);
  }
  return val;
}

function readInt24Grib(buf: Buffer, offset: number): number {
  const val = (buf[offset] << 16) | (buf[offset + 1] << 8) | buf[offset + 2];
  if (val & 0x800000) {
    return -(val & 0x7fffff);
  }
  return val;
}

function readIbmFloat(buf: Buffer, offset: number): number {
  const sign = buf[offset] & 0x80 ? -1 : 1;
  const exponent = buf[offset] & 0x7f;
  const fraction =
    (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3];
  if (fraction === 0) return 0;
  return sign * fraction * Math.pow(16, exponent - 64 - 6);
}

function readBits(
  buf: Buffer,
  startByte: number,
  bitOffset: number,
  numBits: number,
): number {
  const byteOffset = Math.floor(bitOffset / 8);
  const bitShift = bitOffset % 8;

  let val = 0;
  if (startByte + byteOffset + 3 < buf.length) {
    val = buf.readUInt32BE(startByte + byteOffset);
  } else {
    const b0 = buf[startByte + byteOffset] ?? 0;
    const b1 = buf[startByte + byteOffset + 1] ?? 0;
    const b2 = buf[startByte + byteOffset + 2] ?? 0;
    const b3 = buf[startByte + byteOffset + 3] ?? 0;
    val = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
  }

  const shift = 32 - bitShift - numBits;
  return (val >>> shift) & ((1 << numBits) - 1);
}

function extractSeries(
  buf: Buffer,
  lat: number,
  lon: number,
): { validityIso: string; value: number }[] {
  const series: { validityIso: string; value: number }[] = [];
  let offset = 0;
  let gridInfo: { i: number; j: number; bitsPerValue: number } | null = null;

  while (offset < buf.length) {
    if (buf.toString("ascii", offset, offset + 4) !== "GRIB") {
      let found = false;
      for (let idx = offset + 1; idx < buf.length - 4; idx++) {
        if (buf.toString("ascii", idx, idx + 4) === "GRIB") {
          offset = idx;
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    const length =
      (buf[offset + 4] << 16) | (buf[offset + 5] << 8) | buf[offset + 6];

    const pdsOffset = offset + 8;
    const flags = buf[pdsOffset + 7];
    const pdsLen =
      (buf[pdsOffset] << 16) | (buf[pdsOffset + 1] << 8) | buf[pdsOffset + 2];

    const timeUnit = buf[pdsOffset + 17];
    const p1 = buf[pdsOffset + 18];
    const p2 = buf[pdsOffset + 19];
    const timeRangeIndicator = buf[pdsOffset + 20];
    const decimalScaleFactor = readInt16Grib(buf, pdsOffset + 26);

    const year = buf[pdsOffset + 12];
    const month = buf[pdsOffset + 13];
    const day = buf[pdsOffset + 14];
    const hour = buf[pdsOffset + 15];
    const minute = buf[pdsOffset + 16];
    const century = buf[pdsOffset + 24];

    const fullYear = (century - 1) * 100 + year;
    const refDate = new Date(Date.UTC(fullYear, month - 1, day, hour, minute));

    let stepRange = 0;
    if (timeRangeIndicator === 10) {
      stepRange = p2;
    } else {
      stepRange = p1;
    }

    if (timeUnit === 1) {
      refDate.setUTCHours(refDate.getUTCHours() + stepRange);
    } else if (timeUnit === 0) {
      refDate.setUTCMinutes(refDate.getUTCMinutes() + stepRange);
    } else if (timeUnit === 2) {
      refDate.setUTCDate(refDate.getUTCDate() + stepRange);
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const validityIso = `${refDate.getUTCFullYear()}-${pad(refDate.getUTCMonth() + 1)}-${pad(refDate.getUTCDate())}T${pad(refDate.getUTCHours())}:${pad(refDate.getUTCMinutes())}:00Z`;

    const gdsOffset = pdsOffset + pdsLen;
    const gdsLen =
      flags & 128
        ? (buf[gdsOffset] << 16) |
          (buf[gdsOffset + 1] << 8) |
          buf[gdsOffset + 2]
        : 0;

    if (!gridInfo) {
      if (!(flags & 128)) {
        throw new Error("GDS section missing from GRIB1 message");
      }
      const Ni = buf.readUInt16BE(gdsOffset + 6);
      const Nj = buf.readUInt16BE(gdsOffset + 8);
      const La1 = readInt24Grib(buf, gdsOffset + 10) / 1000;
      const Lo1 = readInt24Grib(buf, gdsOffset + 13) / 1000;
      const Di = buf.readUInt16BE(gdsOffset + 23) / 1000;
      const Dj = buf.readUInt16BE(gdsOffset + 25) / 1000;

      const i = Math.round((lon - Lo1) / Di);
      const j = Math.round((lat - La1) / Dj);

      if (i < 0 || i >= Ni || j < 0 || j >= Nj) {
        throw new Error(
          `Coordinates (${lat}, ${lon}) map to out-of-grid indices (i=${i}, j=${j}) for grid size ${Ni}x${Nj}`,
        );
      }

      gridInfo = {
        i,
        j,
        bitsPerValue: 0, // Will be read from BDS
      };
    }

    const bmsOffset = gdsOffset + gdsLen;
    const bmsLen =
      flags & 64
        ? (buf[bmsOffset] << 16) |
          (buf[bmsOffset + 1] << 8) |
          buf[bmsOffset + 2]
        : 0;
    const bdsOffset = bmsOffset + bmsLen;

    const binaryScaleFactor = readInt16Grib(buf, bdsOffset + 4);
    const ibmRef = readIbmFloat(buf, bdsOffset + 6);
    const bitsPerValue = buf[bdsOffset + 10];

    const k = gridInfo.j * buf.readUInt16BE(gdsOffset + 6) + gridInfo.i;
    const bitOffset = k * bitsPerValue;
    const X = readBits(buf, bdsOffset + 11, bitOffset, bitsPerValue);
    const V =
      (ibmRef + X * Math.pow(2, binaryScaleFactor)) *
      Math.pow(10, -decimalScaleFactor);

    series.push({ validityIso, value: V });

    offset += length;
  }

  return series;
}

// Global in-memory cache to keep decompressed buffers warm across requests in the same container.
const gribBufferCache: Record<string, Buffer> = {};

async function getDecompressedGrib(
  runTimestamp: string,
  hourFolder: string,
  suffix: string,
): Promise<Buffer> {
  const cacheKey = `${runTimestamp}_${suffix}`;
  if (gribBufferCache[cacheKey]) {
    return gribBufferCache[cacheKey];
  }

  // Check local filesystem cache (/tmp) to persist decompressed GRIB1 data across cold starts
  // during the execution context lifetime. This avoids Next.js 2MB unstable_cache size limits.
  const cacheFile = path.join(tmpdir(), `aladin-grib-${cacheKey}.grb`);
  try {
    const cachedBuf = await fs.readFile(cacheFile);
    gribBufferCache[cacheKey] = cachedBuf;
    return cachedBuf;
  } catch {
    // Cache miss, download and decompress from CHMI
    const url = `${ALADIN_DIR(hourFolder)}ALADCZ1K4opendata_${runTimestamp}_${suffix}.grb.bz2`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const compressed = Buffer.from(await res.arrayBuffer());
    const decompressed = Bunzip.decode(compressed);

    // Save to local filesystem cache asynchronously
    fs.writeFile(cacheFile, decompressed).catch((err) => {
      console.warn("Failed to write GRIB cache file:", err);
    });

    gribBufferCache[cacheKey] = decompressed;
    return decompressed;
  }
}

async function fetchParamSeries(
  run: RunInfo,
  suffix: string,
  lat: number,
  lon: number,
): Promise<{ validityIso: string; value: number }[]> {
  const decompressed = await getDecompressedGrib(
    run.timestamp,
    run.hourFolder,
    suffix,
  );
  return extractSeries(decompressed, lat, lon);
}

async function getAladinForecastForRunUncached(
  run: RunInfo,
  lat: number,
  lon: number,
): Promise<AladinForecast> {
  const seriesByParam = await Promise.all(
    (Object.entries(PARAMS) as [ParamKey, (typeof PARAMS)[ParamKey]][]).map(
      async ([key, cfg]) => {
        const series = await fetchParamSeries(run, cfg.suffix, lat, lon);
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
    maxWindSpeedKmh: Math.max(...points.map((p) => p.windSpeedKmh)),
  }));
}
