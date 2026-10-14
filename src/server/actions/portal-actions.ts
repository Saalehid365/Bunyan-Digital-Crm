"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { encryptSecret } from "@/lib/crypto";
import { deleteBlob } from "@/lib/blob-store";
import { notifyTeamOfPortalActivity } from "@/lib/portal-activity";
import { portalBrandPageSchema, clientMessageSchema } from "@/lib/validations/portal";

function emptyToUndefined(v: string | undefined) {
  return v && v.trim() !== "" ? v.trim() : undefined;
}

/** Deletes an uploaded file's row and its underlying blob — a no-op if fileId is unset. */
async function deleteFileIfAny(fileId: string | null) {
  if (!fileId) return;
  const file = await prisma.clientFile.findUnique({ where: { id: fileId }, select: { key: true } });
  if (!file) return;
  await deleteBlob(file.key);
  await prisma.clientFile.delete({ where: { id: fileId } }).catch(() => {});
}

/** Every action here scopes to the signed-in portal user's own clientId — never a
 * clientId taken from the form — so one client can never read or write another's data. */

export async function deletePortalAsset(id: string) {
  const portalUser = await requirePortalUser();
  const existing = await prisma.clientAsset.findUnique({ where: { id }, select: { clientId: true, fileId: true } });
  if (!existing || existing.clientId !== portalUser.clientId) return { error: "Not found" };
  await prisma.clientAsset.delete({ where: { id } });
  await deleteFileIfAny(existing.fileId);
  revalidatePath("/portal/brand");
}

/** Finds this client's single "logo" asset (the first one, if more than one ever existed)
 * so the brand kit form can treat the logo as one field instead of a separate add-a-file
 * step — upserting it keeps a client from having to visit two different forms to send
 * their colours and their logo together. */
async function upsertLogoAsset(
  clientId: string,
  portalUserId: string,
  logoUrl: string | undefined,
  logoFileId: string | undefined,
) {
  if (!logoUrl) return;
  const existing = await prisma.clientAsset.findFirst({ where: { clientId, kind: "LOGO" }, orderBy: { createdAt: "asc" } });
  if (existing) {
    if (existing.fileId && existing.fileId !== logoFileId) await deleteFileIfAny(existing.fileId);
    await prisma.clientAsset.update({
      where: { id: existing.id },
      data: { url: logoUrl, fileId: logoFileId || null, addedByPortal: true, addedByPortalUserId: portalUserId },
    });
  } else {
    await prisma.clientAsset.create({
      data: {
        clientId,
        kind: "LOGO",
        label: "Logo",
        url: logoUrl,
        fileId: logoFileId || undefined,
        addedByPortal: true,
        addedByPortalUserId: portalUserId,
      },
    });
  }
}

/**
 * The whole "Brand & access" page in one submit: colours, logo, notes always save;
 * an additional file and an access login are each created only if their own label was
 * filled in. One button at the end of the page, not a separate save per section.
 */
export async function savePortalBrandPage(formData: FormData) {
  const portalUser = await requirePortalUser();
  const parsed = portalBrandPageSchema.safeParse({
    clientId: portalUser.clientId,
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
    notes: formData.get("notes"),
    logoUrl: formData.get("logoUrl"),
    logoFileId: formData.get("logoFileId"),
    fileLabel: formData.get("fileLabel"),
    fileUrl: formData.get("fileUrl"),
    fileFileId: formData.get("fileFileId"),
    fileKind: formData.get("fileKind") || "BRAND_FILE",
    accessLabel: formData.get("accessLabel"),
    accessUsername: formData.get("accessUsername"),
    accessSecret: formData.get("accessSecret"),
    accessUrl: formData.get("accessUrl"),
    accessNotes: formData.get("accessNotes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const fileLabel = emptyToUndefined(data.fileLabel);
  const fileLink = emptyToUndefined(data.fileUrl) ?? emptyToUndefined(data.fileFileId);
  const wantsAccess = Boolean(emptyToUndefined(data.accessLabel));
  if (fileLabel && !fileLink) {
    return { error: "Add a link or upload a file for “" + fileLabel + "”, or clear its label." };
  }
  if (fileLink && !fileLabel) {
    return { error: "Give the additional file a label, or remove it." };
  }
  const wantsFile = Boolean(fileLabel && fileLink);
  if ((emptyToUndefined(data.accessUsername) || emptyToUndefined(data.accessSecret)) && !wantsAccess) {
    return { error: "Say what the login is for, or clear its details." };
  }

  const sent: string[] = ["brand kit"];

  await prisma.clientBrandKit.upsert({
    where: { clientId: portalUser.clientId },
    create: {
      clientId: portalUser.clientId,
      primaryColor: emptyToUndefined(data.primaryColor),
      secondaryColor: emptyToUndefined(data.secondaryColor),
      accentColor: emptyToUndefined(data.accentColor),
      notes: emptyToUndefined(data.notes),
    },
    update: {
      primaryColor: emptyToUndefined(data.primaryColor) ?? null,
      secondaryColor: emptyToUndefined(data.secondaryColor) ?? null,
      accentColor: emptyToUndefined(data.accentColor) ?? null,
      notes: emptyToUndefined(data.notes) ?? null,
    },
  });
  await upsertLogoAsset(portalUser.clientId, portalUser.id, emptyToUndefined(data.logoUrl), emptyToUndefined(data.logoFileId));

  if (wantsFile) {
    await prisma.clientAsset.create({
      data: {
        clientId: portalUser.clientId,
        kind: data.fileKind,
        label: data.fileLabel!.trim(),
        url: emptyToUndefined(data.fileUrl) ?? "",
        fileId: emptyToUndefined(data.fileFileId),
        addedByPortal: true,
        addedByPortalUserId: portalUser.id,
      },
    });
    sent.push(`"${data.fileLabel!.trim()}"`);
  }

  if (wantsAccess) {
    await prisma.clientAccess.create({
      data: {
        clientId: portalUser.clientId,
        label: data.accessLabel!.trim(),
        username: emptyToUndefined(data.accessUsername),
        secretCipher: encryptSecret(data.accessSecret?.trim() ?? ""),
        url: emptyToUndefined(data.accessUrl),
        notes: emptyToUndefined(data.accessNotes),
      },
    });
    sent.push(`access to "${data.accessLabel!.trim()}"`);
  }

  await notifyTeamOfPortalActivity(portalUser.clientId, `${portalUser.name} sent ${sent.join(", ")}`);
  revalidatePath("/portal/brand");
  return { ok: true };
}

export async function sendPortalMessage(formData: FormData) {
  const portalUser = await requirePortalUser();
  const parsed = clientMessageSchema.safeParse({ clientId: portalUser.clientId, body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await prisma.clientMessage.create({
    data: { clientId: portalUser.clientId, body: parsed.data.body, senderKind: "CLIENT", senderPortalUserId: portalUser.id },
  });
  await prisma.clientPortalUser.update({ where: { id: portalUser.id }, data: { messagesReadAt: new Date() } });
  revalidatePath("/portal/messages");
  return { ok: true };
}

export async function markPortalMessagesReadByClient() {
  const portalUser = await requirePortalUser();
  await prisma.clientPortalUser.update({ where: { id: portalUser.id }, data: { messagesReadAt: new Date() } });
}

export async function markPortalDocumentCompleted(id: string, uploadedFile?: { id: string; url: string }) {
  const portalUser = await requirePortalUser();
  const existing = await prisma.clientDocument.findUnique({ where: { id }, select: { clientId: true } });
  if (!existing || existing.clientId !== portalUser.clientId) return { error: "Not found" };

  // If the client attached their signed/completed copy, it replaces the original link —
  // verify the uploaded file actually belongs to this client before trusting it.
  let fileUpdate: { fileId: string; url: string } | undefined;
  if (uploadedFile) {
    const file = await prisma.clientFile.findUnique({ where: { id: uploadedFile.id }, select: { clientId: true } });
    if (file && file.clientId === portalUser.clientId) {
      fileUpdate = { fileId: uploadedFile.id, url: uploadedFile.url };
    }
  }

  await prisma.clientDocument.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date(), ...fileUpdate },
  });
  revalidatePath("/portal/documents");
  return { ok: true };
}
