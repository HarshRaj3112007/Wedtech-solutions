import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

/**
 * NextAuth config — credentials-based planner login.
 * Guest auth uses separate magic-link/token flow, not NextAuth sessions.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const planner = await prisma.planner.findUnique({
          where: { email: credentials.email },
        });

        if (!planner) {
          throw new Error("No account found with this email");
        }

        const isPasswordValid = await compare(
          credentials.password,
          planner.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: planner.id,
          name: planner.name,
          email: planner.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
