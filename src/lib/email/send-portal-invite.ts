import { Resend } from "resend";

export type SendPortalInviteResult = { ok: true } | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends a new client-portal teammate their sign-in details. In local dev (no
 * RESEND_API_KEY) this prints to the console instead of sending, same as every other
 * email in this app — see send-verification.ts / send-client-email.ts.
 */
export async function sendPortalInviteEmail({
  to,
  name,
  inviterName,
  clientName,
  password,
  portalUrl,
}: {
  to: string;
  name: string;
  inviterName: string;
  clientName: string;
  password: string;
  portalUrl: string;
}): Promise<SendPortalInviteResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n📧  Portal invite for ${to} (${name}):\nSign in: ${portalUrl}\nPassword: ${password}\n`);
    return { ok: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject: `${inviterName} added you to the ${clientName} portal`,
    html: inviteHtml({ to, name, inviterName, clientName, password, portalUrl }),
    text: `${inviterName} has given you access to the ${clientName} client portal on Bunyan Digital.\n\nSign in: ${portalUrl}\nEmail: ${to}\nPassword: ${password}\n\nYou can see results, campaigns, reports, documents and messages, and reply to the team.`,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function inviteHtml({
  to,
  name,
  inviterName,
  clientName,
  password,
  portalUrl,
}: {
  to: string;
  name: string;
  inviterName: string;
  clientName: string;
  password: string;
  portalUrl: string;
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
                <p style="margin:0 0 8px;color:#f2f4f8;font-size:20px;font-weight:700;">You're in, ${escapeHtml(name)}.</p>
                <p style="margin:0 0 24px;color:#98a1b3;font-size:14px;line-height:1.6;">
                  ${escapeHtml(inviterName)} gave you access to the ${escapeHtml(clientName)} client portal — results,
                  campaigns, reports, documents and messages with the team, all in one place.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#0e1420;border:1px solid rgba(255,255,255,0.1);border-radius:8px;margin:0 0 24px;">
                  <tr><td style="padding:14px 16px;color:#98a1b3;font-size:12px;">Email<br/><span style="color:#f2f4f8;font-size:14px;">${escapeHtml(to)}</span></td></tr>
                </table>
                <a href="${portalUrl}" style="display:inline-block;background:#3347ff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">Sign in</a>
                <p style="margin:24px 0 0;color:#98a1b3;font-size:12px;line-height:1.6;">Your temporary password: <strong style="color:#f2f4f8;">${escapeHtml(password)}</strong></p>
                <p style="margin:8px 0 0;color:#6b7280;font-size:12px;line-height:1.6;">If you weren't expecting this, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

