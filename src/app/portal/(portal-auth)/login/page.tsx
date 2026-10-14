import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalLoginForm } from "@/components/portal/portal-login-form";
import mark from "@/components/brand/bd-mark-light.png";
import kingdomAppliances from "@/components/brand/kingdom-appliances-site.jpg";
import need4health from "@/components/brand/need4health-site.jpg";
import naturalNaqi from "@/components/brand/natural-naqi-site.jpg";

export default function PortalLoginPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="auth-midnight grid min-h-screen flex-1 lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
          <a href="https://bunyandigital.co" className="relative z-10 flex items-center gap-2.5">
            <Image src={mark} alt="" className="h-7 w-auto" priority />
            <span className="text-lg font-bold tracking-tight">Bunyan Digital</span>
          </a>

          <div className="relative z-10 max-w-lg">
            <p className="mb-5 text-sm font-semibold tracking-[0.02em] text-[#6e7dff]">Client portal</p>
            <h1 className="text-[clamp(2.5rem,4.2vw,3.75rem)] leading-[0.95] font-bold tracking-[-0.04em]">
              Your results, <span className="text-[#6e7dff]">in one place.</span>
            </h1>
            <p className="mt-5 max-w-sm text-[1.05rem] leading-relaxed text-[#98a1b3]">
              Campaigns, reports and brand assets for your store, and a direct line to the team building it.
            </p>
          </div>

          <div className="auth-stack relative z-10 mb-4 h-[clamp(240px,40vh,420px)] w-full">
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
                <p className="text-xs text-muted-foreground">Client portal</p>
              </div>
            </div>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-xl">Sign in</CardTitle>
                <CardDescription>Use the email and password your account manager gave you.</CardDescription>
              </CardHeader>
              <CardContent>
                <PortalLoginForm />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
