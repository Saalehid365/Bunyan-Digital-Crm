import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessClient } from "@/lib/permissions";
import { getPortalUser } from "@/lib/portal-auth";
import { getBlob } from "@/lib/blob-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams back a previously uploaded file. The blob's object key is never exposed to the
 * browser — only this row's id — and every request is re-authorized here: a team member
 * needs access to the file's client, a portal user must belong to that same client.
 */
export async function GET(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const file = await prisma.clientFile.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const portalUser = await getPortalUser();
  if (portalUser) {
    if (portalUser.clientId !== file.clientId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    const user = await getCurrentUser();
    if (!user || !(await canAccessClient(user, file.clientId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const data = await getBlob(file.key);
  if (!data) return NextResponse.json({ error: "File content missing" }, { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
