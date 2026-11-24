import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ONBOARDING_SECTIONS } from "@/lib/onboarding-form";
import type { OnboardingAnswers } from "@/lib/onboarding";
import { format } from "date-fns";

export function PortalOnboardingSection({
  answers,
  submittedAt,
}: {
  answers: OnboardingAnswers;
  submittedAt: string | null;
}) {
  const hasAny = Object.values(answers).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v)));
  if (!hasAny) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No onboarding answers yet"
        description="Once the client fills in their store onboarding form, their answers will show here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {submittedAt ? `Submitted ${format(new Date(submittedAt), "d MMM yyyy")}` : "In progress — not yet submitted"}
        </p>
        <Badge className={submittedAt ? "border-0 bg-success/15 text-success" : "border-0 bg-muted text-muted-foreground"}>
          {submittedAt ? "Complete" : "In progress"}
        </Badge>
      </div>
      {ONBOARDING_SECTIONS.map((section) => {
        const rows = section.fields
          .map((f) => ({ field: f, value: answers[f.key] }))
          .filter(({ value }) => (Array.isArray(value) ? value.length > 0 : Boolean(value)));
        if (rows.length === 0) return null;
        return (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map(({ field, value }) => (
                <div key={field.key}>
                  <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                  <p className="mt-0.5 text-sm text-foreground">{Array.isArray(value) ? value.join(", ") : value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
