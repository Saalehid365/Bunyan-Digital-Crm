import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RevenueFinderView, type ApplicationRow } from "@/components/revenue-finder/revenue-finder-view";

export default async function RevenueFinderPage() {
  await requireAdmin();

  const rows = await prisma.revenueFinderApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const applications: ApplicationRow[] = rows.map((a) => ({
    id: a.id,
    createdAt: a.createdAt,
    name: a.name,
    role: a.role,
    email: a.email,
    phone: a.phone,
    storeUrl: a.storeUrl,
    platform: a.platform,
    market: a.market,
    monthlySize: a.monthlySize,
    notes: a.notes,
    decisionMakerOnCall: a.decisionMakerOnCall,
    accessWithin48h: a.accessWithin48h,
    status: a.status,
    internalNotes: a.internalNotes,
    clientId: a.clientId,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Revenue Finder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free 7-Day Revenue Finder applications from the marketing site.
        </p>
      </div>
      <RevenueFinderView applications={applications} />
    </div>
  );
}
