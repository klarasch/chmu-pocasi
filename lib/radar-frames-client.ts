export type RadarFrame = {
  kind: "past" | "forecast";
  timestamp: string;
  tileUrl: string;
};

export type RadarFramesResponse = {
  bbox: { west: number; east: number; south: number; north: number };
  frames: RadarFrame[];
};

// Module-level cache so a hover/focus on the Radar nav tab can kick off the
// fetch before navigation even happens — by the time the page mounts, the
// data is often already in flight or resolved.
let cached: Promise<RadarFramesResponse> | null = null;
let cachedAt = 0;
const TTL_MS = 60_000;

function isFresh(): boolean {
  return cached !== null && Date.now() - cachedAt < TTL_MS;
}

export function prefetchRadarFrames(): Promise<RadarFramesResponse> {
  if (isFresh() && cached) return cached;

  cachedAt = Date.now();
  const promise = fetch("/api/radar/frames")
    .then((r) => r.json())
    .then((d: RadarFramesResponse | { error: string }) => {
      if ("error" in d) throw new Error(d.error);
      return d;
    });
  promise.catch(() => {
    cached = null;
  });
  cached = promise;
  return promise;
}

export function getCachedRadarFrames(): Promise<RadarFramesResponse> | null {
  return isFresh() ? cached : null;
}
