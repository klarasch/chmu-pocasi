"use client";

import { useEffect, useState } from "react";
import { RadarLegend } from "@/components/radar/RadarLegend";
import { RadarMap } from "@/components/radar/RadarMap";
import { RadarTimeline } from "@/components/radar/RadarTimeline";
import { DEFAULT_LOCATION } from "@/lib/chmi/config";
import {
  getCachedRadarFrames,
  prefetchRadarFrames,
  type RadarFramesResponse,
} from "@/lib/radar-frames-client";

export default function RadarPage() {
  const [data, setData] = useState<RadarFramesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [location, setLocation] = useState(DEFAULT_LOCATION);

  useEffect(() => {
    // Reuses an in-flight/resolved fetch kicked off by hovering the nav tab,
    // so the map can often render immediately instead of waiting on a fresh request.
    const framesPromise = getCachedRadarFrames() ?? prefetchRadarFrames();
    framesPromise
      .then((d) => {
        setData(d);
        setIndex(
          Math.max(0, d.frames.findIndex((f) => f.kind === "forecast") - 1),
        );
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  if (error) {
    return (
      <main className="flex h-dvh items-center justify-center p-6 text-center text-sm text-red-400">
        Radar se nepodařilo načíst: {error}
      </main>
    );
  }

  if (!data || data.frames.length === 0) {
    return (
      <main className="flex h-dvh animate-fade-in items-center justify-center text-sm text-white/40">
        Načítání radaru…
      </main>
    );
  }

  const current = data.frames[Math.min(index, data.frames.length - 1)];

  return (
    <main className="relative h-dvh animate-fade-in overflow-hidden">
      <RadarMap
        bbox={data.bbox}
        tileUrl={current.tileUrl}
        location={location}
      />
      <RadarLegend />
      <RadarTimeline
        frames={data.frames}
        index={index}
        playing={playing}
        onIndexChange={setIndex}
        onTogglePlay={() => setPlaying((p) => !p)}
      />
    </main>
  );
}
