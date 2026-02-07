/**
 * Passenger app auth: Postgres backend only (VITE_API_URL required).
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { getApiBaseUrl, setToken, getToken, api } from "@/shared";
import type { Profile, AuthUser, AuthSession } from "@/shared";

const REQUIRED_ROLE = "passenger" as const;

function profileToUser(profile: Profile): AuthUser {
  return { id: profile.id, email: profile.email ?? undefined, user_metadata: { full_name: profile.full_name } };
}

interface PassengerAuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  roleError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export const PassengerAuthContext = createContext<PassengerAuthContextType | undefined>(undefined);

export function usePassengerAuth() {
  const ctx = useContext(PassengerAuthContext);
  if (!ctx) throw new Error("usePassengerAuth must be used within PassengerAuthProvider");
  return ctx;
}

export function PassengerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);

  const verifyRoleAndLoadProfile = async (userId: string) => {
    const { data } = await api.get<{ user: Profile; role: string }>("/auth/me");
    if (!data || data.role !== REQUIRED_ROLE) {
      setRoleError("This account is for drivers. Please use the GoRide Driver app to sign in.");
      setToken(null);
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }
    setRoleError(null);
    setProfile(data.user);
    setUser(profileToUser(data.user));
    setSession({ user: profileToUser(data.user), access_token: getToken() ?? "" });
  };

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
        if (data?.role !== REQUIRED_ROLE) setRoleError("This account is for drivers. Please use the GoRide Driver app.");
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
    const { data, error } = await api.post<{ token: string; user: Profile; role: string }>("/auth/login", { email, password });
    if (error) return { error: new Error(error.message) };
    if (!data?.token) return { error: new Error("Login failed") };
    if (data.role !== REQUIRED_ROLE) {
      setRoleError("This account is for drivers. Please use the GoRide Driver app.");
      return { error: new Error("This account is for drivers. Use the Driver app.") };
    }
    setToken(data.token);
    setProfile(data.user);
    setUser(profileToUser(data.user));
    setSession({ user: profileToUser(data.user), access_token: data.token });
    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    setRoleError(null);
    const { data, error } = await api.post<{ token: string; user: Profile; role: string }>("/auth/register", {
      email,
      password,
      full_name: fullName ?? null,
      requested_role: REQUIRED_ROLE,
    });
    if (error) return { error: new Error(error.message) };
    if (!data?.token) return { error: new Error("Registration failed") };
    setToken(data.token);
    setProfile(data.user);
    setUser(profileToUser(data.user));
    setSession({ user: profileToUser(data.user), access_token: data.token });
    return { error: null };
  };

  const signInWithPhone = async () => {
    return { error: new Error("Phone sign-in is not available. Use email to sign in.") };
  };

  const verifyOtp = async () => {
    return { error: new Error("Phone sign-in is not available. Use email to sign in.") };
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoleError(null);
  };

  const refreshProfile = async () => {
    const { data } = await api.get<{ user: Profile; role: string }>("/auth/me");
    if (data) {
      setProfile(data.user);
      setUser(profileToUser(data.user));
      if (session) setSession({ ...session, user: profileToUser(data.user) });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await api.patch("/profiles/me", updates);
    if (error) return { error: new Error(error.message) };
    await refreshProfile();
    return { error: null };
  };

  return (
    <PassengerAuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        roleError,
        signInWithEmail,
        signUpWithEmail,
        signInWithPhone,
        verifyOtp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </PassengerAuthContext.Provider>
  );
}
