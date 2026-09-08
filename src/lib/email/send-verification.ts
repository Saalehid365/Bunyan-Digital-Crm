import { Resend } from "resend";

type SendVerificationRequestParams = {
  identifier: string;
  url: string;
  provider: { from?: string };
};

export async function sendVerificationRequest({
  identifier,
  url,
  provider,
}: SendVerificationRequestParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n📧  Magic sign-in link for ${identifier}:\n${url}\n`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: provider.from ?? process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: identifier,
    subject: "Sign in to Bunyan Digital CRM",
    html: magicLinkEmailHtml(url),
    text: `Sign in to Bunyan Digital CRM: ${url}`,
  });

  if (error) {
    throw new Error(`Resend failed to send verification email: ${error.message}`);
  }
}

function magicLinkEmailHtml(url: string) {
  return `
  <div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#EEF0F1;padding:40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #D7DEE3;border-radius:6px;overflow:hidden;">
            <tr>
              <td style="background:#132C4F;padding:28px 32px;">
                <span style="color:#F4F8FB;font-size:18px;font-weight:600;letter-spacing:0.2px;">Bunyan Digital</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;color:#132C4F;font-size:20px;font-weight:600;">Sign in to your CRM</p>
                <p style="margin:0 0 24px;color:#5B6B7A;font-size:14px;line-height:1.6;">Click the button below to sign in. This link expires in 24 hours and can only be used once.</p>
                <a href="${url}" style="display:inline-block;background:#C1622B;color:#FDF8F4;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:4px;">Sign in</a>
                <p style="margin:24px 0 0;color:#8A97A3;font-size:12px;line-height:1.6;">If you didn't request this email, you can safely ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}
