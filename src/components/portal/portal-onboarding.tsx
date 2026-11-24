"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ONBOARDING_SECTIONS, type OnboardingField } from "@/lib/onboarding-form";
import type { OnboardingAnswers } from "@/lib/onboarding";
import { saveOnboardingSection } from "@/server/actions/portal-actions";

type ActionState = { error?: string; ok?: boolean; answers?: OnboardingAnswers; submitted?: boolean };
const initial: ActionState = {};

function FieldControl({ field, value }: { field: OnboardingField; value: string | string[] | undefined }) {
  switch (field.type) {
    case "short":
      return <Input id={field.key} name={field.key} defaultValue={typeof value === "string" ? value : ""} />;
    case "date":
      return <Input id={field.key} name={field.key} type="date" defaultValue={typeof value === "string" ? value : ""} />;
    case "paragraph":
      return <Textarea id={field.key} name={field.key} rows={3} defaultValue={typeof value === "string" ? value : ""} />;
    case "single": {
      const current = typeof value === "string" ? value : undefined;
      const isCustom = Boolean(field.otherOption && current && !field.options?.includes(current));
      return (
        <div className="space-y-2">
          <Select name={field.key} defaultValue={isCustom ? undefined : current}>
            <SelectTrigger id={field.key} className="w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.otherOption ? (
            <Input name={`${field.key}__other`} placeholder="Or type your own" defaultValue={isCustom ? current : ""} />
          ) : null}
        </div>
      );
    }
    case "multi": {
      const selected = Array.isArray(value) ? value : [];
      const knownOptions = field.options ?? [];
      const customValue = field.otherOption ? selected.find((v) => !knownOptions.includes(v)) : undefined;
      return (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {knownOptions.map((o) => (
              <Label key={o} className="group/field flex items-center gap-2 text-sm font-normal">
                <Checkbox name={field.key} value={o} defaultChecked={selected.includes(o)} />
                {o}
              </Label>
            ))}
          </div>
          {field.otherOption ? (
            <Input name={`${field.key}__other`} placeholder="Other — type your own" defaultValue={customValue ?? ""} />
          ) : null}
        </div>
      );
    }
  }
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-primary" : i < current ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"}`}
        />
      ))}
    </div>
  );
}

export function PortalOnboarding({
  initialAnswers,
  initialSubmitted,
}: {
  initialAnswers: OnboardingAnswers;
  initialSubmitted: boolean;
}) {
  const totalSections = ONBOARDING_SECTIONS.length;
  const [answers, setAnswers] = useState(initialAnswers);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  // Resume on the first section with a missing required answer, so a returning client
  // doesn't have to click back through what they've already done.
  const [sectionIndex, setSectionIndex] = useState(() => {
    if (initialSubmitted) return 0;
    for (let i = 0; i < totalSections; i++) {
      const missing = ONBOARDING_SECTIONS[i].fields.some((f) => {
        if (!f.required) return false;
        const v = initialAnswers[f.key];
        return Array.isArray(v) ? v.length === 0 : !v;
      });
      if (missing) return i;
    }
    return totalSections - 1;
  });
  const isFinal = sectionIndex === totalSections - 1;

  const [state, formAction, pending] = useActionState(async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
    const result = await saveOnboardingSection(sectionIndex, formData, isFinal);
    if (result?.answers) setAnswers(result.answers);
    if (result?.submitted) setSubmitted(true);
    else if (result?.ok) setSectionIndex((i) => Math.min(i + 1, totalSections - 1));
    return result ?? {};
  }, initial);

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <div>
            <p className="font-serif text-xl font-semibold text-foreground">You&apos;re all set</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Thanks — we&apos;ve got everything we need to get started. If you have your logo, product photos or product
              details ready, send them over on the Documents or Products tab.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const section = ONBOARDING_SECTIONS[sectionIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Section {sectionIndex + 1} of {totalSections}
        </p>
        <ProgressDots total={totalSections} current={sectionIndex} />
      </div>
      <Card>
        <CardContent>
          <form key={sectionIndex} action={formAction} className="space-y-5">
            <h2 className="font-serif text-lg font-semibold text-foreground">{section.title}</h2>
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                <FieldControl field={field} value={answers[field.key]} />
              </div>
            ))}

            {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={sectionIndex === 0}
                onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : isFinal ? "Submit" : "Next"}
                {!isFinal ? <ChevronRight className="h-3.5 w-3.5" /> : null}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
