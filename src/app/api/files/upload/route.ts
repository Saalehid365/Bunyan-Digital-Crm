import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessClient } from "@/lib/permissions";
import { getPortalUser } from "@/lib/portal-auth";
import { putBlob } from "@/lib/blob-store";
import { BASE_PATH } from "@/lib/base-path";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, ALLOWED_UPLOAD_TYPES, sanitizeFileName } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts a file from either side of the client portal — a team member (with access to
 * the client) or the client's own portal user — and stores it in Netlify Blobs (see
 * src/lib/blob-store.ts). The clientId a portal user may upload to is always their own
 * session's clientId, never form input, so one client can never attach a file to another.
 */
export async function POST(req: Request) {
  const portalUser = await getPortalUser();
  let clientId: string;
  let uploadedByPortal = false;
  let uploadedByUserId: string | undefined;
  let uploadedByPortalUserId: string | undefined;

  if (portalUser) {
    clientId = portalUser.clientId;
    uploadedByPortal = true;
    uploadedByPortalUserId = portalUser.id;
  } else {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formPreview = await req.clone().formData().catch(() => null);
    const requestedClientId = String(formPreview?.get("clientId") ?? "");
    if (!requestedClientId || !(await canAccessClient(user, requestedClientId))) {
      return NextResponse.json({ error: "You don't have access to this client." }, { status: 403 });
    }
    clientId = requestedClientId;
    uploadedByUserId = user.id;
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `Files must be under ${MAX_UPLOAD_LABEL}` }, { status: 400 });
  }
  if (file.type && !ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "That file type isn't supported" }, { status: 400 });
  }

  const fileName = sanitizeFileName(file.name || "file");
  const key = `clients/${clientId}/${randomUUID()}-${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await putBlob(key, buffer);

  const record = await prisma.clientFile.create({
    data: {
      clientId,
      key,
      fileName,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      uploadedByPortal,
      uploadedByUserId,
      uploadedByPortalUserId,
    },
  });

  return NextResponse.json({
    id: record.id,
    fileName: record.fileName,
    size: record.size,
    contentType: record.contentType,
    url: `${BASE_PATH}/api/files/${record.id}`,
  });
}
