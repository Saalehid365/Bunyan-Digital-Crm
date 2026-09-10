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
    <div className="grid gap-4 sm:grid-cols-5">
      <div className="rounded-[var(--radius-lg)] bg-primary p-6 text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_-12px_rgba(16,28,38,0.4)] sm:col-span-3">
        <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground/55">
          {heroLabel}
        </p>
        <p className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          <AnimatedValue raw={heroValue} />
        </p>
        {heroSublabel ? (
          <p className="mt-2 text-sm text-primary-foreground/70">{heroSublabel}</p>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:col-span-2">
        {ledger.map((item) => (
          <div
            key={item.label}
            className="flex flex-col justify-center rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_24px_-16px_rgba(16,28,38,0.16)]"
          >
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
