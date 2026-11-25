import { prisma } from "@/lib/prisma";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

const CONVERSATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/** WhatsApp only allows a free-form text reply within 24 hours of the customer's own
 * last message — outside that, only an approved template can be sent. */
export function isConversationWindowOpen(lastWhatsappInboundAt: Date | null): boolean {
  if (!lastWhatsappInboundAt) return false;
  return Date.now() - lastWhatsappInboundAt.getTime() < CONVERSATION_WINDOW_MS;
}

/** Matches an inbound webhook's "from" (digits only, as Meta sends it) against every
 * client's contactPhone, normalized the same way. The agency's own client list is small
 * enough that fetching candidates and comparing in memory is simpler than trying to
 * normalize phone formats inside SQL. */
export async function findClientByWhatsAppPhone(fromDigits: string): Promise<{ id: string } | null> {
  const candidates = await prisma.client.findMany({
    where: { contactPhone: { not: null } },
    select: { id: true, contactPhone: true },
  });
  const match = candidates.find((c) => c.contactPhone && normalizePhoneForWhatsApp(c.contactPhone) === fromDigits);
  return match ? { id: match.id } : null;
}
