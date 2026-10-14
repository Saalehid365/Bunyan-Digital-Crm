"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { encryptSecret } from "@/lib/crypto";
import { deleteBlob } from "@/lib/blob-store";
import { notifyTeamOfPortalActivity } from "@/lib/portal-activity";
import { clientAssetSchema, brandKitSchema, clientMessageSchema } from "@/lib/validations/portal";
import { clientAccessSchema } from "@/lib/validations/access";

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

export async function addPortalAsset(formData: FormData) {
  const portalUser = await requirePortalUser();
  const parsed = clientAssetSchema.safeParse({
    clientId: portalUser.clientId,
    kind: formData.get("kind") || "OTHER",
    label: formData.get("label"),
    url: formData.get("url"),
    fileId: formData.get("fileId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  await prisma.clientAsset.create({
    data: {
      clientId: portalUser.clientId,
      kind: data.kind,
      label: data.label,
      url: data.url,
      fileId: emptyToUndefined(data.fileId),
      addedByPortal: true,
      addedByPortalUserId: portalUser.id,
    },
  });
  await notifyTeamOfPortalActivity(portalUser.clientId, `${portalUser.name} added "${data.label}" to brand files`);
  revalidatePath("/portal/brand");
  return { ok: true };
}

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

export async function savePortalBrandKit(formData: FormData) {
  const portalUser = await requirePortalUser();
  const parsed = brandKitSchema.safeParse({
    clientId: portalUser.clientId,
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
    notes: formData.get("notes"),
    logoUrl: formData.get("logoUrl"),
    logoFileId: formData.get("logoFileId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

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
  await notifyTeamOfPortalActivity(portalUser.clientId, `${portalUser.name} updated their brand kit`);
  revalidatePath("/portal/brand");
  return { ok: true };
}

/** The client submitting one of their own platform logins (store admin, GA4…) for the
 * team to use — stored encrypted, in the same ClientAccess table and with the same
 * encryptSecret() the team's own Access tab already uses. */
export async function submitPortalAccess(formData: FormData) {
  const portalUser = await requirePortalUser();
  const parsed = clientAccessSchema.safeParse({
    clientId: portalUser.clientId,
    label: formData.get("label"),
    username: formData.get("username"),
    secret: formData.get("secret"),
    url: formData.get("url"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  await prisma.clientAccess.create({
    data: {
      clientId: portalUser.clientId,
      label: data.label,
      username: emptyToUndefined(data.username),
      secretCipher: encryptSecret(data.secret?.trim() ?? ""),
      url: emptyToUndefined(data.url),
      notes: emptyToUndefined(data.notes),
    },
  });
  await notifyTeamOfPortalActivity(portalUser.clientId, `${portalUser.name} submitted access details for "${data.label}"`);
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
