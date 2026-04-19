import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ApiUser } from "@/lib/api";

const STORAGE_KEY = "kameti.auth.user";

type AuthState = {
  user: ApiUser | null;
  loading: boolean;
  setUser: (u: ApiUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setUserState(JSON.parse(raw));
      }
    } catch {
      /* noop */
    }
    setLoading(false);
  }, []);

  const setUser = useCallback((u: ApiUser | null) => {
    setUserState(u);
    try {
      if (typeof window !== "undefined") {
        if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        else window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* noop */
    }
  }, []);

  const logout = useCallback(() => setUser(null), [setUser]);

  const value = useMemo(
    () => ({ user, loading, setUser, logout }),
    [user, loading, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
