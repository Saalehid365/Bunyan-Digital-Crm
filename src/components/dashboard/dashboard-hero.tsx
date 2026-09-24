import { AuthHero } from "@/components/auth/auth-hero";

/** Dark hero band — the CRM's take on the marketing site's page hero: blueprint grid,
 * blue glow, mono eyebrow, oversized display title and the Arabic wordmark. */
export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dark relative overflow-hidden bg-[#05081a] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_85%_0%,rgba(35,35,255,0.34),transparent_60%),radial-gradient(60%_60%_at_5%_100%,rgba(116,128,255,0.14),transparent_60%)]"
      />
      <div
        aria-hidden
        className="blueprint pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_100%)]"
      />
      <AuthHero size="band" />
      <div className="rise relative mx-auto w-full max-w-6xl px-4 pt-9 pb-8 md:px-6 md:pt-12 md:pb-10">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 font-serif text-[clamp(2.6rem,6.4vw,5.2rem)] leading-[0.94] font-semibold tracking-[-0.045em] text-white">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-[1.02rem] text-white/60">{subtitle}</p>
        <div className="mt-9">{children}</div>
      </div>
    </section>
  );
}
