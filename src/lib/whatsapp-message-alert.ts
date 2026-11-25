import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp";

const COOLDOWN_MS = 30 * 60 * 1000;
const TEMPLATE_NAME = "portal_message_alert";

/**
 * Notifies the client over WhatsApp that the team sent them a portal message, using the
 * approved `portal_message_alert` template ({{1}} first name, {{2}} portal login URL).
 * Gated on contactPhone + whatsappOptIn, rate-limited to one per client per 30 minutes,
 * and entirely best-effort — any failure is logged and swallowed here so it can never
 * break the caller's own message send.
 */
export async function sendPortalMessageWhatsAppAlert(clientId: string): Promise<void> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true, contactName: true, contactPhone: true, whatsappOptIn: true, lastWhatsappAlertAt: true },
    });
    if (!client || !client.whatsappOptIn || !client.contactPhone) return;

    const now = new Date();
    if (client.lastWhatsappAlertAt && now.getTime() - client.lastWhatsappAlertAt.getTime() < COOLDOWN_MS) {
      return;
    }

    const firstName = (client.contactName || client.name).trim().split(/\s+/)[0] || "there";
    const portalUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/portal/login`;

    const result = await sendWhatsAppTemplateMessage({
      to: client.contactPhone,
      templateName: TEMPLATE_NAME,
      variables: [firstName, portalUrl],
    });

    if (!result.ok) {
      console.error(`[whatsapp] portal_message_alert failed for client ${clientId}: ${result.error}`);
      return;
    }

    // Only stamped once we actually get this far — marks "the client was just alerted",
    // which is what the cooldown check above compares against next time.
    await prisma.client.update({ where: { id: clientId }, data: { lastWhatsappAlertAt: now } });
  } catch (err) {
    console.error(`[whatsapp] portal_message_alert threw for client ${clientId}:`, err);
  }
}
