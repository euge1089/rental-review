import type { DefaultSession, Profile } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "google-client-id-placeholder",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ?? "google-client-secret-placeholder",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = normalizeEmail(String(credentials.email));
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !user.emailVerifiedAt) return null;
        const ok = verifyPassword(String(credentials.password), user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile && isGoogleProfile(profile)) {
        const email = normalizeEmail(profile.email);
        const row = await prisma.user.upsert({
          where: { email },
          update: {
            emailVerifiedAt: new Date(),
            ...(profile.name ? { displayName: profile.name } : {}),
          },
          create: {
            email,
            displayName: profile.name ?? null,
            emailVerifiedAt: new Date(),
          },
        });
        token.sub = row.id;
        token.email = row.email;
        token.name = row.displayName ?? profile.name ?? undefined;
      } else if (account?.provider === "credentials" && user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email as string;
        if (token.name !== undefined) session.user.name = token.name as string | null;
      }
      if (session.user?.email) {
        const row = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { phoneVerified: true },
        });
        session.user.phoneVerified = Boolean(row?.phoneVerified);
      }
      return session;
    },
  },
};

function isGoogleProfile(
  profile: Profile,
): profile is Profile & { email: string; name?: string | null } {
  return typeof profile.email === "string" && profile.email.length > 0;
}

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      phoneVerified?: boolean;
    };
  }
}
