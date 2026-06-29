import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test, vi } from "vitest";

// Mock unstable_cache to just return the inner function
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

import { getAladinForecast } from "./aladin";
import { DEFAULT_LOCATION } from "./config";
import { getNationalTextForecast } from "./text";

test("check cold latencies", async () => {
  // Clear GRIB temp files
  const tmp = os.tmpdir();
  try {
    const files = fs
      .readdirSync(tmp)
      .filter((f) => f.startsWith("aladin-grib-"));
    console.log(`Clearing ${files.length} cached GRIB files...`);
    for (const f of files) {
      fs.unlinkSync(path.join(tmp, f));
    }
  } catch (err) {
    console.warn("Failed to clear GRIB files:", err);
  }

  console.log("1. Starting getNationalTextForecast (Cold)...");
  const t0 = Date.now();
  const text = await getNationalTextForecast();
  console.log(
    `getNationalTextForecast took ${((Date.now() - t0) / 1000).toFixed(2)}s, count: ${text.length}`,
  );

  console.log("2. Starting getAladinForecast (Cold)...");
  const t1 = Date.now();
  const aladin = await getAladinForecast(
    DEFAULT_LOCATION.lat,
    DEFAULT_LOCATION.lon,
  );
  console.log(
    `getAladinForecast took ${((Date.now() - t1) / 1000).toFixed(2)}s, run: ${aladin.runTimestamp}`,
  );

  expect(text.length).toBeGreaterThanOrEqual(0);
}, 60000);
