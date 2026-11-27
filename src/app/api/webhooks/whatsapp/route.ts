import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { findClientByWhatsAppPhone } from "@/lib/whatsapp-conversation";
import { sendTeamWhatsAppAlert } from "@/lib/whatsapp-team-alert";
import { notifyTeamOfPortalActivity } from "@/lib/portal-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Constant-time string compare that doesn't leak length/content through timing. */
function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  const len = Math.max(ab.length, bb.length);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
}

/** Verifies Meta's X-Hub-Signature-256 header: HMAC-SHA256 of the raw body, keyed by
 * the app secret, prefixed "sha256=". Must run against the exact raw bytes — parsing
 * JSON first and re-serializing would produce a different signature than Meta sent. */
function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return safeEqual(signatureHeader, expected);
}

/** Meta's one-time webhook verification handshake — run when the webhook URL is first
 * saved (or changed) in the app dashboard's WhatsApp > Configuration page. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expected && safeEqual(token, expected)) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

type WhatsAppInboundMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
};

/** Receives inbound WhatsApp messages and delivery/read status callbacks from Meta.
 * Authenticated by the request signature, not a session — there is no user here. */
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Meta expects a fast 200 regardless of what's inside, and retries (with growing
  // backoff, eventually giving up) on anything else — so processing is wrapped here and
  // never allowed to turn a malformed or unexpected payload shape into a retry storm.
  try {
    await processWebhookPayload(payload);
  } catch (err) {
    console.error("[whatsapp webhook] failed to process payload:", err);
  }
  return NextResponse.json({ ok: true });
}

async function processWebhookPayload(payload: unknown) {
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return;

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = (change as { value?: { messages?: WhatsAppInboundMessage[] } })?.value;
      const messages = value?.messages;
      // Delivery/read status callbacks land in the same webhook shape under
      // value.statuses instead of value.messages — nothing to do with those here.
      if (!Array.isArray(messages)) continue;

      for (const message of messages) {
        if (message.type !== "text" || !message.text?.body) continue; // only plain text handled for now
        await recordInboundMessage(message);
      }
    }
  }
}

async function recordInboundMessage(message: WhatsAppInboundMessage) {
  const client = await findClientByWhatsAppPhone(message.from);
  if (!client) {
    console.warn(`[whatsapp webhook] no client matches inbound number ${message.from} — dropped`);
    return;
  }

  try {
    await prisma.clientMessage.create({
      data: {
        clientId: client.id,
        body: message.text!.body,
        senderKind: "CLIENT",
        channel: "WHATSAPP",
        whatsappMessageId: message.id,
      },
    });
  } catch (err) {
    // Unique constraint on whatsappMessageId — Meta redelivered a message already
    // stored from an earlier attempt. Not an error, just a retry doing its job.
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") return;
    throw err;
  }

  await prisma.client.update({
    where: { id: client.id },
    data: { lastWhatsappInboundAt: new Date(Number(message.timestamp) * 1000) },
  });

  const body = message.text!.body;
  await notifyTeamOfPortalActivity(
    client.id,
    `${client.name} sent a WhatsApp message: "${body.length > 140 ? `${body.slice(0, 140)}…` : body}"`,
  );
  await sendTeamWhatsAppAlert(client.name, "replied to you on WhatsApp", `/clients/${client.id}/portal`);
}
