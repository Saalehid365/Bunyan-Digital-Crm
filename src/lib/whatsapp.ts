// WhatsApp Cloud API (Meta) template sender. The access token and phone number id are
// server-only env vars (WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID) — never
// read on the client, same as every other secret in this app.

export type SendWhatsAppResult = { ok: true } | { ok: false; error: string };

const GRAPH_API_VERSION = "v21.0";

/**
 * UK-first normalizer for WhatsApp's "to" field, which wants digits only, no leading
 * "+" (country code included). A leading 0 is assumed to be a UK trunk prefix — adjust
 * here first if contact numbers start covering other markets.
 */
export function normalizePhoneForWhatsApp(raw: string): string | null {
  const trimmed = raw.replace(/[^\d+]/g, "");
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) return trimmed.slice(1);
  if (trimmed.startsWith("00")) return trimmed.slice(2);
  if (trimmed.startsWith("0")) return `44${trimmed.slice(1)}`;
  return trimmed;
}

/** Posts a single message payload to the Graph API's /messages endpoint — shared by the
 * template and free-form text senders below. */
async function postMessage(payload: Record<string, unknown>): Promise<SendWhatsAppResult> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`\n📱 WhatsApp send (dev, not actually sent): ${JSON.stringify(payload)}\n`);
    return { ok: true };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `WhatsApp API ${res.status}: ${body.slice(0, 500)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error calling WhatsApp API" };
  }
}

/**
 * Sends an approved WhatsApp template message — the only kind WhatsApp allows outside
 * the 24-hour conversation window (see sendWhatsAppTextMessage for inside it). In local
 * dev (no WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID) this logs to the console
 * instead of calling the real API, same pattern as every email helper in this app.
 */
export async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  languageCode,
  variables,
}: {
  to: string;
  templateName: string;
  languageCode?: string;
  variables: string[];
}): Promise<SendWhatsAppResult> {
  const normalized = normalizePhoneForWhatsApp(to);
  if (!normalized) return { ok: false, error: `Invalid phone number: "${to}"` };
  const language = languageCode ?? process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US";

  return postMessage({
    to: normalized,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: [{ type: "body", parameters: variables.map((text) => ({ type: "text", text })) }],
    },
  });
}

/**
 * Sends a free-form WhatsApp text — only valid within 24 hours of the recipient's own
 * last message to us (WhatsApp rejects it otherwise). Callers must check that window
 * themselves (see src/lib/whatsapp-conversation.ts) before reaching for this instead of
 * the template sender above.
 */
export async function sendWhatsAppTextMessage({ to, body }: { to: string; body: string }): Promise<SendWhatsAppResult> {
  const normalized = normalizePhoneForWhatsApp(to);
  if (!normalized) return { ok: false, error: `Invalid phone number: "${to}"` };

  return postMessage({ to: normalized, type: "text", text: { body, preview_url: true } });
}
