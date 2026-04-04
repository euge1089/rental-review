import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

/** Prisma and NextAuth expect Node; avoid Edge where DB drivers are unavailable. */
export const runtime = "nodejs";
