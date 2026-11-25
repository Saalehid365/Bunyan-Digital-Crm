/** Dashboard page header — eyebrow, serif title, subtitle, then the metric strip below a
 * hairline divider. Matches the plain light header every other top-level page uses
 * (Reports, Clients), just with the metrics attached underneath. */
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
    <section className="relative">
      <div className="rise mx-auto w-full max-w-6xl px-4 pt-6 pb-8 md:px-6 md:pt-8 md:pb-10">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 font-serif text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-foreground">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-[1.02rem] text-muted-foreground">{subtitle}</p>
        <div className="mt-9">{children}</div>
      </div>
    </section>
  );
}
