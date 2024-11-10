import prisma from "@/lib/db.config";
import { NextAuthOptions as AuthOptions,User } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

type ISODateString = string;

export interface CustomSession {
  user?: CustomUser;
  expires: ISODateString;
}
export interface CustomUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  provider?: string | null;
}
export const authOptions: AuthOptions = {
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        const findUser = await prisma.user.findUnique({
          where: {
            email: user.email!,
          },
        });
        if (findUser) {
          user.id = findUser?.id.toString();
          return true;
        }

        const data = await prisma.user.create({
          data: {
            email: user.email!,
            name: user.name!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            oauth_id: account?.providerAccountId!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            provider: account?.provider!,
            image: user?.image,
          },
        });
        user.id = data?.id.toString();
        return true;
      } catch (error) {
        console.log("The error is", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },

    async session({
      session,
      token,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      user,
    }: {
      session: CustomSession;
      token: JWT;
      user: User;
    }) {
      session.user = token.user as CustomUser;
      return session;
    },
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
};