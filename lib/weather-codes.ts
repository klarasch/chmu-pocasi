export type Condition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "rain"
  | "storm"
  | "snow"
  | "fog";

export function conditionFor(
  precipMm: number,
  cloudCoverPct: number,
  temperatureC?: number,
): Condition {
  if (precipMm > 0.1 && temperatureC !== undefined && temperatureC <= 1) {
    return "snow";
  }
  if (precipMm >= 4) return "storm";
  if (precipMm > 0.1) return "rain";
  if (cloudCoverPct >= 80) return "cloudy";
  if (cloudCoverPct >= 30) return "partly-cloudy";
  return "clear";
}

// Calculate whether it is night for a given time and coordinate in the Czech Republic
// using a simplified solar declination formula (accurate to within 10-15 minutes).
export function isNightHour(
  time: string,
  lat = 50.0755,
  lon = 14.4378,
): boolean {
  const date = new Date(time);
  const hUTC = date.getUTCHours() + date.getUTCMinutes() / 60;

  // Day of the year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  const radian = Math.PI / 180;
  const decl = 23.45 * Math.sin(radian * ((360 / 365) * (284 + day)));

  const latRad = lat * radian;
  const declRad = decl * radian;
  const cosH = -Math.tan(latRad) * Math.tan(declRad);

  let H = 0;
  if (cosH < -1) {
    H = 180; // 24 hours of day
  } else if (cosH > 1) {
    H = 0; // 24 hours of night
  } else {
    H = Math.acos(cosH) / radian;
  }

  const solarNoonUTC = 12 - lon / 15;
  const sunriseUTC = solarNoonUTC - H / 15;
  const sunsetUTC = solarNoonUTC + H / 15;

  return hUTC < sunriseUTC || hUTC > sunsetUTC;
}

export const CONDITION_ICON: Record<Condition, string> = {
  clear: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  storm: "⛈️",
  snow: "❄️",
  fog: "🌫️",
};

export const CONDITION_LABEL: Record<Condition, string> = {
  clear: "Jasno",
  "partly-cloudy": "Polojasno",
  cloudy: "Zataženo",
  rain: "Déšť",
  storm: "Bouřky",
  snow: "Sněžení",
  fog: "Mlha",
};
