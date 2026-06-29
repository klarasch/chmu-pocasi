export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getActiveAlerts } from "@/lib/chmi/alerts";
import { getNationalTextForecast } from "@/lib/chmi/text";

export async function GET() {
  try {
    const [days, alerts] = await Promise.all([
      getNationalTextForecast(),
      getActiveAlerts(),
    ]);
    return NextResponse.json({ days, alerts });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load text forecast",
      },
      { status: 502 },
    );
  }
}
