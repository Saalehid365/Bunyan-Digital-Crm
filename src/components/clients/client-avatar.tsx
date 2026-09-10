import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-[var(--chart-1)]/15 text-[var(--chart-1)]",
  "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  "bg-[var(--chart-3)]/15 text-[var(--chart-3)]",
  "bg-[var(--chart-4)]/15 text-[var(--chart-4)]",
  "bg-[var(--chart-5)]/15 text-[var(--chart-5)]",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Deterministic colored initial avatar for a client, so the same client always gets the same color. */
export function ClientAvatar({ name, className }: { name: string; className?: string }) {
  const palette = PALETTE[hashString(name) % PALETTE.length];
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        palette,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
