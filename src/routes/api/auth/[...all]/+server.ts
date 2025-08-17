import { auth, canSignUp } from '$lib/server/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
  return auth.handler(event.request);
};

export const POST: RequestHandler = async (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/api/auth/sign-up/email') {
    const signupsAllowed = await canSignUp();
    if (!signupsAllowed) {
      return new Response(JSON.stringify({ 
        error: 'Sign-ups are currently disabled' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return auth.handler(event.request);
};