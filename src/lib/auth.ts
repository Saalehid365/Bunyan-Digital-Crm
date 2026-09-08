import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email/send-verification";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        if (!user || user.disabledAt || !user.passwordHash) return null;
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
      return !!existing && !existing.disabledAt;
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
