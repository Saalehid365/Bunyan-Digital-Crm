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
    <div className="grid gap-8 border-t border-white/15 pt-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:gap-12">
      <div>
        <p className="font-mono text-[0.7rem] tracking-[0.14em] text-white/55 uppercase">{heroLabel}</p>
        <p className="mt-3 font-serif text-6xl leading-none font-semibold tracking-[-0.05em] text-white sm:text-7xl">
          <AnimatedValue raw={heroValue} />
        </p>
        {heroSublabel ? <p className="mt-3 text-sm text-white/60">{heroSublabel}</p> : null}
      </div>
      <dl
        className="grid grid-cols-2 self-end sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": ledger.length } as React.CSSProperties}
      >
        {ledger.map((item, i) => (
          <div
            key={item.label}
            className={`flex flex-col-reverse justify-end border-l border-white/15 py-2 pl-5 ${i === 0 ? "sm:border-l-0 sm:pl-0" : ""} ${i % 2 === 0 ? "border-l-0 pl-0 sm:border-l" : ""}`}
          >
            <dt className="mt-2 font-mono text-[0.66rem] tracking-[0.12em] text-white/55 uppercase">{item.label}</dt>
            <dd className="font-serif text-4xl font-semibold tracking-[-0.04em] tabular-nums text-white sm:text-5xl">
              <AnimatedValue raw={item.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
