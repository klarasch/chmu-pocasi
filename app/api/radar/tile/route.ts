export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchForecastTile, fetchPastTile } from "@/lib/chmi/radar-tile";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");

  try {
    let buf: Buffer;
    if (kind === "past") {
      const path = searchParams.get("path");
      if (!path)
        return NextResponse.json({ error: "missing path" }, { status: 400 });
      buf = await fetchPastTile(path);
    } else if (kind === "forecast") {
      const tarPath = searchParams.get("tar");
      const entry = searchParams.get("entry");
      if (!tarPath || !entry)
        return NextResponse.json(
          { error: "missing tar/entry" },
          { status: 400 },
        );
      buf = await fetchForecastTile(tarPath, entry);
    } else {
      return NextResponse.json({ error: "invalid kind" }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=240, immutable",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch radar tile",
      },
      { status: 502 },
    );
  }
}
