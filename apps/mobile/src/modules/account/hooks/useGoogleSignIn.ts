/**
 * Google OAuth sign-in (functional_specification.md §7.1). Auth-only —
 * Amiva never imports data from Google beyond the identity token
 * (CLAUDE.md exclusions list / functional_specification.md §7.1).
 */
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import { auth } from '../../../firebase/client';
import { env } from '../../../lib/env';

export function useGoogleSignIn() {
  const [error, setError] = useState<Error | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: env.googleOAuthClientId,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params.id_token;
    if (!idToken) return;

    setSigningIn(true);
    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(auth, credential)
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setSigningIn(false));
  }, [response]);

  return {
    ready: !!request,
    signingIn,
    error,
    signIn: () => promptAsync(),
  };
}
