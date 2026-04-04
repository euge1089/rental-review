import type { DefaultSession, Profile } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/signin",
  },
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
        if (!email) {
          throw new Error("Google sign-in did not return an email address.");
        }
        try {
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
        } catch (err) {
          console.error("[auth] Google sign-in: failed to upsert User", {
            email,
            prisma:
              err && typeof err === "object" && "code" in err
                ? (err as { code?: string; meta?: unknown }).code
                : undefined,
            message: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
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
          select: { phoneVerified: true, displayName: true },
        });
        session.user.phoneVerified = Boolean(row?.phoneVerified);
        const fromDb = row?.displayName?.trim();
        session.user.name = fromDb || (session.user.name ?? null);
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
