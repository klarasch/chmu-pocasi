export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { RADAR_BBOX } from "@/lib/chmi/config";
import { listAllFrames } from "@/lib/chmi/radar";

export async function GET() {
  try {
    const frames = await listAllFrames();
    const withTileUrl = frames.map((f) =>
      f.kind === "past"
        ? {
            ...f,
            tileUrl: `/api/radar/tile?kind=past&path=${encodeURIComponent(f.path)}`,
          }
        : {
            ...f,
            tileUrl: `/api/radar/tile?kind=forecast&tar=${encodeURIComponent(
              f.tarPath,
            )}&entry=${encodeURIComponent(f.entryName)}`,
          },
    );
    return NextResponse.json({ bbox: RADAR_BBOX, frames: withTileUrl });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to list radar frames",
      },
      { status: 502 },
    );
  }
}
