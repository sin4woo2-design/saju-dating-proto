import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import type { AuthSession } from "../lib/auth";
import { consumeOAuthCallback, getStoredSession, startOAuthLogin, storeSession } from "../lib/auth";

function getBootstrapState(): Pick<AuthContextValue, "session" | "authError"> {
  return {
    session: getStoredSession(),
    authError: "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bootstrap] = useState(getBootstrapState);
  const [session, setSession] = useState<AuthSession | null>(bootstrap.session);
  const [authError, setAuthError] = useState(bootstrap.authError);
  const [authNotice, setAuthNotice] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let alive = true;

    consumeOAuthCallback()
      .then((result) => {
        if (!alive) return;
        if (result.session) {
          setSession(result.session);
        }
        if (result.error) {
          setAuthError(result.error);
        }
        if (result.success) {
          setAuthNotice(result.success);
        }
      })
      .finally(() => {
        if (alive) setIsReady(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isReady,
    user: session?.user ?? null,
    session,
    authError: authError || authNotice,
    clearAuthError: () => {
      setAuthError("");
      setAuthNotice("");
    },
    signIn(provider) {
      return startOAuthLogin(provider);
    },
    signOut() {
      storeSession(null);
      setSession(null);
      setAuthError("");
      setAuthNotice("");
    },
  }), [authError, authNotice, isReady, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
