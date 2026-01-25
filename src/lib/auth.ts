import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users, teamMembers, teams } from "./db";
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

        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

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
          if (!totpCode) {
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
    async signIn({ user }) {
      // Allow sign in if user exists
      return !!user;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }

      // Fetch latest user data from database on sign in or update
      if (token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });

        if (dbUser) {
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image;
          token.plan = dbUser.plan;
          token.twoFactorEnabled = dbUser.twoFactorEnabled;
          token.isAdmin = dbUser.isAdmin;

          // Check if user is a team member (not owner)
          const membership = await db.query.teamMembers.findFirst({
            where: eq(teamMembers.userId, dbUser.id),
          });

          if (membership && membership.role !== "owner") {
            // User is a team member, get team owner's info
            const team = await db.query.teams.findFirst({
              where: eq(teams.id, membership.teamId),
            });

            if (team) {
              token.isTeamMember = true;
              token.teamId = membership.teamId;
              token.teamRole = membership.role;
              token.teamOwnerId = team.ownerId;
            }
          } else {
            token.isTeamMember = false;
            token.teamId = null;
            token.teamRole = null;
            token.teamOwnerId = null;
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
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.isTeamMember = token.isTeamMember as boolean;
        session.user.teamId = token.teamId as string | null;
        session.user.teamRole = token.teamRole as string | null;
        session.user.teamOwnerId = token.teamOwnerId as string | null;
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
      isTeamMember?: boolean;
      teamId?: string | null;
      teamRole?: string | null; // "admin" | "member"
      teamOwnerId?: string | null;
    };
  }

  interface User {
    plan?: string;
    twoFactorEnabled?: boolean;
    isAdmin?: boolean;
  }
}
