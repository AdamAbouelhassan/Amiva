/**
 * Email/password sign-in — functional_specification.md §7's account
 * table lists "Password | Required (if not OAuth)", so this is a spec-
 * anticipated path, not a deviation. Practically: it's also the one auth
 * method that needs no external redirect at all (no browser, no OAuth
 * consent screen), so it's unaffected by the Google/Facebook
 * redirect-URI-vs-Expo-Go issue tracked separately.
 */
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../../../firebase/client';

export function useEmailPasswordAuth() {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setLoading(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    signUp: (email: string, password: string) => run(() => createUserWithEmailAndPassword(auth, email, password)),
    signIn: (email: string, password: string) => run(() => signInWithEmailAndPassword(auth, email, password)),
  };
}
