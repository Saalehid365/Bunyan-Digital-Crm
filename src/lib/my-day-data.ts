import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { fetchUpcomingCalendlyMeetings, type CalendlyMeeting } from "@/lib/calendly";

export type MyDayJob = {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
};

/** This user's open jobs (not Done), soonest due date first — for the My Day "your open jobs" widget. */
export async function getMyOpenJobs(userId: string): Promise<MyDayJob[]> {
  const jobs = await prisma.job.findMany({
    where: { assignedToId: userId, stage: { not: "DONE" } },
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      clientId: true,
      client: { select: { name: true } },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });

  return jobs.map((j) => ({
    id: j.id,
    title: j.title,
    clientId: j.clientId,
    clientName: j.client.name,
    dueDate: j.dueDate ? j.dueDate.toISOString() : null,
    priority: j.priority,
  }));
}

export type MyDayCalendly =
  | { connected: false }
  | { connected: true; name: string | null; error: string; meetings: [] }
  | { connected: true; name: string | null; error?: undefined; meetings: CalendlyMeeting[] };

/** This user's upcoming Calendly meetings, decrypting their stored token on demand.
 * Degrades gracefully — a Calendly outage never breaks the My Day page. */
export async function getMyDayCalendly(userId: string): Promise<MyDayCalendly> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { calendlyTokenCipher: true, calendlyUserUri: true, calendlyName: true },
  });

  if (!user?.calendlyTokenCipher || !user.calendlyUserUri) return { connected: false };

  let token: string;
  try {
    token = decryptSecret(user.calendlyTokenCipher);
  } catch {
    return { connected: true, name: user.calendlyName, error: "Couldn't read the stored Calendly token.", meetings: [] };
  }

  const result = await fetchUpcomingCalendlyMeetings(token, user.calendlyUserUri);
  if (!result.ok) return { connected: true, name: user.calendlyName, error: result.error, meetings: [] };
  return { connected: true, name: user.calendlyName, meetings: result.data };
}
