"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Session } from "../shared/session";
import { getClientSession } from "../client";

export interface AuthContextValue {
  session: Session | null;
  status: "loading" | "ready";
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  /** Email/password demo login (POST /api/auth/login). */
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: {
  children: React.ReactNode;
  baseUrl?: string;
}) {
  const base = props.baseUrl ?? "";
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const refresh = useCallback(async () => {
    const s = await getClientSession(base);
    setSession(s);
    setStatus("ready");
  }, [base]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    const root = base.replace(/\/$/, "");
    await fetch(`${root}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setSession(null);
  }, [base]);

  const login = useCallback(
    async (email: string, password: string) => {
      const root = base.replace(/\/$/, "");
      const res = await fetch(`${root}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null;
        throw new Error(
          err?.message ?? err?.error ?? `Login failed (${res.status})`,
        );
      }
      await refresh();
    },
    [base, refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      refresh,
      logout,
      login,
    }),
    [session, status, refresh, logout, login],
  );

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const v = useContext(AuthContext);
  if (!v) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return v;
}
