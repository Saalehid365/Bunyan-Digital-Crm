export function ServiceTypeBadge({ name, colorHex }: { name: string; colorHex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
      {name}
    </span>
  );
}
