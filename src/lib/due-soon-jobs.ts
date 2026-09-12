import { prisma } from "@/lib/prisma";

export type DueSoonJob = {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  dueDate: string;
  overdue: boolean;
};

const LOOKAHEAD_DAYS = 3;

/** Open jobs (not Done) that are overdue or due within the next few days —
 * scoped to clientIds for a MEMBER, or every client when undefined (admin). */
export async function getDueSoonJobs(clientIds: string[] | undefined): Promise<DueSoonJob[]> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const cutoff = new Date(startOfToday);
  cutoff.setDate(cutoff.getDate() + LOOKAHEAD_DAYS);
  cutoff.setHours(23, 59, 59, 999);

  const jobs = await prisma.job.findMany({
    where: {
      stage: { not: "DONE" },
      dueDate: { lte: cutoff },
      // Once the assignee has acknowledged the job, it drops off this alert — the
      // deadline itself is still visible everywhere else (table, board), this bell
      // is specifically for things that still need someone's attention.
      OR: [{ assignedToId: null }, { assignmentAckedAt: null }],
      ...(clientIds ? { clientId: { in: clientIds } } : {}),
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      clientId: true,
      client: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return jobs
    .filter((j): j is typeof j & { dueDate: Date } => j.dueDate !== null)
    .map((j) => ({
      id: j.id,
      title: j.title,
      clientId: j.clientId,
      clientName: j.client.name,
      dueDate: j.dueDate.toISOString(),
      overdue: j.dueDate < startOfToday,
    }));
}
