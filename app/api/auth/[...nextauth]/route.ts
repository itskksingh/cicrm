import NextAuth, { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string | null;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    organizationId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organizationId: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Missing identifier or password");
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { phone: credentials.identifier }
            ]
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId ?? null,
        };
      }
    }),

    // ─── OTP PROVIDER PLACEHOLDER ───────────────────────────────────────────
    // OTP provider will be added here.
    //
    // Planned integration: SMS-based one-time password via phone number.
    //
    // Steps when implementing:
    //   1. Add a second CredentialsProvider (name: "OTP") accepting { phone, otp }
    //   2. On submission: verify OTP from a temp store (Redis / DB table)
    //   3. Look up User by phone field (already unique in schema)
    //   4. Return same session shape: { id, email, role, organizationId }
    //
    // The User model already supports this:
    //   phone  String?  @unique   ← OTP login identifier
    //   email  String?  @unique   ← optional (not required for OTP users)
    //   password String?          ← null for OTP-only users
    // ────────────────────────────────────────────────────────────────────────

  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
