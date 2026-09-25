import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { getNewApplications } from "@/lib/revenue-finder-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Polled by the signed-in admin's browser so a new application can alert them live. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getNewApplications(), { headers: { "Cache-Control": "no-store" } });
}
