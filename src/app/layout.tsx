import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Bricolage_Grotesque, Reem_Kufi } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Display face — bound to --font-serif so every existing `font-serif` heading picks it up.
const display = Bricolage_Grotesque({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
});

const arabic = Reem_Kufi({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Bunyan Digital CRM",
  description: "Client and service operations for Bunyan Digital",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${display.variable} ${arabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthSessionProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
