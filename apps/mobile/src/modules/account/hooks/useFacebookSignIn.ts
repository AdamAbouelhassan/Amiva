/**
 * Facebook OAuth sign-in (functional_specification.md §7.1). expo-auth-
 * session has no built-in Facebook provider (unlike Google), so this
 * drives the OAuth code flow against Facebook's endpoints directly via
 * the generic `AuthRequest` API, then exchanges the resulting access
 * token for a Firebase credential. Auth-only, same as Google — no data
 * import.
 */
import { FacebookAuthProvider, signInWithCredential } from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { auth } from '../../../firebase/client';
import { env } from '../../../lib/env';

const FACEBOOK_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
};

export function useFacebookSignIn() {
  const [error, setError] = useState<Error | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'amiva' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: env.facebookAppId,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    },
    FACEBOOK_DISCOVERY,
  );

  useEffect(() => {
    if (response?.type !== 'success') return;
    const accessToken = response.params.access_token;
    if (!accessToken) return;

    setSigningIn(true);
    const credential = FacebookAuthProvider.credential(accessToken);
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
