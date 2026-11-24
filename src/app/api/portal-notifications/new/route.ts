import { NextResponse } from "next/server";
import { getPortalUser } from "@/lib/portal-auth";
import { getNewPortalNotifications } from "@/lib/portal-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Polled by a signed-in client's browser so a document, product update, message or
 * other team-sent item can alert them live — mirrors /api/portal-activity/new on the
 * team side, just in the other direction. */
export async function GET() {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await getNewPortalNotifications(portalUser.clientId), {
    headers: { "Cache-Control": "no-store" },
  });
}
