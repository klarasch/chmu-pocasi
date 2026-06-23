import { DEFAULT_LOCATION } from "@/lib/chmi/config";

// Just under the cache revalidate windows in lib/chmi/* (30-60 min), so a
// background refresh always lands before a real request would see a miss.
const REFRESH_INTERVAL_MS = 20 * 60_000;

async function warm() {
  const [
    { getAladinForecast },
    { getNationalTextForecast },
    { getActiveAlerts },
    { listAllFrames },
  ] = await Promise.all([
    import("@/lib/chmi/aladin"),
    import("@/lib/chmi/text"),
    import("@/lib/chmi/alerts"),
    import("@/lib/chmi/radar"),
  ]);

  await Promise.allSettled([
    getAladinForecast(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon),
    getNationalTextForecast(),
    getActiveAlerts(),
    listAllFrames(),
  ]);
}

// Runs once on server boot, then on a timer — so the expensive ALADIN
// GRIB2 decode (and the text/alerts fetches) happen in the background
// instead of blocking whichever user's request happens to hit a cold cache.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Suppress DeprecationWarning: Buffer() is deprecated due to security and usability issues.
  // This warning is triggered by seek-bzip (used for ALADIN's GRIB2 decompression).
  const originalEmitWarning = process.emitWarning;
  // biome-ignore lint/suspicious/noExplicitAny: process.emitWarning override signature uses any
  process.emitWarning = (warning: string | Error, ...args: any[]) => {
    if (
      typeof warning === "string" &&
      (warning.includes("DEP0005") || warning.includes("Buffer()"))
    ) {
      return;
    }
    if (
      warning instanceof Error &&
      // biome-ignore lint/suspicious/noExplicitAny: Error.code does not exist on standard Error type
      ((warning as any).code === "DEP0005" ||
        warning.message.includes("Buffer()"))
    ) {
      return;
    }
    // biome-ignore lint/suspicious/noExplicitAny: forwarding args requires casting
    return originalEmitWarning.call(process, warning, ...(args as any));
  };

  // Intercept and ignore the Next.js 15 Turbopack HMR WebSocket ping frame bug
  // to prevent it from crashing the development server.
  process.on("unhandledRejection", (reason: unknown) => {
    const msg = (reason as Error)?.message || String(reason);
    if (msg.includes("unrecognized HMR message")) {
      return;
    }
    console.error("Unhandled Rejection:", reason);
  });

  warm().catch((err) => {
    console.error("[warm] initial cache warm failed", err);
  });

  setInterval(() => {
    warm().catch((err) => {
      console.error("[warm] periodic cache warm failed", err);
    });
  }, REFRESH_INTERVAL_MS);
}
