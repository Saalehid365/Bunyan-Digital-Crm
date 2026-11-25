import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp";

const TEMPLATE_NAME = "team_activity_alert";

/**
 * Alerts the team's own WhatsApp number (TEAM_WHATSAPP_NOTIFY_NUMBER) when a client sends
 * a message or completes/uploads a document — using the approved `team_activity_alert`
 * template ({{1}} client name, {{2}} what happened, {{3}} link to that client's CRM page).
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
      variables: [clientName, eventText, ctaUrl],
    });
    if (!result.ok) console.error(`[whatsapp] team_activity_alert failed: ${result.error}`);
  } catch (err) {
    console.error("[whatsapp] team_activity_alert threw:", err);
  }
}
