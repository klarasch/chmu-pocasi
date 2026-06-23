import type { Condition } from "@/lib/weather-codes";

// Each weather state owns a solid colour that fills the whole screen. Day uses
// vivid, luminous hues (it should read as *day*, not dusk); night drops to
// deep, desaturated tones — the two are deliberately far apart so you can tell
// day from night at a glance. `base` is the flat field behind the whole page;
// `top` is a slightly lighter shade bled into the top sky / status-bar zone so
// there's never a black bar when the app is pinned to the iOS home screen.
//
// All bases stay dark enough that white body text and the translucent "glass"
// cards keep WCAG AA contrast (verified on the live result, per state).
type Field = { top: string; base: string };

const FIELD_DAY: Record<Condition, Field> = {
  clear: { top: "#2f7ac9", base: "#15539a" },
  "partly-cloudy": { top: "#3d6f9f", base: "#244f78" },
  cloudy: { top: "#4a5563", base: "#333d49" },
  rain: { top: "#2d6079", base: "#173f56" },
  storm: { top: "#473b66", base: "#2c2348" },
};

const FIELD_NIGHT: Record<Condition, Field> = {
  clear: { top: "#15294d", base: "#0b1c38" },
  "partly-cloudy": { top: "#1b2a44", base: "#111f34" },
  cloudy: { top: "#222a36", base: "#161c26" },
  rain: { top: "#152d40", base: "#0d2030" },
  storm: { top: "#231b3c", base: "#15102a" },
};

function field(condition: Condition, isNight: boolean): Field {
  return (isNight ? FIELD_NIGHT : FIELD_DAY)[condition];
}

// One continuous wash from the lighter sky down to the deep base — no early
// plateau. This is a fixed, viewport-anchored layer, so it never actually
// "ends" as you scroll; the point is that wherever a glass card happens to
// sit on screen, it's blending with a gently-varying colour rather than a
// flat plate, which is what makes the card edges read as smooth instead of
// a hard-edged box dropped onto the page.
export function weatherField(condition: Condition, isNight: boolean): string {
  const f = field(condition, isNight);
  return `linear-gradient(180deg, ${f.top} 0%, ${f.base} 100%)`;
}

// The flat base colour alone — used to paint <html>/<body> (so overscroll and
// the safe-area / notch zones are filled) and the browser theme-colour.
export function weatherBase(condition: Condition, isNight: boolean): string {
  return field(condition, isNight).base;
}

// The lighter sky tone alone — this is what's actually visible at the very
// top of the viewport (under the status bar / Dynamic Island), so it's what
// `theme-color` must match to avoid a seam between Safari's translucent
// status-bar overlay and the page content right below it.
export function weatherTop(condition: Condition, isNight: boolean): string {
  return field(condition, isNight).top;
}

// Cold->hot scale, keyed by *position within the displayed range* (0 = the
// coldest value in the list, 1 = the hottest) rather than fixed degC
// thresholds — so, like Apple Weather, the hottest day of the visible week
// actually reaches red instead of capping out at orange on a mild week.
const HEAT_STOPS: Array<[number, string]> = [
  [0, "#5ab0ff"],
  [0.25, "#60a5fa"],
  [0.45, "#a3e635"],
  [0.65, "#facc15"],
  [0.85, "#fb923c"],
  [1, "#ef4444"],
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function temperatureColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const last = HEAT_STOPS[HEAT_STOPS.length - 1];
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const [lo, loColor] = HEAT_STOPS[i];
    const [hi, hiColor] = HEAT_STOPS[i + 1];
    if (clamped >= lo && clamped <= hi) {
      const step = (clamped - lo) / (hi - lo);
      const [r1, g1, b1] = hexToRgb(loColor);
      const [r2, g2, b2] = hexToRgb(hiColor);
      return `rgb(${Math.round(lerp(r1, r2, step))}, ${Math.round(lerp(g1, g2, step))}, ${Math.round(lerp(b1, b2, step))})`;
    }
  }
  return last[1];
}

export function temperatureRangeGradient(lowT: number, highT: number): string {
  return `linear-gradient(to right, ${temperatureColor(lowT)}, ${temperatureColor(highT)})`;
}
