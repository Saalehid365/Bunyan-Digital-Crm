import { NextResponse } from "next/server";
import { getCurrentUser, getVisibleClientIds } from "@/lib/permissions";
import { getNewPortalActivity } from "@/lib/portal-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Polled by a signed-in team member's browser so a client submitting brand/access
 * details can alert them live — scoped to the clients they can actually see. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientIds = user.role === "ADMIN" ? undefined : await getVisibleClientIds(user.id);
  return NextResponse.json(await getNewPortalActivity(clientIds), { headers: { "Cache-Control": "no-store" } });
}
