import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email/send-verification";
import { verifyPassword } from "@/lib/password";
import { AccountDisabledError } from "@/lib/auth-errors";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Explicitly setting this (even to Auth.js's own default) is what makes it combine
  // correctly with Next.js's `basePath` config — left implicit, Auth.js's internal
  // redirects/fetches ignore the app's basePath entirely and 404. Must be prefixed
  // with NEXT_PUBLIC_BASE_PATH itself (Next.js's basePath applies to routing, not to
  // what Auth.js thinks its own path is) or generated URLs drop the "/crm" prefix.
  basePath: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth`,
  // Required once this app sits behind Netlify's site-to-site proxy (www.bunyandigital.co/crm
  // forwarding to this app's own bunyandigitalcrm.netlify.app origin): the request Auth.js
  // actually receives carries an x-forwarded-host that doesn't match this origin's own host,
  // which Auth.js rejects by default outside of known platforms like Vercel.
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  // Credentials sign-in requires JWT sessions — the adapter is still used for the
  // Resend/email provider's verification tokens and for looking users up by email.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/login",
  },
  providers: [
    Resend({
      from: process.env.EMAIL_FROM,
      sendVerificationRequest,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.disabledAt) throw new AccountDisabledError();
        if (!verifyPassword(password, user.passwordHash)) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    // Runs for every provider. For email, this fires both before the link is sent and again
    // when it's clicked. Only pre-registered (admin-created) users may sign in — there is no
    // public signup, and the credentials provider already re-checks this itself in authorize().
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (!existing) return false;
      if (existing.disabledAt) throw new AccountDisabledError();
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: "ADMIN" | "MEMBER" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MEMBER";
      }
      return session;
    },
  },
});
