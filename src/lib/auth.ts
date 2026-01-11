import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verifyTOTP } from "./totp";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const totpCode = credentials.totpCode as string | undefined;

        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        // Check 2FA if enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!totpCode) {
            // Return special error to trigger 2FA input
            throw new Error("2FA_REQUIRED");
          }

          const isValidToken = verifyTOTP(totpCode, user.twoFactorSecret);

          if (!isValidToken) {
            throw new Error("Invalid 2FA code");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      // Fetch latest user data from database
      if (token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });

        if (dbUser) {
          token.plan = dbUser.plan;
          token.twoFactorEnabled = dbUser.twoFactorEnabled;
          token.isAdmin = dbUser.isAdmin;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as string;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});

// Extend session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      plan?: string;
      twoFactorEnabled?: boolean;
      isAdmin?: boolean;
    };
  }

  interface User {
    plan?: string;
    twoFactorEnabled?: boolean;
    isAdmin?: boolean;
  }
}

