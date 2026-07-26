import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users } from "./db";
import { loadSessionUser, invalidateSessionUser } from "./auth-user";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verifyTOTP } from "./totp";

// Custom error classes for better error messages
class InvalidCredentialsError extends CredentialsSignin {
  code = "Invalid email or password";
}

class TwoFactorRequiredError extends CredentialsSignin {
  code = "2FA_REQUIRED";
}

class InvalidTwoFactorError extends CredentialsSignin {
  code = "Invalid 2FA code";
}

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
          throw new InvalidCredentialsError();
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const totpCode = credentials.totpCode as string | undefined;

        // Find user by email - try exact match first, then case-insensitive
        const emailTrimmed = email.trim();
        let user = await db.query.users.findFirst({
          where: eq(users.email, emailTrimmed),
        });

        // If not found, try lowercase
        if (!user) {
          const emailLower = emailTrimmed.toLowerCase();
          user = await db.query.users.findFirst({
            where: eq(users.email, emailLower),
          });
        }

        if (!user || !user.password) {
          throw new InvalidCredentialsError();
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          throw new InvalidCredentialsError();
        }

        // Check 2FA if enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          // Check for empty/undefined totpCode (handle "undefined" string too)
          if (!totpCode || totpCode === "undefined" || totpCode.trim() === "") {
            // Return special error to trigger 2FA input
            throw new TwoFactorRequiredError();
          }

          const isValidToken = verifyTOTP(totpCode, user.twoFactorSecret);

          if (!isValidToken) {
            throw new InvalidTwoFactorError();
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
    async redirect({ url, baseUrl }) {
      // Prevent open redirect attacks - only allow same-origin redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
    async signIn({ user }) {
      // Allow sign in if user exists
      return !!user;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.issuedAt = Date.now();
      }

      // A sign-in or an explicit session update must see the database, never a
      // cached row from a moment ago.
      if ((trigger === "signIn" || trigger === "update") && token.id) {
        invalidateSessionUser(token.id as string);
      }

      // One joined, briefly cached read instead of four chained queries.
      // See src/lib/auth-user.ts for why.
      if (token.id) {
        const data = await loadSessionUser(token.id as string);

        if (data) {
          const { user: dbUser } = data;

          // Invalidate the session if the password changed after this token
          // was issued. Still checked on every call.
          if (dbUser.passwordChangedAt && token.issuedAt) {
            const changedAt = new Date(dbUser.passwordChangedAt as string).getTime();
            if (changedAt > (token.issuedAt as number)) {
              return { ...token, id: null };
            }
          }

          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image;
          token.plan = dbUser.plan;
          token.billingInterval = dbUser.billingInterval;
          token.isLifetimeDeal = dbUser.isLifetimeDeal;
          token.twoFactorEnabled = dbUser.twoFactorEnabled;
          token.isAdmin = dbUser.isAdmin;
          token.hasPassword = !!dbUser.password;
          token.hasUsedTrial = dbUser.hasUsedTrial ?? false;
          token.trialEndedAt = dbUser.trialEndedAt
            ? new Date(dbUser.trialEndedAt as Date).getTime()
            : null;
          token.stripeSubscriptionId = dbUser.stripeSubscriptionId;

          token.isTeamMember = data.isTeamMember;
          token.teamId = data.teamId;
          token.teamRole = data.teamRole;
          token.teamOwnerId = data.teamOwnerId;
          // Team members inherit the owner's plan so they keep feature access.
          if (data.isTeamMember && data.ownerPlan) {
            token.plan = data.ownerPlan;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.image = token.image as string | null;
        session.user.plan = token.plan as string;
        session.user.billingInterval = token.billingInterval as string | null;
        session.user.isLifetimeDeal = token.isLifetimeDeal as boolean;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.isTeamMember = token.isTeamMember as boolean;
        session.user.teamId = token.teamId as string | null;
        session.user.teamRole = token.teamRole as string | null;
        session.user.teamOwnerId = token.teamOwnerId as string | null;
        session.user.hasUsedTrial = token.hasUsedTrial as boolean;
        session.user.trialEndedAt = token.trialEndedAt as number | null;
        session.user.stripeSubscriptionId = token.stripeSubscriptionId as string | null;
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
      billingInterval?: string | null;
      isLifetimeDeal?: boolean;
      twoFactorEnabled?: boolean;
      isAdmin?: boolean;
      hasPassword?: boolean;
      isTeamMember?: boolean;
      teamId?: string | null;
      teamRole?: string | null; // "admin" | "member"
      teamOwnerId?: string | null;
      hasUsedTrial?: boolean;
      trialEndedAt?: number | null;
      stripeSubscriptionId?: string | null;
    };
  }

  interface User {
    plan?: string;
    twoFactorEnabled?: boolean;
    isAdmin?: boolean;
  }
}
