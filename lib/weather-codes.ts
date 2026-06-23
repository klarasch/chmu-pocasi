export type Condition = "clear" | "partly-cloudy" | "cloudy" | "rain" | "storm";

export function conditionFor(
  precipMm: number,
  cloudCoverPct: number,
): Condition {
  if (precipMm >= 4) return "storm";
  if (precipMm > 0.1) return "rain";
  if (cloudCoverPct >= 80) return "cloudy";
  if (cloudCoverPct >= 30) return "partly-cloudy";
  return "clear";
}

// ALADIN timestamps are UTC instants and this runs both on the server
// (container TZ is UTC) and the client, so UTC hours stay consistent
// between SSR and hydration instead of drifting with local TZ.
export function isNightHour(time: string): boolean {
  const h = new Date(time).getUTCHours();
  return h < 6 || h >= 21;
}

export const CONDITION_ICON: Record<Condition, string> = {
  clear: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  storm: "⛈️",
};

export const CONDITION_LABEL: Record<Condition, string> = {
  clear: "Jasno",
  "partly-cloudy": "Polojasno",
  cloudy: "Zataženo",
  rain: "Déšť",
  storm: "Bouřky",
};
