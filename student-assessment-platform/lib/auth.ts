/**
 * NextAuth Configuration
 * 
 * Authentication setup with email + OTP provider.
 * Supports multi-tenant architecture.
 * 
 * @module lib/auth
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import EmailProvider from 'next-auth/providers/email';
import { db } from '@/lib/db';
import { sendOTP } from '@/lib/email';
import { redis } from '@/lib/redis';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-otp',
  },
  providers: [
    EmailProvider({
      server: {},
      from: process.env.EMAIL_FROM || 'noreply@platform.com',
      generateVerificationToken: () => {
        // Generate 6-digit OTP
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      async sendVerificationRequest({ identifier, token, url }) {
        // Store OTP in Redis (5 minute expiry)
        await redis.setex(`otp:${identifier}`, 300, token);
        
        // Send OTP email
        await sendOTP(identifier, token);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
      }
      return session;
    },
  },
};

