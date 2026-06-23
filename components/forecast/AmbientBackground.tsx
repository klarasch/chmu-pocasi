import { weatherField } from "@/lib/condition-gradients";
import type { Condition } from "@/lib/weather-codes";

// Fixed full-viewport layer behind the whole scrollable page (not just the
// hero). position:fixed + inset-0 means it covers the screen edge-to-edge —
// including under the notch / status bar — so the weather colour is always
// what shows during iOS overscroll or when pinned to the home screen.
//
// The signature, instead of Apple's photographic skies: faint **isolines** —
// the flowing contour lines of a meteorological chart (isobars). They drift
// slowly and grow from calm, near-parallel curves in clear weather to tight,
// turbulent ones in a storm, so the texture itself encodes the conditions.

const VB_W = 800;
const VB_H = 1280;

// rows = how many contour lines; amp/freq = wave height/tightness;
// opacity = line strength. Calm -> turbulent as the weather worsens.
const ISO: Record<
  Condition,
  { rows: number; amp: number; freq: number; opacity: number }
> = {
  clear: { rows: 7, amp: 13, freq: 1.1, opacity: 0.05 },
  "partly-cloudy": { rows: 8, amp: 19, freq: 1.5, opacity: 0.06 },
  cloudy: { rows: 9, amp: 26, freq: 1.9, opacity: 0.07 },
  rain: { rows: 10, amp: 22, freq: 2.3, opacity: 0.07 },
  storm: { rows: 11, amp: 40, freq: 2.9, opacity: 0.09 },
};

// One smooth horizontal contour as an SVG path. Deterministic (no randomness)
// so server and client render identically and hydration stays stable.
function isoline(y: number, amp: number, freq: number, phase: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= VB_W; x += 16) {
    const yy = y + Math.sin((x / VB_W) * Math.PI * 2 * freq + phase) * amp;
    pts.push(`${x},${yy.toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}

export function AmbientBackground({
  condition,
  isNight,
}: {
  condition: Condition;
  isNight: boolean;
}) {
  const p = ISO[condition];
  const lines = Array.from({ length: p.rows }, (_, i) => {
    const y = (i / (p.rows - 1)) * (VB_H + 80) - 40;
    return isoline(y, p.amp, p.freq, i * 0.7);
  });

  const sunny = condition === "clear" || condition === "partly-cloudy";
  const rainy = condition === "rain" || condition === "storm";

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden motion-safe:animate-ambient-gradient"
      style={{ background: weatherField(condition, isNight) }}
      aria-hidden
    >
      {/* Dynamic independent wave line layers */}
      {lines.map((d, i) => (
        <svg
          key={d}
          className="absolute inset-0 h-full w-full motion-safe:animate-wave-line"
          style={{
            animationDelay: `${i * -1.6}s`,
            animationDuration: `${14 + i * 2.5}s`,
          }}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          aria-hidden="true"
        >
          <path
            d={d}
            stroke="white"
            strokeOpacity={p.opacity * 2.8}
            strokeWidth={1.4}
          />
        </svg>
      ))}

      {/* Clear/partly: a soft sun glow, brighter and warmer by day. */}
      {sunny && (
        <div
          className="absolute h-[55vh] w-[55vh] rounded-full blur-3xl motion-safe:animate-ambient-breathe"
          style={{
            top: "-14%",
            right: "-10%",
            background: isNight
              ? "radial-gradient(circle, rgba(150,170,255,0.12), transparent 65%)"
              : "radial-gradient(circle, rgba(255,224,150,0.28), transparent 65%)",
          }}
        />
      )}

      {/* Rain/storm: fine cool streaks + a low mist. */}
      {rainy && (
        <>
          <div className="ambient-rain absolute inset-x-0 top-[-20%] h-[160%] opacity-[0.06] motion-safe:animate-ambient-rain" />
          <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-sky-300/[0.06] to-transparent" />
        </>
      )}

      {/* Storm: a rare, distant flash. */}
      {condition === "storm" && (
        <div className="absolute inset-0 bg-white motion-safe:animate-ambient-flash" />
      )}
    </div>
  );
}
