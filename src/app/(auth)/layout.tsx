import Image from "next/image";
import mark from "@/components/brand/bd-mark-light.png";
import kingdomAppliances from "@/components/brand/kingdom-appliances-site.jpg";
import need4health from "@/components/brand/need4health-site.jpg";
import naturalNaqi from "@/components/brand/natural-naqi-site.jpg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Matches the marketing site's own <head> font loading exactly (see index.html) —
          Next hoists <link> rendered anywhere in the tree into the document <head>. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="auth-midnight grid min-h-screen flex-1 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
          <a href="https://bunyandigital.co" className="relative z-10 flex items-center gap-2.5">
            <Image src={mark} alt="" className="h-7 w-auto" priority />
            <span className="text-lg font-bold tracking-tight">Bunyan Digital</span>
          </a>

          <div className="relative z-10 max-w-lg">
            <p className="mb-5 text-sm font-semibold tracking-[0.02em] text-[#6e7dff]">
              Client &amp; operations CRM
            </p>
            <h1 className="text-[clamp(2.5rem,4.2vw,3.75rem)] leading-[0.95] font-bold tracking-[-0.04em]">
              Every client, every store, <span className="text-[#6e7dff]">one place.</span>
            </h1>
            <p className="mt-5 max-w-sm text-[1.05rem] leading-relaxed text-[#98a1b3]">
              Services, jobs and payments for every brand we build and grow &mdash; the same team, one system.
            </p>
          </div>

          <div className="auth-stack relative z-10 h-[clamp(220px,30vw,340px)] w-full">
            <figure className="s1">
              <Image src={kingdomAppliances} alt="" sizes="30vw" />
            </figure>
            <figure className="s2">
              <Image src={need4health} alt="" sizes="30vw" />
            </figure>
            <figure className="s3">
              <Image src={naturalNaqi} alt="" sizes="30vw" priority />
            </figure>
          </div>
        </aside>

        {/* Form panel */}
        <main className="relative flex items-center justify-center overflow-hidden px-5 py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -right-32 h-80 w-80 rounded-full bg-[#3347ff]/10 blur-[100px]"
          />
          <div className="relative w-full max-w-[400px]">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <Image src={mark} alt="" className="h-7 w-auto" priority />
              <div className="leading-tight">
                <p className="font-semibold tracking-tight text-foreground">Bunyan Digital</p>
                <p className="text-xs text-muted-foreground">Client &amp; operations CRM</p>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
