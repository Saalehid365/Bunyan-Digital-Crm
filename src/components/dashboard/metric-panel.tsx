export function MetricPanel({
  heroLabel,
  heroValue,
  heroSublabel,
  ledger,
}: {
  heroLabel: string;
  heroValue: string;
  heroSublabel?: string;
  ledger: { label: string; value: string }[];
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card sm:flex-row">
      <div className="flex-1 border-b border-border p-6 sm:border-b-0 sm:border-r">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {heroLabel}
        </p>
        <p className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-5xl">
          {heroValue}
        </p>
        {heroSublabel ? (
          <p className="mt-2 text-sm text-muted-foreground">{heroSublabel}</p>
        ) : null}
      </div>
      <dl className="grid flex-1 grid-cols-2 divide-x divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
        {ledger.map((item) => (
          <div key={item.label} className="flex flex-col justify-center px-6 py-4">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
