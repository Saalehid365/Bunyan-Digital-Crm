import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { PortalOverview } from "@/components/portal/portal-overview";

export default async function PortalOverviewPage() {
  const portalUser = await requirePortalUser();

  const [results, campaigns, reports] = await Promise.all([
    prisma.clientResult.findMany({
      where: { clientId: portalUser.clientId },
      orderBy: [{ period: "desc" }, { position: "asc" }],
    }),
    prisma.clientCampaign.findMany({ where: { clientId: portalUser.clientId }, orderBy: { createdAt: "desc" } }),
    prisma.clientReport.findMany({ where: { clientId: portalUser.clientId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back{portalUser.name ? `, ${portalUser.name.split(" ")[0]}` : ""}.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Results, campaigns and reports for {portalUser.clientName}.</p>
      </div>
      <PortalOverview
        results={results.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        campaigns={campaigns.map((c) => ({
          ...c,
          startDate: c.startDate?.toISOString() ?? null,
          endDate: c.endDate?.toISOString() ?? null,
          spend: c.spend ? Number(c.spend) : null,
          revenue: c.revenue ? Number(c.revenue) : null,
          roas: c.roas ? Number(c.roas) : null,
        }))}
        reports={reports.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      />
    </div>
  );
}
