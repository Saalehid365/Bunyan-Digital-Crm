import { prisma } from "@/lib/prisma";

export type StaleLead = {
  id: string;
  name: string;
  companyName: string | null;
  daysSinceLastTouch: number;
  tier: 5 | 7 | 10;
};

export async function getStaleLeads(): Promise<StaleLead[]> {
  const leads = await prisma.client.findMany({
    where: { status: "LEAD" },
    select: { id: true, name: true, companyName: true, createdAt: true },
  });
  if (leads.length === 0) return [];

  const lastActivity = await prisma.activity.groupBy({
    by: ["clientId"],
    where: { clientId: { in: leads.map((l) => l.id) } },
    _max: { createdAt: true },
  });
  const lastTouchMap = new Map(lastActivity.map((a) => [a.clientId, a._max.createdAt]));

  const now = Date.now();
  return leads
    .map((lead) => {
      const lastTouch = lastTouchMap.get(lead.id) ?? lead.createdAt;
      const days = Math.floor((now - lastTouch.getTime()) / 86_400_000);
      const tier = days >= 10 ? 10 : days >= 7 ? 7 : days >= 5 ? 5 : null;
      return tier
        ? { id: lead.id, name: lead.name, companyName: lead.companyName, daysSinceLastTouch: days, tier }
        : null;
    })
    .filter((x): x is StaleLead => x !== null)
    .sort((a, b) => b.daysSinceLastTouch - a.daysSinceLastTouch);
}
