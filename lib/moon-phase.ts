// Synodic month length and a known new-moon reference epoch (2000-01-06
// 18:14 UTC) give the moon's illuminated fraction without an external
// ephemeris. 0 = new moon, 0.5 = full moon, 1 = next new moon.
const SYNODIC_MONTH_DAYS = 29.530588853;
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14, 0);

export function moonPhase(date: Date = new Date()): number {
  const days = (date.getTime() - KNOWN_NEW_MOON_UTC) / 86400000;
  const phase = (days % SYNODIC_MONTH_DAYS) / SYNODIC_MONTH_DAYS;
  return phase < 0 ? phase + 1 : phase;
}

export function moonPhaseLabel(phase: number): string {
  if (phase < 0.02 || phase > 0.98) return "Nov";
  if (phase < 0.23) return "Dorůstající srpek";
  if (phase < 0.27) return "První čtvrť";
  if (phase < 0.48) return "Dorůstající Měsíc";
  if (phase < 0.52) return "Úplněk";
  if (phase < 0.73) return "Ubývající Měsíc";
  if (phase < 0.77) return "Poslední čtvrť";
  return "Ubývající srpek";
}
