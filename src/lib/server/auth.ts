import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './schema';

const allowSignups = process.env.ALLOW_SIGNUPS === 'true';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      account: schema.account,
      session: schema.session,
      verification: schema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['credential']
    }
  },
  user: {
    changeEmail: {
      enabled: true,
      requiresVerification: false
    }
  },
  advanced: {
    disableCSRFCheck: false,
    generateId: false,
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'gym-tracker'
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:5173']
});

export async function canSignUp(): Promise<boolean> {
  return allowSignups;
}

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;