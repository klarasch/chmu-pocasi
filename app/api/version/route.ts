import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const buildIdFile = path.join(process.cwd(), ".next", "BUILD_ID");
    const buildId = await fs.readFile(buildIdFile, "utf-8");
    return NextResponse.json({ version: buildId.trim() });
  } catch {
    // Fallback in development mode where BUILD_ID is not present
    return NextResponse.json({ version: "development" });
  }
}
