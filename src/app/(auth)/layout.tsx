export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 40%, black 40%, transparent 90%)",
        }}
      />
      <div className="relative w-full max-w-[380px]">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-primary/40 bg-primary/10 text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight text-foreground">Bunyan Digital</p>
            <p className="text-xs text-muted-foreground">Client &amp; operations CRM</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
