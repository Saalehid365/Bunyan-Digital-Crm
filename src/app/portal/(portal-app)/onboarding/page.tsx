import { requirePortalUser } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { toOnboardingAnswers } from "@/lib/onboarding";
import { PortalOnboarding } from "@/components/portal/portal-onboarding";

export default async function PortalOnboardingPage() {
  const portalUser = await requirePortalUser();

  const submission = await prisma.clientOnboardingSubmission.findUnique({
    where: { clientId: portalUser.clientId },
    select: { answers: true, submittedAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store onboarding</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A few questions so we can build a store that fits {portalUser.clientName}.
        </p>
      </div>
      <PortalOnboarding
        initialAnswers={toOnboardingAnswers(submission?.answers)}
        initialSubmitted={Boolean(submission?.submittedAt)}
      />
    </div>
  );
}
