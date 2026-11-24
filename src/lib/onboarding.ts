import { ONBOARDING_SECTIONS, type OnboardingField } from "@/lib/onboarding-form";

export type OnboardingAnswers = Record<string, string | string[] | undefined>;

/** Reads one wizard section's worth of fields off formData. An "Other" option is a
 * second, plain `${key}__other` text input (not a sentinel checkbox value) — simpler to
 * build and to read, and typing an actual answer there is always more useful than a
 * generic "Other" tick. */
export function readSectionAnswers(formData: FormData, sectionIndex: number): OnboardingAnswers {
  const section = ONBOARDING_SECTIONS[sectionIndex];
  const answers: OnboardingAnswers = {};
  for (const field of section.fields) {
    if (field.type === "multi") {
      const values = formData.getAll(field.key).map(String).filter(Boolean);
      if (field.otherOption) {
        const otherText = String(formData.get(`${field.key}__other`) ?? "").trim();
        if (otherText) values.push(otherText);
      }
      answers[field.key] = values;
    } else if (field.otherOption) {
      const selected = String(formData.get(field.key) ?? "").trim();
      const otherText = String(formData.get(`${field.key}__other`) ?? "").trim();
      answers[field.key] = otherText || selected || undefined;
    } else {
      const raw = String(formData.get(field.key) ?? "").trim();
      answers[field.key] = raw || undefined;
    }
  }
  return answers;
}

function isFieldFilled(field: OnboardingField, answers: OnboardingAnswers): boolean {
  const v = answers[field.key];
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
}

export function missingRequiredFields(sectionIndex: number, answers: OnboardingAnswers): OnboardingField[] {
  return ONBOARDING_SECTIONS[sectionIndex].fields.filter((f) => f.required && !isFieldFilled(f, answers));
}

export function isSectionComplete(sectionIndex: number, answers: OnboardingAnswers): boolean {
  return missingRequiredFields(sectionIndex, answers).length === 0;
}

export function isOnboardingComplete(answers: OnboardingAnswers): boolean {
  return ONBOARDING_SECTIONS.every((_, i) => isSectionComplete(i, answers));
}

export function toOnboardingAnswers(value: unknown): OnboardingAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as OnboardingAnswers;
}
