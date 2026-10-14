import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { PortalBrandView } from "@/components/portal/portal-brand-view";

export default async function PortalBrandPage() {
  const portalUser = await requirePortalUser();

  const [brandKit, assets, accessEntries] = await Promise.all([
    prisma.clientBrandKit.findUnique({ where: { clientId: portalUser.clientId } }),
    prisma.clientAsset.findMany({ where: { clientId: portalUser.clientId }, orderBy: { createdAt: "desc" } }),
    prisma.clientAccess.findMany({
      where: { clientId: portalUser.clientId },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true, username: true, url: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand &amp; access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your theme colours, logos and other brand files, and any account logins the team needs.
        </p>
      </div>
      <PortalBrandView
        brandKit={
          brandKit
            ? {
                primaryColor: brandKit.primaryColor,
                secondaryColor: brandKit.secondaryColor,
                accentColor: brandKit.accentColor,
                notes: brandKit.notes,
              }
            : null
        }
        assets={assets.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        accessEntries={accessEntries.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
      />
    </div>
  );
}
