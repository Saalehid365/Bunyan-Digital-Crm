import { Resend } from "resend";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * A generic "something new is in your portal" email — used for a new document, message,
 * result, campaign or report. In local dev (no RESEND_API_KEY) this prints to the
 * console instead of sending, same as every other email in this app.
 */
export async function sendPortalNotificationEmail({
  to,
  name,
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  to: string;
  name: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n📧  Portal notification for ${to}:\n${heading}\n${body}\n${ctaLabel}: ${ctaUrl}\n`);
    return { ok: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject: heading,
    html: notificationHtml({ name, heading, body, ctaLabel, ctaUrl }),
    text: `${body}\n\n${ctaLabel}: ${ctaUrl}`,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function notificationHtml({
  name,
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  name: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return `
  <div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#0a0e17;padding:40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#131a29;border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.1);">
                <span style="color:#f2f4f8;font-size:18px;font-weight:700;letter-spacing:-0.01em;">Bunyan Digital</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 4px;color:#6e7dff;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(heading)}</p>
                <p style="margin:0 0 8px;color:#f2f4f8;font-size:20px;font-weight:700;">Hi ${escapeHtml(name)},</p>
                <p style="margin:0 0 24px;color:#98a1b3;font-size:14px;line-height:1.6;">${escapeHtml(body)}</p>
                <a href="${ctaUrl}" style="display:inline-block;background:#3347ff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">${escapeHtml(ctaLabel)}</a>
                <p style="margin:24px 0 0;color:#6b7280;font-size:12px;line-height:1.6;">You're receiving this because you have access to this client's portal.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}
