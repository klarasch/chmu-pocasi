import * as tar from "tar-stream";
import { FORECAST_DIR, PAST_DIR } from "./radar";

const TTL_MS = 4 * 60 * 1000; // radar refreshes every 5 min — cache a touch under that
const tileCache = new Map<string, { buf: Buffer; expiresAt: number }>();
const tarCache = new Map<
  string,
  { entries: Map<string, Buffer>; expiresAt: number }
>();

function cacheGet(
  map: Map<string, { expiresAt: number } & Record<string, unknown>>,
  key: string,
) {
  const hit = map.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit;
  if (hit) map.delete(key);
  return undefined;
}

export async function fetchPastTile(path: string): Promise<Buffer> {
  const cached = cacheGet(tileCache, path) as { buf: Buffer } | undefined;
  if (cached) return cached.buf;

  const res = await fetch(`${PAST_DIR}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok)
    throw new Error(`Failed to fetch radar tile ${path}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  tileCache.set(path, { buf, expiresAt: Date.now() + TTL_MS });
  return buf;
}

export async function fetchForecastTile(
  tarPath: string,
  entryName: string,
): Promise<Buffer> {
  const cachedTar = cacheGet(tarCache, tarPath) as
    | { entries: Map<string, Buffer> }
    | undefined;
  const entries = cachedTar
    ? cachedTar.entries
    : await downloadAndExtractTar(tarPath);
  if (!cachedTar)
    tarCache.set(tarPath, { entries, expiresAt: Date.now() + TTL_MS });

  const buf = entries.get(entryName);
  if (!buf) throw new Error(`Entry ${entryName} not found in ${tarPath}`);
  return buf;
}

async function downloadAndExtractTar(
  tarPath: string,
): Promise<Map<string, Buffer>> {
  const res = await fetch(`${FORECAST_DIR}${tarPath}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok)
    throw new Error(`Failed to fetch forecast tar ${tarPath}: ${res.status}`);
  const tarBuf = Buffer.from(await res.arrayBuffer());

  const entries = new Map<string, Buffer>();
  await new Promise<void>((resolve, reject) => {
    const extract = tar.extract();
    extract.on(
      "entry",
      (
        header: tar.Headers,
        stream: NodeJS.ReadableStream,
        next: () => void,
      ) => {
        const chunks: Buffer[] = [];
        stream.on("data", (c: Buffer) => chunks.push(c));
        stream.on("end", () => {
          if (header.type === "file")
            entries.set(header.name, Buffer.concat(chunks));
          next();
        });
        stream.resume();
      },
    );
    extract.on("finish", resolve);
    extract.on("error", reject);
    extract.end(tarBuf);
  });
  return entries;
}
