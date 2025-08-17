import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('gym-tracker-session-token');
  
  if (sessionToken) {
    const session = await auth.api.getSession({
      headers: event.request.headers
    });
    
    event.locals.session = session;
    event.locals.user = session?.user;
  }
  
  return resolve(event);
};