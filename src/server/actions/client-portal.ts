"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission, canAccessClient } from "@/lib/permissions";
import { hashPassword } from "@/lib/password";
import { deleteBlob } from "@/lib/blob-store";
import {
  portalUserSchema,
  clientResultSchema,
  clientCampaignSchema,
  clientReportSchema,
  clientAssetSchema,
  brandKitSchema,
  clientMessageSchema,
  clientDocumentSchema,
} from "@/lib/validations/portal";

function emptyToUndefined(v: string | undefined) {
  return v && v.trim() !== "" ? v.trim() : undefined;
}
function path(clientId: string) {
  revalidatePath(`/clients/${clientId}/portal`);
}

/** Deletes an uploaded file's row and its underlying blob — a no-op if fileId is unset. */
async function deleteFileIfAny(fileId: string | null) {
  if (!fileId) return;
  const file = await prisma.clientFile.findUnique({ where: { id: fileId }, select: { key: true } });
  if (!file) return;
  await deleteBlob(file.key);
  await prisma.clientFile.delete({ where: { id: fileId } }).catch(() => {});
}

/* ---------- portal login access ---------- */

export async function createPortalUser(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const parsed = portalUserSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  if (!(await canAccessClient(user, data.clientId))) return { error: "You don't have access to this client." };

  const existing = await prisma.clientPortalUser.findUnique({ where: { email: data.email } });
  if (existing) return { error: "A portal contact with that email already exists." };

  await prisma.clientPortalUser.create({
    data: { clientId: data.clientId, name: data.name, email: data.email, passwordHash: hashPassword(data.password) },
  });
  path(data.clientId);
  return { ok: true };
}

export async function setPortalUserPassword(portalUserId: string, clientId: string, password: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  if (password.length < 8) return { error: "Use at least 8 characters" };
  await prisma.clientPortalUser.update({ where: { id: portalUserId }, data: { passwordHash: hashPassword(password) } });
  path(clientId);
  return { ok: true };
}

export async function setPortalUserDisabled(portalUserId: string, clientId: string, disabled: boolean) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  await prisma.clientPortalUser.update({
    where: { id: portalUserId },
    data: { disabledAt: disabled ? new Date() : null },
  });
  path(clientId);
}

export async function deletePortalUser(portalUserId: string, clientId: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  await prisma.clientPortalUser.delete({ where: { id: portalUserId } });
  path(clientId);
}

/* ---------- results ---------- */

export async function addClientResult(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const parsed = clientResultSchema.safeParse({
    clientId: formData.get("clientId"),
    period: formData.get("period"),
    label: formData.get("label"),
    value: formData.get("value"),
    change: formData.get("change"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  if (!(await canAccessClient(user, data.clientId))) return { error: "You don't have access to this client." };

  const last = await prisma.clientResult.findFirst({ where: { clientId: data.clientId }, orderBy: { position: "desc" }, select: { position: true } });
  await prisma.clientResult.create({
    data: {
      clientId: data.clientId,
      period: data.period,
      label: data.label,
      value: data.value,
      change: emptyToUndefined(data.change),
      position: (last?.position ?? 0) + 1024,
    },
  });
  path(data.clientId);
  return { ok: true };
}

export async function deleteClientResult(id: string, clientId: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  await prisma.clientResult.delete({ where: { id } });
  path(clientId);
}

/* ---------- campaigns ---------- */

export async function addClientCampaign(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const parsed = clientCampaignSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    platform: formData.get("platform"),
    status: formData.get("status") || "ACTIVE",
    // The create form has no "End date" field, so this is always absent (formData.get
    // returns null, not "") — `|| undefined` so the schema's string-or-empty-string
    // validator doesn't reject it.
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    spend: formData.get("spend") || undefined,
    revenue: formData.get("revenue") || undefined,
    roas: formData.get("roas") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  if (!(await canAccessClient(user, data.clientId))) return { error: "You don't have access to this client." };

  await prisma.clientCampaign.create({
    data: {
      clientId: data.clientId,
      name: data.name,
      platform: data.platform,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      spend: data.spend,
      revenue: data.revenue,
      roas: data.roas,
      notes: emptyToUndefined(data.notes),
    },
  });
  path(data.clientId);
  return { ok: true };
}

export async function updateClientCampaignStatus(id: string, clientId: string, status: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  const parsed = clientCampaignSchema.shape.status.safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };
  await prisma.clientCampaign.update({ where: { id }, data: { status: parsed.data } });
  path(clientId);
}

export async function deleteClientCampaign(id: string, clientId: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  await prisma.clientCampaign.delete({ where: { id } });
  path(clientId);
}

/* ---------- reports ---------- */

export async function addClientReport(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const parsed = clientReportSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    period: formData.get("period"),
    url: formData.get("url"),
    summary: formData.get("summary"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  if (!(await canAccessClient(user, data.clientId))) return { error: "You don't have access to this client." };

  await prisma.clientReport.create({
    data: {
      clientId: data.clientId,
      title: data.title,
      period: emptyToUndefined(data.period),
      url: data.url,
      summary: emptyToUndefined(data.summary),
    },
  });
  path(data.clientId);
  return { ok: true };
}

export async function deleteClientReport(id: string, clientId: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  await prisma.clientReport.delete({ where: { id } });
  path(clientId);
}

/* ---------- assets (logos, brand files, product photos) ---------- */

export async function addClientAsset(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const parsed = clientAssetSchema.safeParse({
    clientId: formData.get("clientId"),
    kind: formData.get("kind") || "OTHER",
    label: formData.get("label"),
    url: formData.get("url"),
    fileId: formData.get("fileId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  if (!(await canAccessClient(user, data.clientId))) return { error: "You don't have access to this client." };

  await prisma.clientAsset.create({
    data: {
      clientId: data.clientId,
      kind: data.kind,
      label: data.label,
      url: data.url,
      fileId: emptyToUndefined(data.fileId),
      addedByUserId: user.id,
    },
  });
  path(data.clientId);
  return { ok: true };
}

export async function deleteClientAsset(id: string, clientId: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  const existing = await prisma.clientAsset.findUnique({ where: { id }, select: { fileId: true } });
  await prisma.clientAsset.delete({ where: { id } });
  await deleteFileIfAny(existing?.fileId ?? null);
  path(clientId);
}

/* ---------- brand kit ---------- */

export async function saveBrandKit(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const parsed = brandKitSchema.safeParse({
    clientId: formData.get("clientId"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  if (!(await canAccessClient(user, data.clientId))) return { error: "You don't have access to this client." };

  await prisma.clientBrandKit.upsert({
    where: { clientId: data.clientId },
    create: {
      clientId: data.clientId,
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
  path(data.clientId);
  return { ok: true };
}

/* ---------- messages (team side) ---------- */

export async function sendTeamMessage(formData: FormData) {
  const user = await requireUser();
  const parsed = clientMessageSchema.safeParse({ clientId: formData.get("clientId"), body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  if (!(await canAccessClient(user, data.clientId))) return { error: "You don't have access to this client." };

  await prisma.clientMessage.create({
    data: { clientId: data.clientId, body: data.body, senderKind: "TEAM", senderUserId: user.id },
  });
  await prisma.client.update({ where: { id: data.clientId }, data: { portalMessagesReadByTeamAt: new Date() } });
  path(data.clientId);
  return { ok: true };
}

export async function markPortalMessagesReadByTeam(clientId: string) {
  const user = await requireUser();
  if (!(await canAccessClient(user, clientId))) return;
  await prisma.client.update({ where: { id: clientId }, data: { portalMessagesReadByTeamAt: new Date() } });
  path(clientId);
}

/* ---------- documents (agreements, questionnaires…) ---------- */

export async function addClientDocument(formData: FormData) {
  const user = await requirePermission("MANAGE_CLIENTS");
  const parsed = clientDocumentSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    kind: formData.get("kind") || "OTHER",
    url: formData.get("url"),
    fileId: formData.get("fileId") || undefined,
    notes: formData.get("notes"),
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  if (!(await canAccessClient(user, data.clientId))) return { error: "You don't have access to this client." };

  await prisma.clientDocument.create({
    data: {
      clientId: data.clientId,
      title: data.title,
      kind: data.kind,
      url: data.url,
      fileId: emptyToUndefined(data.fileId),
      notes: emptyToUndefined(data.notes),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
  path(data.clientId);
  return { ok: true };
}

export async function setClientDocumentStatus(id: string, clientId: string, status: "PENDING" | "COMPLETED") {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  await prisma.clientDocument.update({
    where: { id },
    data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
  });
  path(clientId);
}

export async function deleteClientDocument(id: string, clientId: string) {
  const user = await requirePermission("MANAGE_CLIENTS");
  if (!(await canAccessClient(user, clientId))) return { error: "You don't have access to this client." };
  const existing = await prisma.clientDocument.findUnique({ where: { id }, select: { fileId: true } });
  await prisma.clientDocument.delete({ where: { id } });
  await deleteFileIfAny(existing?.fileId ?? null);
  path(clientId);
}
