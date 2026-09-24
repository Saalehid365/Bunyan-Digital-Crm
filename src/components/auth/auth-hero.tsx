"use client";

import { useEffect, useRef } from "react";

/**
 * Sign-in hero: the Arabic wordmark ("bunyan" — to build) as the focal asset, with a blue
 * spotlight that eases toward the pointer. Purely additive: the static first frame is
 * complete on its own, and it stays still under reduced motion or on touch.
 */
export function AuthHero({ size = "hero" }: { size?: "hero" | "band" }) {
  const glyph =
    size === "band"
      ? "text-[min(24vw,14rem)] right-[3%] top-[2%]"
      : "text-[min(46vw,34rem)] right-[-4%] bottom-[6%]";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine) return;

    const rest = { x: 58, y: 48 };
    const cur = { ...rest };
    const target = { ...rest };
    let raf = 0;

    const step = () => {
      cur.x += (target.x - cur.x) * 0.1;
      cur.y += (target.y - cur.y) * 0.1;
      el.style.setProperty("--mx", `${cur.x.toFixed(2)}%`);
      el.style.setProperty("--my", `${cur.y.toFixed(2)}%`);
      raf = Math.abs(target.x - cur.x) > 0.05 || Math.abs(target.y - cur.y) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(step);
    };
    const back = () => {
      target.x = rest.x;
      target.y = rest.y;
      kick();
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = Math.max(-10, Math.min(110, ((e.clientX - r.left) / r.width) * 100));
      target.y = Math.max(-10, Math.min(110, ((e.clientY - r.top) / r.height) * 100));
      kick();
    };
    const hidden = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else back();
    };

    const host = el.parentElement ?? el;
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", back);
    window.addEventListener("blur", back);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", back);
      window.removeEventListener("blur", back);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      lang="ar"
      dir="rtl"
      className="pointer-events-none absolute inset-0 select-none [--mx:58%] [--my:48%]"
    >
      <span className={`absolute block font-[family-name:var(--font-arabic)] leading-none font-bold text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.16)] ${glyph}`}>
        بنيان
      </span>
      <span
        className={`absolute block font-[family-name:var(--font-arabic)] leading-none font-bold text-[#2323ff] [mask-image:radial-gradient(circle_clamp(160px,20vw,320px)_at_var(--mx)_var(--my),#000_0%,transparent_100%)] ${glyph}`}
      >
        بنيان
      </span>
    </div>
  );
}
