import { AuthHero } from "@/components/auth/auth-hero";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen flex-1 bg-background lg:grid-cols-[1.15fr_0.85fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#05081a] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_82%_8%,rgba(35,35,255,0.38),transparent_60%),radial-gradient(60%_50%_at_8%_100%,rgba(116,128,255,0.18),transparent_60%)]"
        />
        <div aria-hidden className="blueprint pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black_0%,black_55%,transparent_100%)]" />
        <AuthHero />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-b from-[#5865ff] to-[#2323ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_-6px_rgba(35,35,255,0.7)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-serif text-lg font-semibold tracking-[-0.03em]">Bunyan Digital</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="mb-5 inline-flex items-center gap-3 font-mono text-[0.72rem] tracking-[0.14em] text-[#7480ff] uppercase">
            <span className="h-px w-6 bg-current" /> Client &amp; operations CRM
          </p>
          <h2 className="font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.04em] xl:text-6xl">
            Bunyan means <span className="text-[#7480ff]">to build.</span>
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-white/60">
            Every client, service, job and payment in one place — so the team can spend its time building.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center overflow-hidden px-5 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-32 h-80 w-80 rounded-full bg-[#2323ff]/10 blur-[100px]"
        />
        <div className="rise relative w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-gradient-to-b from-[#5865ff] to-[#2323ff] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_-6px_rgba(35,35,255,0.5)]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="font-serif font-semibold tracking-[-0.03em] text-foreground">Bunyan Digital</p>
              <p className="text-xs text-muted-foreground">Client &amp; operations CRM</p>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
