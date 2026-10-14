import Image from "next/image";
import { SmokeyBackground } from "@/components/ui/login-form";
import mark from "@/components/brand/bd-mark-light.png";

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
      <main className="auth-midnight relative min-h-screen w-full flex-1 overflow-hidden bg-[#0a0e17]">
        <SmokeyBackground color="#3347ff" />
        <a
          href="https://bunyandigital.co"
          className="absolute top-6 left-6 z-20 flex items-center gap-2.5 text-white sm:top-8 sm:left-10"
        >
          <Image src={mark} alt="" className="h-7 w-auto" priority />
          <span className="text-lg font-bold tracking-tight">Bunyan Digital</span>
        </a>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-24">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </>
  );
}
