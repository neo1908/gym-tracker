import { createAuthClient } from 'better-auth/svelte';
import type { Auth } from '$lib/server/auth';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || 'http://localhost:5173'
}) as ReturnType<typeof createAuthClient> & {
  signIn: {
    email: (data: { email: string; password: string }) => Promise<any>;
  };
  signUp: {
    email: (data: { email: string; password: string; name?: string }) => Promise<any>;
  };
};

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  session
} = authClient;