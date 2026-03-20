import { createContext } from "react";
import type { AuthProvider, AuthSession, AuthUser } from "../lib/auth";

export interface AuthContextValue {
  isReady: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  authError: string;
  clearAuthError: () => void;
  signIn: (provider: AuthProvider) => { ok: true } | { ok: false; reason: "MISSING_CONFIG" | "SSR_NOT_SUPPORTED" };
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
