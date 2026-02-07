/**
 * Admin app auth: Postgres backend only (VITE_API_URL required).
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { getApiBaseUrl, setToken, getToken, api } from "@/shared";
import type { Profile, AuthUser, AuthSession } from "@/shared";

const REQUIRED_ROLE = "admin" as const;

function profileToUser(profile: Profile): AuthUser {
  return { id: profile.id, email: profile.email ?? undefined, user_metadata: { full_name: profile.full_name } };
}

interface AdminAuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  roleError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl()) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.get<{ user: Profile; role: string }>("/auth/me").then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data || data.role !== REQUIRED_ROLE) {
        setToken(null);
        setUser(null);
        setSession(null);
        setProfile(null);
        setRoleError("Access denied. This account is not an admin. Run: npm run create-admin-postgres -- your@email.com YourPassword");
      } else {
        setRoleError(null);
        setProfile(data.user);
        setUser(profileToUser(data.user));
        setSession({ user: profileToUser(data.user), access_token: token });
      }
      setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setRoleError(null);
    const { data, error } = await api.post<{ token: string; user: { id: string }; role: string }>("/auth/login", { email, password });
    if (error) return { error: new Error(error.message) };
    if (!data?.token) return { error: new Error("Login failed") };
    if (data.role !== REQUIRED_ROLE) {
      setToken(null);
      setRoleError("Access denied. This account is not an admin. Run: npm run create-admin-postgres -- your@email.com YourPassword");
      return { error: new Error("Access denied. Admin only.") };
    }
    setToken(data.token);
    const { data: me } = await api.get<{ user: Profile; role: string }>("/auth/me");
    if (me) {
      setProfile(me.user);
      setUser(profileToUser(me.user));
      setSession({ user: profileToUser(me.user), access_token: data.token });
    }
    return { error: null };
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoleError(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ user, session, profile, loading, roleError, signInWithEmail, signOut }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
