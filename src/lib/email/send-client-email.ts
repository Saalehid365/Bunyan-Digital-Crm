import { Resend } from "resend";

export type SendClientEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a one-off email to a client/lead contact on the admin's behalf. Reply-To is set
 * to the sender's own address so replies land in their real inbox, not a noreply address.
 * In local dev (no RESEND_API_KEY) this prints to the console instead of sending, same
 * as the magic-link sign-in flow.
 */
export async function sendClientEmail({
  to,
  subject,
  body,
  replyTo,
}: {
  to: string;
  subject: string;
  body: string;
  replyTo: string;
}): Promise<SendClientEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n📧  Email to ${to} (reply-to ${replyTo}):\nSubject: ${subject}\n\n${body}\n`);
    return { ok: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    replyTo,
    subject,
    html: clientEmailHtml(body),
    text: body,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clientEmailHtml(body: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `
  <div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#f4f4f0;padding:40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #dcded9;border-radius:6px;overflow:hidden;">
            <tr>
              <td style="background:#101c26;padding:24px 32px;">
                <span style="color:#ffffff;font-size:17px;font-weight:600;letter-spacing:0.2px;">Bunyan Digital</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#101c26;font-size:14px;line-height:1.65;">
                ${paragraphs}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}
