import { prisma } from "@/lib/prisma";
import { sendPortalNotificationEmail } from "@/lib/email/send-portal-notification";
import { logPortalNotification } from "@/lib/portal-notifications";
import type { PortalNotificationKind } from "@prisma/client";

/**
 * Emails every active portal user for a client (the original contact and any teammates
 * they've added) whenever the team sends them something — a document, a message, a
 * result, a campaign, a report — and logs the same event for the in-app live toast and
 * the Products/Overview nav badges (see portal-notifications.ts). Best-effort: a failed
 * send for one recipient doesn't block the others, and the caller's own action still
 * succeeds even if every email fails — the content is already saved and visible next
 * time they open the portal.
 */
export async function notifyPortalUsersByEmail({
  clientId,
  kind,
  heading,
  body,
  ctaLabel,
  ctaPath,
}: {
  clientId: string;
  kind: PortalNotificationKind;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaPath: string;
}): Promise<void> {
  await logPortalNotification({ clientId, kind, message: body, ctaPath });

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
