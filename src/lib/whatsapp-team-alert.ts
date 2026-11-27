import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp";

const TEMPLATE_NAME = "team_activity_alert";
// This template was approved under plain "English" (code "en"), not "English (UK)"
// (en_GB) like portal_message_alert — so it needs its own explicit language code rather
// than following WHATSAPP_TEMPLATE_LANGUAGE.
const TEMPLATE_LANGUAGE = "en";

/**
 * Alerts the team's own WhatsApp number (TEAM_WHATSAPP_NOTIFY_NUMBER) when a client sends
 * a message or completes/uploads a document — using the approved `team_activity_alert`
 * template. TEMPORARY: the currently-approved body only has one placeholder ("New
 * activity from {{1}}:. View it here:"), so everything is packed into {{1}} just to
 * prove the send pipeline works end to end — once the 2-variable body ("New activity —
 * {{1}}. View it here: {{2}}.") is approved, switch back to passing [combined, ctaUrl].
 * Always sent as a template since there's no 24h conversation window to rely on here.
 * Best-effort: logged and swallowed so it can never break the caller's own action.
 */
export async function sendTeamWhatsAppAlert(clientName: string, eventText: string, ctaPath: string): Promise<void> {
  try {
    const to = process.env.TEAM_WHATSAPP_NOTIFY_NUMBER;
    if (!to) return;

    const ctaUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}${ctaPath}`;
    const result = await sendWhatsAppTemplateMessage({
      to,
      templateName: TEMPLATE_NAME,
      languageCode: TEMPLATE_LANGUAGE,
      variables: [`${clientName}: ${eventText} — ${ctaUrl}`],
    });
    if (!result.ok) console.error(`[whatsapp] team_activity_alert failed: ${result.error}`);
  } catch (err) {
    console.error("[whatsapp] team_activity_alert threw:", err);
  }
}
