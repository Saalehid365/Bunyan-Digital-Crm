import { prisma } from "@/lib/prisma";
import { sendPortalNotificationEmail } from "@/lib/email/send-portal-notification";

/**
 * Emails every active portal user for a client (the original contact and any teammates
 * they've added) whenever the team sends them something — a document, a message, a
 * result, a campaign, a report. Best-effort: a failed send for one recipient doesn't
 * block the others, and the caller's own action still succeeds even if every email
 * fails — the content is already saved and visible next time they open the portal.
 */
export async function notifyPortalUsersByEmail({
  clientId,
  heading,
  body,
  ctaLabel,
  ctaPath,
}: {
  clientId: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaPath: string;
}): Promise<void> {
  const recipients = await prisma.clientPortalUser.findMany({
    where: { clientId, disabledAt: null },
    select: { name: true, email: true },
  });
  if (recipients.length === 0) return;

  const ctaUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}${ctaPath}`;
  await Promise.all(
    recipients.map((r) =>
      sendPortalNotificationEmail({ to: r.email, name: r.name, heading, body, ctaLabel, ctaUrl }).catch(() => {}),
    ),
  );
}
