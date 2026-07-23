"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/providers/auth-provider";
import { isSuperAdminEmail } from "@/lib/admin";

// The subset of a user we need to render another user's view. A real Firebase
// User already satisfies this shape, so data hooks can swap `useAuth()` for
// `useEffectiveUser()` with a one-line change.
export interface EffectiveUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface ImpersonationContextValue {
  /** True when the real signed-in account is the superadmin. */
  isSuperAdmin: boolean;
  /** True when the superadmin is currently viewing the app as another user. */
  isImpersonating: boolean;
  /** The user being viewed, or null when not impersonating. */
  impersonatedUser: EffectiveUser | null;
  startImpersonation: (user: EffectiveUser) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  isSuperAdmin: false,
  isImpersonating: false,
  impersonatedUser: null,
  startImpersonation: () => {},
  stopImpersonation: () => {},
});

// Session-scoped so a browser refresh keeps the same "view as" target, but it
// never leaks across sessions/tabs the way localStorage would.
const STORAGE_KEY = "wieder-impersonation";

const readStored = (): EffectiveUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EffectiveUser>;
    if (parsed && typeof parsed.uid === "string" && parsed.uid) {
      return {
        uid: parsed.uid,
        email: parsed.email ?? null,
        displayName: parsed.displayName ?? null,
        photoURL: parsed.photoURL ?? null,
      };
    }
  } catch {
    // Corrupt value — ignore and fall through to no impersonation.
  }
  return null;
};

const writeStored = (user: EffectiveUser): void => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

const clearStored = (): void => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
};

export const ImpersonationProvider = ({ children }: { children: ReactNode }) => {
  const { user: realUser, loading } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(realUser?.email);

  const [impersonatedUser, setImpersonatedUser] = useState<EffectiveUser | null>(
    () => readStored()
  );

  // Only a signed-in superadmin may impersonate. If the real account signs out
  // or isn't the superadmin, drop any impersonation immediately.
  useEffect(() => {
    if (loading) return;
    if (!isSuperAdmin && impersonatedUser) {
      setImpersonatedUser(null);
      clearStored();
    }
  }, [loading, isSuperAdmin, impersonatedUser]);

  const startImpersonation = useCallback(
    (user: EffectiveUser) => {
      if (!isSuperAdmin || !user.uid) return;
      if (realUser && user.uid === realUser.uid) return; // no self-impersonation
      setImpersonatedUser(user);
      writeStored(user);
    },
    [isSuperAdmin, realUser]
  );

  const stopImpersonation = useCallback(() => {
    setImpersonatedUser(null);
    clearStored();
  }, []);

  const isImpersonating = isSuperAdmin && !!impersonatedUser;

  return (
    <ImpersonationContext.Provider
      value={{
        isSuperAdmin,
        isImpersonating,
        impersonatedUser: isImpersonating ? impersonatedUser : null,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => useContext(ImpersonationContext);

// Mirrors the `useAuth()` return shape ({ user, loading }) so data hooks can
// read the *effective* user — the impersonated user when the superadmin is
// viewing someone, otherwise the real signed-in user.
export const useEffectiveUser = (): {
  user: EffectiveUser | null;
  loading: boolean;
  isImpersonating: boolean;
} => {
  const { user: realUser, loading } = useAuth();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  return {
    user: isImpersonating ? impersonatedUser : (realUser as EffectiveUser | null),
    loading,
    isImpersonating,
  };
};
