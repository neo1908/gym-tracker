import type { PageServerLoad } from './$types';
import { canSignUp } from '$lib/server/auth';

export const load: PageServerLoad = async () => {
  const allowSignups = await canSignUp();
  
  return {
    allowSignups
  };
};