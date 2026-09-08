import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <EmptyState
        icon={FileQuestion}
        title="Not found"
        description="This page doesn't exist, or you don't have access to it."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
