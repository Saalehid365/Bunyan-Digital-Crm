import Image from "next/image";
import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { PortalNav } from "@/components/portal/portal-nav";
import { PortalLiveAlerts } from "@/components/portal/portal-live-alerts";
import { getNewPortalNotifications, getPortalNotificationBadges } from "@/lib/portal-notifications";
import { toOnboardingAnswers, isOnboardingComplete } from "@/lib/onboarding";
import mark from "@/components/brand/nabna-mark-light.png";

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const portalUser = await requirePortalUser();

  const [unread, pendingDocuments, client, newNotifications, onboarding] = await Promise.all([
    prisma.clientMessage.count({
      where: {
        clientId: portalUser.clientId,
        senderKind: "TEAM",
        createdAt: { gt: portalUser.messagesReadAt ?? new Date(0) },
      },
    }),
    prisma.clientDocument.count({ where: { clientId: portalUser.clientId, status: "PENDING" } }),
    prisma.client.findUnique({ where: { id: portalUser.clientId }, select: { portalNotificationsReadAt: true } }),
    getNewPortalNotifications(portalUser.clientId),
    prisma.clientOnboardingSubmission.findUnique({ where: { clientId: portalUser.clientId }, select: { answers: true, submittedAt: true } }),
  ]);
  const badges = await getPortalNotificationBadges(portalUser.clientId, client?.portalNotificationsReadAt);
  const onboardingIncomplete = !onboarding?.submittedAt && !isOnboardingComplete(toOnboardingAnswers(onboarding?.answers));

  return (
    <>
      <PortalLiveAlerts initial={newNotifications.items} />
      <div className="flex min-h-screen flex-col">
        <header className="auth-midnight sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
            <div className="flex items-center gap-2.5">
              <Image src={mark} alt="" className="h-6 w-auto" priority />
              <span className="hidden text-sm font-semibold tracking-tight sm:inline">Nabna Tech</span>
            </div>
            <PortalNav
              clientName={portalUser.clientName}
              unreadMessages={unread}
              pendingDocuments={pendingDocuments}
              unreadProducts={badges.PRODUCT ?? 0}
              unreadOverview={badges.OVERVIEW ?? 0}
              onboardingIncomplete={onboardingIncomplete}
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>
      </div>
    </>
  );
}
