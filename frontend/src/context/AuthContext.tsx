import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (payload: { phone: string; otp: string; name: string }) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "rosca_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setUser(JSON.parse(raw) as User);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  async function requestOtp(phone: string) {
    await api.post("/auth/request-otp", { phone });
  }

  async function verifyOtp(payload: { phone: string; otp: string; name: string }) {
    const response = await api.post<User>("/auth/verify-otp", payload);
    setUser(response.data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      requestOtp,
      verifyOtp,
      signOut
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
