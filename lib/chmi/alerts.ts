import { unstable_cache } from "next/cache";
import { CHMI_BASE } from "./config";

const ALERTS_DIR = `${CHMI_BASE}/alerts/cap/`;
const ACTIVE_SEVERITIES = new Set(["Moderate", "Severe", "Extreme"]);
// Kept low: each file is its own connection to opendata.chmi.cz, competing
// for the same per-origin socket pool as the (visible) ALADIN/text fetches.
const RECENT_FILES_TO_CHECK = 12;
const FILE_FETCH_TIMEOUT_MS = 8_000;

export type WeatherAlert = {
  identifier: string;
  event: string;
  severity: string;
  areas: string[];
  sent: string | null;
  onset: string | null;
  expires: string | null;
};

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return m ? m[1].trim() : null;
}

function parseCapXml(xml: string): WeatherAlert | null {
  const identifier = tag(xml, "identifier");
  const event = tag(xml, "event");
  const severity = tag(xml, "severity");
  if (!identifier || !event || !severity) return null;

  const areas = [
    ...new Set(
      [...xml.matchAll(/<areaDesc>([^<]*)<\/areaDesc>/g)].map((m) =>
        m[1].trim(),
      ),
    ),
  ];

  return {
    identifier,
    event,
    severity,
    areas,
    sent: tag(xml, "sent"),
    onset: tag(xml, "onset"),
    expires: tag(xml, "expires"),
  };
}

/** Directory listing entries with last-modified, parsed from the Apache-style HTML index. */
async function listAlertsByRecency(): Promise<string[]> {
  const res = await fetch(ALERTS_DIR, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Failed to list ${ALERTS_DIR}: ${res.status}`);
  const html = await res.text();
  const rows = [
    ...html.matchAll(
      /<a href="([^"]+\.xml)">[^<]*<\/a>\s+(\d{2}-\w{3}-\d{4} \d{2}:\d{2})/g,
    ),
  ];
  return rows
    .map((m) => ({ file: m[1], modified: new Date(m[2]).getTime() }))
    .sort((a, b) => b.modified - a.modified)
    .slice(0, RECENT_FILES_TO_CHECK)
    .map((r) => r.file);
}

async function getActiveAlertsUncached(): Promise<WeatherAlert[]> {
  const files = await listAlertsByRecency();
  const now = Date.now();

  const parsed = await Promise.all(
    files.map(async (file) => {
      try {
        const res = await fetch(`${ALERTS_DIR}${file}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(FILE_FETCH_TIMEOUT_MS),
        });
        if (!res.ok) return null;
        return parseCapXml(await res.text());
      } catch {
        // opendata.chmi.cz is flaky under load; skip the file rather than fail the whole batch
        return null;
      }
    }),
  );

  // Files are sorted by directory recency above, but `sent` (from inside the XML) is the
  // authoritative ordering — CHMI reissues the same warning under a new identifier on every
  // update, so dedupe by event and keep only the most recently sent one.
  const byEvent = new Map<string, WeatherAlert>();
  for (const alert of parsed) {
    if (!alert) continue;
    if (!ACTIVE_SEVERITIES.has(alert.severity)) continue;
    if (alert.expires && new Date(alert.expires).getTime() < now) continue;

    const existing = byEvent.get(alert.event);
    if (!existing || (alert.sent ?? "") > (existing.sent ?? "")) {
      byEvent.set(alert.event, alert);
    }
  }

  return [...byEvent.values()];
}

export const getActiveAlerts = unstable_cache(
  getActiveAlertsUncached,
  ["active-alerts"],
  { revalidate: 5 * 60 },
);
