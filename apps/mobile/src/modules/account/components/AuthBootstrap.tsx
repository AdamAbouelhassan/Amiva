import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { auth } from '../../../firebase/client';
import { useAuthStore } from '../hooks/useAuthStore';

/** Mounted once near the navigation root. Subscribes to Firebase Auth and
 * mirrors it into useAuthStore — nothing else in the app should call
 * `onAuthStateChanged` directly. Renders nothing. */
export function AuthBootstrap(): null {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return unsubscribe;
  }, [setFirebaseUser]);

  return null;
}
