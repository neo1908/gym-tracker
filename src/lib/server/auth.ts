import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db';
import * as schema from './schema';

let _auth: ReturnType<typeof betterAuth> | null = null;

function getAuth() {
  if (!_auth) {
    try {
      const db = getDb();
      _auth = betterAuth({
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
          generateId: true,
          useSecureCookies: process.env.NODE_ENV === 'production',
          cookiePrefix: 'gym-tracker'
        },
        trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:5173']
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      throw error;
    }
  }
  return _auth;
}

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(target, prop, receiver) {
    return Reflect.get(getAuth(), prop, receiver);
  }
});

export async function canSignUp(): Promise<boolean> {
  return process.env.ALLOW_SIGNUPS === 'true';
}

export type Auth = ReturnType<typeof betterAuth>;
export type Session = Auth['$Infer']['Session'];
export type User = Auth['$Infer']['User'];