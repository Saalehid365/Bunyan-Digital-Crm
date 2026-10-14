import Image from "next/image";
import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { PortalNav } from "@/components/portal/portal-nav";
import mark from "@/components/brand/bd-mark-light.png";

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const portalUser = await requirePortalUser();

  const [unread, pendingDocuments] = await Promise.all([
    prisma.clientMessage.count({
      where: {
        clientId: portalUser.clientId,
        senderKind: "TEAM",
        createdAt: { gt: portalUser.messagesReadAt ?? new Date(0) },
      },
    }),
    prisma.clientDocument.count({ where: { clientId: portalUser.clientId, status: "PENDING" } }),
  ]);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="auth-midnight flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0e17]/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
            <div className="flex items-center gap-2.5">
              <Image src={mark} alt="" className="h-6 w-auto" priority />
              <span className="hidden text-sm font-semibold tracking-tight sm:inline">Bunyan Digital</span>
            </div>
            <PortalNav clientName={portalUser.clientName} unreadMessages={unread} pendingDocuments={pendingDocuments} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>
      </div>
    </>
  );
}
