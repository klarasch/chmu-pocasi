"use client";

import { useEffect, useMemo, useState } from "react";
import { moonPhase } from "@/lib/moon-phase";
import type { Condition } from "@/lib/weather-codes";

// One color system shared by sun and moon (the shine, not the body, moves),
// and by clouds across every condition that shows them.
const SUN = "#f2c12e";
const MOON_LIT = "#eef0f5";
const MOON_DARK = "#2c2f3d";
const LIGHTNING = "#f2c12e";
const SNOW = "#9cc0ef";

const DAY_CLOUD = {
  partly: "#fbfaf7",
  cloudy: "#d0cdc6",
  rain: "#8c8a82",
  storm: "#5c5a52",
  snow: "#e8e6e0",
} as const;

const NIGHT_CLOUD = {
  partly: "#3c4254",
  cloudy: "#4c5266",
  rain: "#4c5266",
  storm: "#444a5c",
  snow: "#525872",
} as const;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function shade(hex: string, amt: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 255) + amt);
  const b = clamp((n & 255) + amt);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Cloud drift speed follows wind: calm air barely creeps, gales blow fast.
function cloudDuration(windKmh: number): number {
  return Math.max(7, Math.min(40, 40 - windKmh * 0.62));
}

type CloudPuff = {
  key: string;
  top: number;
  dir: "A" | "B";
  scale: number;
  durMul: number;
  delayFrac: number;
};

// `delayFrac` seeds a negative animation-delay so puffs are already mid-drift
// (and at least one usually crossing the sun) on first paint, instead of
// crawling in from off-screen.
function buildPuffs(condition: Condition): CloudPuff[] {
  if (condition === "partly-cloudy") {
    const tops = [46, 74, 102, 128];
    return tops.map((top, i) => ({
      key: `puff-${i}`,
      top: top + rand(-4, 4),
      dir: "B", // Drifts from right to left (emitted from right)
      scale: rand(0.48, 0.62),
      durMul: 1.0, // Keep durations in sync to prevent drift and ensure constant sun coverage
      delayFrac: i * 0.25, // Spaced evenly across the 4-cloud cycle
    }));
  }
  return [
    {
      key: "a",
      top: 24,
      dir: "A",
      scale: 1.15,
      durMul: rand(0.85, 1.15),
      delayFrac: rand(0, 1),
    },
    {
      key: "b",
      top: 70,
      dir: "B",
      scale: 0.95,
      durMul: rand(0.85, 1.15),
      delayFrac: rand(0, 1),
    },
  ];
}

function Cloud({
  puff,
  color,
  windKmh,
}: {
  puff: CloudPuff;
  color: string;
  windKmh: number;
}) {
  const w = Math.round(150 * puff.scale);
  const h = Math.round(34 * puff.scale);
  const bump = Math.round(46 * puff.scale);
  const duration =
    cloudDuration(windKmh) * (puff.dir === "B" ? 1.35 : 1) * puff.durMul;
  return (
    <div
      className="absolute z-[3]"
      style={{
        top: puff.top,
        width: w,
        height: bump,
        animationName: puff.dir === "A" ? "heroCloudA" : "heroCloudB",
        animationDuration: `${duration}s`,
        animationDelay: `${-puff.delayFrac * duration}s`,
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      }}
    >
      <div
        className="absolute left-0 bottom-0 rounded-[24px]"
        style={{ width: w, height: h, backgroundColor: color }}
      />
      <div
        className="absolute top-0 rounded-full"
        style={{
          left: Math.round(w * 0.18),
          width: bump,
          height: bump,
          backgroundColor: color,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: Math.round(w * 0.5),
          top: Math.round(bump * 0.12),
          width: Math.round(bump * 0.85),
          height: Math.round(bump * 0.85),
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// Sun and moon share one body — same size, same spot. Only the fill (and,
// at night, an illuminated overlay shaped by the real lunar phase) differs.
function Celestial({ isNight, phase }: { isNight: boolean; phase: number }) {
  const r = 54;
  const theta = phase * 2 * Math.PI;
  const d = r * (1 + Math.cos(theta));
  const dir = phase < 0.5 ? 1 : -1;
  const glow = isNight
    ? "rgba(238, 240, 245, 0.35)"
    : "rgba(242, 193, 46, 0.5)";
  const shine = isNight
    ? "rgba(238, 240, 245, 0.5)"
    : "rgba(242, 193, 46, 0.7)";

  return (
    <div className="absolute top-[34px] right-[46px] w-[108px] h-[108px] z-[2]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border-2 opacity-0"
          style={{
            borderColor: shine,
            animation: "heroRing 3.6s ease-out infinite",
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={
          {
            backgroundColor: isNight ? MOON_DARK : SUN,
            "--hero-glow": glow,
            animation: "heroHalo 4.5s ease-in-out infinite",
          } as React.CSSProperties
        }
      >
        {isNight && (
          <div
            className="absolute top-0 left-0 w-[108px] h-[108px] rounded-full"
            style={{
              backgroundColor: MOON_LIT,
              transform: `translateX(${dir * d}px)`,
            }}
          />
        )}
      </div>
    </div>
  );
}

function Rain() {
  const drops = Array.from({ length: 14 }, (_, i) => i);
  return (
    <>
      {drops.map((i) => (
        <div
          key={i}
          className="absolute top-[-16px] w-[3px] h-[14px] rounded-[2px]"
          style={{
            left: 14 + i * 27,
            backgroundColor: "var(--accent)",
            animation: `heroRain ${(0.85 + (i % 3) * 0.12).toFixed(2)}s linear infinite`,
            animationDelay: `${((i * 0.13) % 1).toFixed(2)}s`,
          }}
        />
      ))}
    </>
  );
}

function Snow() {
  const flakes = Array.from({ length: 16 }, (_, i) => i);
  return (
    <>
      {flakes.map((i) => (
        <div
          key={i}
          className="absolute top-[-10px] w-2 h-2 rounded-full"
          style={{
            left: 10 + i * 24,
            backgroundColor: SNOW,
            animation: `heroSnow ${(3 + (i % 3)).toFixed(2)}s linear infinite`,
            animationDelay: `${((i * 0.28) % 3).toFixed(2)}s`,
          }}
        />
      ))}
    </>
  );
}

type Bolt = {
  id: number;
  xPct: number;
  top: number;
  w: number;
  h: number;
  clip: string;
  opacity: number;
};

let boltSeq = 0;

function jaggedPath(): string {
  const pts: Array<[number, number]> = [[50, 0]];
  let y = 0;
  let x = 50;
  while (y < 92) {
    y += rand(18, 30);
    x = Math.max(8, Math.min(92, x + rand(-26, 26)));
    pts.push([Math.round(x + rand(-6, 6)), Math.round(y)]);
    pts.push([Math.round(x - rand(4, 10)), Math.round(y + rand(4, 9))]);
  }
  pts.push([Math.round(x), 100]);
  return `polygon(${pts.map(([px, py]) => `${px}% ${py}%`).join(",")})`;
}

const BOLT_FLICKERS: Array<[number, number]> = [
  [0, 1],
  [60, 0.15],
  [110, 0.9],
  [170, 0],
];

// Randomized strikes — random position, shape, size, and timing each time —
// rather than one fixed bolt icon flickering in the same spot.
function useStormBolts(active: boolean): Bolt[] {
  const [bolts, setBolts] = useState<Bolt[]>([]);

  useEffect(() => {
    if (!active) {
      setBolts([]);
      return;
    }
    let cancelled = false;
    let spawnTimer: ReturnType<typeof setTimeout>;
    const pending: Array<ReturnType<typeof setTimeout>> = [];

    function spawn() {
      if (cancelled) return;
      const id = ++boltSeq;
      const bolt: Bolt = {
        id,
        xPct: rand(6, 86),
        top: rand(4, 40),
        w: rand(14, 26),
        h: rand(70, 150),
        clip: jaggedPath(),
        opacity: 0,
      };
      setBolts((prev) => [...prev, bolt]);
      for (const [t, op] of BOLT_FLICKERS) {
        pending.push(
          setTimeout(() => {
            setBolts((prev) =>
              prev.map((b) => (b.id === id ? { ...b, opacity: op } : b)),
            );
          }, t),
        );
      }
      pending.push(
        setTimeout(() => {
          setBolts((prev) => prev.filter((b) => b.id !== id));
        }, 220),
      );
      spawnTimer = setTimeout(spawn, rand(900, 2600));
    }
    spawn();

    return () => {
      cancelled = true;
      clearTimeout(spawnTimer);
      for (const t of pending) clearTimeout(t);
    };
  }, [active]);

  return bolts;
}

function Storm({ bolts }: { bolts: Bolt[] }) {
  const flashOpacity = bolts.length
    ? Math.max(...bolts.map((b) => b.opacity)) * 0.35
    : 0;
  return (
    <>
      <div
        className="absolute inset-0 z-[3] pointer-events-none bg-white"
        style={{ opacity: flashOpacity }}
      />
      {bolts.map((b) => (
        <div
          key={b.id}
          className="absolute z-[4]"
          style={{
            left: `${b.xPct}%`,
            top: b.top,
            width: b.w,
            height: b.h,
            opacity: b.opacity,
            backgroundColor: LIGHTNING,
            clipPath: b.clip,
          }}
        />
      ))}
    </>
  );
}

type FogBandConfig = {
  top: number;
  opacity: number;
  widthScale: number;
  dir: "A" | "B";
  baseDuration: number;
};

const FOG_BANDS: FogBandConfig[] = [
  { top: 14, opacity: 0.22, widthScale: 1.15, dir: "A", baseDuration: 22 },
  { top: 46, opacity: 0.16, widthScale: 0.9, dir: "B", baseDuration: 30 },
  { top: 96, opacity: 0.26, widthScale: 1.3, dir: "A", baseDuration: 18 },
  { top: 132, opacity: 0.14, widthScale: 0.8, dir: "B", baseDuration: 26 },
];

// Built from the same flattened-capsule shape as the clouds (just wider and
// layered with transparency) so fog reads as kin to the rest of the system
// instead of unrelated skeleton-loader bars.
function Fog({ mounted }: { mounted: boolean }) {
  const bands = useMemo(
    () =>
      FOG_BANDS.map((band) => ({
        ...band,
        durMul: mounted ? rand(0.85, 1.15) : 1,
        delayFrac: mounted ? rand(0, 1) : 0,
      })),
    [mounted],
  );

  return (
    <>
      {bands.map((band) => {
        const w = Math.round(260 * band.widthScale);
        const h = 26;
        const duration = band.baseDuration * band.durMul;
        return (
          <div
            key={band.top}
            className="absolute z-[3]"
            style={{
              top: band.top,
              left: -40,
              width: w,
              height: h,
              borderRadius: h / 2,
              backgroundColor: "var(--hero-ink)",
              opacity: band.opacity,
              animationName: band.dir === "A" ? "heroCloudA" : "heroCloudB",
              animationDuration: `${duration}s`,
              animationDelay: `${-band.delayFrac * duration}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
            }}
          />
        );
      })}
    </>
  );
}

export function HeroIllustration({
  condition,
  isNight,
  windSpeedKmh,
}: {
  condition: Condition;
  isNight: boolean;
  windSpeedKmh: number;
}) {
  // Randomized layout (cloud scatter, fog timing, moon phase) is generated
  // post-mount only, so the server-rendered markup and the client's first
  // paint match exactly — no hydration mismatch from Math.random()/Date.now().
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [phase, setPhase] = useState(0);
  useEffect(() => setPhase(moonPhase()), []);

  const showCelestial = condition === "clear" || condition === "partly-cloudy";
  const overcast =
    condition === "cloudy" ||
    condition === "rain" ||
    condition === "storm" ||
    condition === "snow";
  const showCloud = condition === "partly-cloudy" || overcast;
  const showRain = condition === "rain" || condition === "storm";
  const showSnow = condition === "snow";
  const showStorm = condition === "storm";
  const showFog = condition === "fog";

  const puffs = useMemo(
    () => (mounted && showCloud ? buildPuffs(condition) : []),
    [mounted, showCloud, condition],
  );

  const cloudBase = (): string => {
    const pal = isNight ? NIGHT_CLOUD : DAY_CLOUD;
    switch (condition) {
      case "partly-cloudy":
        return pal.partly;
      case "cloudy":
        return pal.cloudy;
      case "rain":
        return pal.rain;
      case "storm":
        return pal.storm;
      case "snow":
        return pal.snow;
      default:
        return pal.cloudy;
    }
  };

  const bolts = useStormBolts(showStorm);

  return (
    <>
      {showCelestial && <Celestial isNight={isNight} phase={phase} />}
      {puffs.map((puff, i) => {
        const base = cloudBase();
        const color = overcast && i === 1 && !isNight ? shade(base, -12) : base;
        return (
          <Cloud
            key={puff.key}
            puff={puff}
            color={color}
            windKmh={windSpeedKmh}
          />
        );
      })}
      {showRain && <Rain />}
      {showSnow && <Snow />}
      {showStorm && <Storm bolts={bolts} />}
      {showFog && <Fog mounted={mounted} />}
    </>
  );
}
