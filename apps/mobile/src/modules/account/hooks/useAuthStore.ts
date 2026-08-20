import { User as FirebaseUser } from 'firebase/auth';
import { create } from 'zustand';

/** Zustand for local/UI-adjacent state (CLAUDE.md: "lightweight, avoids
 * Redux boilerplate") — the Firebase Auth SDK owns the real session, this
 * just mirrors it for React to read. Populated once, at app root, by
 * `onAuthStateChanged` (see AuthBootstrap). */
interface AuthState {
  firebaseUser: FirebaseUser | null;
  initializing: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  initializing: true,
  setFirebaseUser: (user) => set({ firebaseUser: user, initializing: false }),
}));
