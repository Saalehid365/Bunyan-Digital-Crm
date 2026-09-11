"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acknowledgeJobAssignment } from "@/server/actions/jobs";

export function AcknowledgeAssignmentBanner({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-chart-4/10 px-6 py-3">
      <p className="text-sm text-foreground">
        <span className="font-medium">You&apos;ve been assigned this job.</span> Acknowledge it so it
        shows as seen.
      </p>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acknowledgeJobAssignment(jobId);
            if (result?.error) toast.error(result.error);
            else toast.success("Assignment acknowledged");
          })
        }
      >
        <CheckCheck className="h-3.5 w-3.5" />
        {pending ? "Acknowledging…" : "Acknowledge"}
      </Button>
    </div>
  );
}
