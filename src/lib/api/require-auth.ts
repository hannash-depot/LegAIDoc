import { auth } from '@/auth';
import { error } from './response';

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return { error: error('Unauthorized', 401), session: null };
  }

  return { error: null, session };
}
