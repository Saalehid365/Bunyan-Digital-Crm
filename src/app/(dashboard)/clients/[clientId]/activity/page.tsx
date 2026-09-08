import { notFound } from "next/navigation";
import { requireUser, getClientForUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline } from "@/components/activity/timeline";
import { NoteComposer } from "@/components/activity/note-composer";

export default async function ClientActivityPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await requireUser();
  const { clientId } = await params;
  const client = await getClientForUser(user, clientId);
  if (!client) notFound();

  const activities = await prisma.activity.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Add a note</CardTitle>
        </CardHeader>
        <CardContent>
          <NoteComposer clientId={clientId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Work log</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline
            entries={activities.map((a) => ({
              id: a.id,
              type: a.type,
              message: a.message,
              createdAt: a.createdAt,
              userName: a.user?.name ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
