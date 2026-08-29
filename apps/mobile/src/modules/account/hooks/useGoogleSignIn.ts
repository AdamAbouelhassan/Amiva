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

  // TEMPORARY debug log — remove once Google sign-in is confirmed working
  // end-to-end in Expo Go. This is the one thing we couldn't verify
  // without a real device: whether expo-auth-session resolves to an
  // exp:// address, Expo's auth proxy, or something else, and whether
  // that value is registered as an authorized redirect URI on the OAuth
  // client in Google Cloud Console.
  useEffect(() => {
    if (request?.redirectUri) {
      console.log('[useGoogleSignIn] redirectUri:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      setError(new Error(response.error?.message ?? 'Google sign-in failed'));
      return;
    }
    if (response.type !== 'success') return; // 'dismiss' / 'cancel' — user backed out, not an error

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
