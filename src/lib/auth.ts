import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { compare } from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { team: true },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        if (!user.active) {
          throw new Error("INACTIVE_USER");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          teamId: user.teamId,
          teamName: user.team?.name || null,
          active: user.active,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-in, ensure user has a team
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser && !dbUser.teamId) {
          const team = await prisma.team.findFirst();
          if (team) {
            await prisma.user.update({ where: { id: dbUser.id }, data: { teamId: team.id } });
          }
        }
        // Block inactive Google users
        if (dbUser && !dbUser.active) {
          return "/pending";
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.teamId = (user as { teamId: string | null }).teamId;
        token.teamName = (user as { teamName: string | null }).teamName;
        token.active = (user as { active?: boolean }).active ?? false;
      }
      // Refresh user data from DB on every token refresh for Google users
      if (trigger === "signIn" || !token.teamId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { team: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.teamId = dbUser.teamId;
          token.teamName = dbUser.team?.name || null;
          token.active = dbUser.active;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { teamId: string | null }).teamId = token.teamId as string | null;
        (session.user as { teamName: string | null }).teamName = token.teamName as string | null;
      }
      return session;
    },
  },
};
