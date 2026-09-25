import { prisma } from "@/lib/prisma";

export type NewApplication = {
  id: string;
  name: string;
  storeUrl: string;
  createdAt: string;
};

export type NewApplications = { count: number; items: NewApplication[] };

/** Un-triaged (status NEW) Revenue Finder applications — the count plus the newest few for the alerts bell. */
export async function getNewApplications(): Promise<NewApplications> {
  const [count, rows] = await Promise.all([
    prisma.revenueFinderApplication.count({ where: { status: "NEW" } }),
    prisma.revenueFinderApplication.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, storeUrl: true, createdAt: true },
    }),
  ]);
  return {
    count,
    items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  };
}
