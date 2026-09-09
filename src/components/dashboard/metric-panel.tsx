"use client";

import { useEffect, useState } from "react";

function useCountUp(target: number | null, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === null) return;
    const finalValue = target;
    let raf = 0;
    let start: number | null = null;

    function tick(ts: number) {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(finalValue * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }

    const timeout = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 200);

    return () => {
      clearTimeout(timeout);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return value;
}

function parseCountable(raw: string): { prefix: string; num: number; suffix: string } | null {
  const match = raw.match(/^(\D*)([\d,]+)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const num = parseInt(numStr.replace(/,/g, ""), 10);
  if (Number.isNaN(num)) return null;
  return { prefix, num, suffix };
}

function AnimatedValue({ raw }: { raw: string }) {
  const parsed = parseCountable(raw);
  const count = useCountUp(parsed?.num ?? null);
  if (!parsed) return <>{raw}</>;
  return (
    <>
      {parsed.prefix}
      {count.toLocaleString("en-GB")}
      {parsed.suffix}
    </>
  );
}

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
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.16)] sm:flex-row">
      <div className="flex-1 border-b border-border p-6 sm:border-b-0 sm:border-r">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {heroLabel}
        </p>
        <p className="mt-2 font-mono text-4xl font-semibold tabular-nums tracking-tight text-primary sm:text-5xl">
          <AnimatedValue raw={heroValue} />
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
              <AnimatedValue raw={item.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
