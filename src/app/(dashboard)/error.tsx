"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="An unexpected error occurred loading this page."
        action={
          <Button size="sm" onClick={() => reset()}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
