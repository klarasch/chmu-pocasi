export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAladinForecast } from "@/lib/chmi/aladin";
import { DEFAULT_LOCATION } from "@/lib/chmi/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat") ?? DEFAULT_LOCATION.lat);
  const lon = Number(searchParams.get("lon") ?? DEFAULT_LOCATION.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "invalid lat/lon" }, { status: 400 });
  }

  try {
    const forecast = await getAladinForecast(lat, lon);
    return NextResponse.json(forecast);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load ALADIN forecast",
      },
      { status: 502 },
    );
  }
}
