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
      <main className="flex h-dvh items-center justify-center p-6 text-center text-sm text-[#e0383f] bg-[#f4f3f0] font-sans">
        Radar se nepodařilo načíst: {error}
      </main>
    );
  }

  if (!data || data.frames.length === 0) {
    return (
      <main className="relative h-dvh animate-fade-in overflow-hidden">
        <RadarPlaceholder
          city={location.lat === DEFAULT_LOCATION.lat ? "PRAHA" : "LOKACE"}
        />
      </main>
    );
  }

  const current = data.frames[Math.min(index, data.frames.length - 1)];

  return (
    <main className="relative h-dvh animate-fade-in overflow-hidden bg-[#ecebe6]">
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
      <RadarAttribution />
    </main>
  );
}

function RadarAttribution() {
  return (
    <a
      href="https://www.chmi.cz"
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-x-0 bottom-[max(0.4rem,env(safe-area-inset-bottom))] z-10 text-center text-[9px] text-[#16161a]/40"
    >
      Data: ČHMÚ, CC BY 4.0
    </a>
  );
}

function RadarPlaceholder({ city = "PRAHA" }: { city?: string }) {
  const [updatedTime, setUpdatedTime] = useState("");
  useEffect(() => {
    const time = new Date().toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setUpdatedTime(time);
  }, []);

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-[#ecebe6] font-sans text-[#16161a]">
      {/* Radar sweep elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="absolute rounded-full border-[1.5px] border-[#d3d1c9]"
          style={{ width: "270px", height: "270px" }}
        />
        <div
          className="absolute rounded-full border-[1.5px] border-[#d3d1c9]"
          style={{ width: "185px", height: "185px" }}
        />
        <div
          className="absolute rounded-full border-[1.5px] border-[#d3d1c9]"
          style={{ width: "100px", height: "100px" }}
        />

        {/* Sweep cone */}
        <div
          className="absolute rounded-full overflow-hidden animate-[fpSpin_4s_linear_infinite]"
          style={{ width: "270px", height: "270px" }}
        >
          <div
            className="absolute left-1/2 top-0 w-1/2 h-1/2 animate-[fpSpin_4s_linear_infinite]"
            style={{
              background:
                "conic-gradient(from 0deg, oklch(0.55 0.17 256 / 0.35), transparent 60%)",
              transformOrigin: "left bottom",
            }}
          />
        </div>

        <div className="absolute left-[43%] top-[39%] w-10 h-10 rounded-full bg-[oklch(0.55 0.17 256/0.5)]" />
        <div className="absolute w-2 h-2 rounded-full bg-[#16161a]" />
      </div>

      <div className="absolute top-[18px] left-[26px] text-[9px] tracking-[0.16em] text-[#6b6b70] font-bold">
        RADAR · {city.toUpperCase()}
      </div>
      <div className="absolute bottom-[104px] left-0 right-0 text-center text-[12px] text-[#6b6b70] font-normal">
        Načítání srážkových dat…{" "}
        {updatedTime && `aktualizováno v ${updatedTime}`}
      </div>
    </div>
  );
}
