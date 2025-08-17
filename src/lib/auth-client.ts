import { createAuthClient } from 'better-auth/svelte';
import { browser } from '$app/environment';
import type { Auth } from '$lib/server/auth';

// Only create auth client on the browser side
export const authClient = browser ? createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
}) as ReturnType<typeof createAuthClient> & {
  signIn: {
    email: (data: { email: string; password: string }) => Promise<any>;
  };
  signUp: {
    email: (data: { email: string; password: string; name?: string }) => Promise<any>;
  };
} : null;

// Export functions that handle both server and client side
export const signIn = authClient?.signIn || {
  email: async () => ({ error: 'Client not available on server' })
};

export const signUp = authClient?.signUp || {
  email: async () => ({ error: 'Client not available on server' })
};

export const signOut = authClient?.signOut || (() => Promise.resolve());

export const useSession = authClient?.useSession || (() => ({ data: null }));

export const session = authClient?.session || { subscribe: () => () => {} };