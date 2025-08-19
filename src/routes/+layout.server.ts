import type { LayoutServerLoad } from './$types';
import { canSignUp } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ locals }) => {
  const allowSignups = await canSignUp();
  
  return {
    session: locals.session,
    user: locals.user,
    allowSignups
  };
};