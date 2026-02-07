import React, { createContext, useContext, useEffect, useState } from "react";
import type { AppRole, Profile, AuthUser, AuthSession } from "@/shared";
import { getApiBaseUrl, getToken, setToken, api } from "@/shared";

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  userRole: AppRole | null;
  loading: boolean;
  isDriver: boolean;
  isPassenger: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string, role?: AppRole) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  switchRole: (newRole: AppRole) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileToUser(profile: Profile): AuthUser {
  return {
    id: profile.id,
    email: profile.email ?? undefined,
    user_metadata: { full_name: profile.full_name },
  };
}

// eslint-disable-next-line react-refresh/only-export-components -- auth hook is primary export
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const token = getToken();
    if (!token) return;
    const { data, error } = await api.get<{ user: Profile; role: string }>("/auth/me");
    if (!error && data) {
      setProfile(data.user);
      setUserRole(data.role as AppRole);
      setUser(profileToUser(data.user));
      setSession({ user: profileToUser(data.user), access_token: token });
    }
  };

  useEffect(() => {
    if (!getApiBaseUrl()) {
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let mounted = true;
    api.get<{ user: Profile; role: string }>("/auth/me").then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data) {
        setToken(null);
        setUser(null);
        setSession(null);
        setProfile(null);
        setUserRole(null);
      } else {
        setProfile(data.user);
        setUserRole(data.role as AppRole);
        setUser(profileToUser(data.user));
        setSession({ user: profileToUser(data.user), access_token: token });
      }
      setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await api.post<{ token: string; user: Profile; role: string }>("/auth/login", { email, password });
    if (error) return { error: new Error(error.message) };
    if (!data?.token) return { error: new Error("Login failed") };
    setToken(data.token);
    setProfile(data.user);
    setUserRole(data.role as AppRole);
    setUser(profileToUser(data.user));
    setSession({ user: profileToUser(data.user), access_token: data.token });
    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string, role?: AppRole) => {
    const requested_role = role === "driver" ? "driver" : "passenger";
    const { data, error } = await api.post<{ token: string; user: Profile; role: string }>("/auth/register", {
      email,
      password,
      full_name: fullName ?? null,
      requested_role,
    });
    if (error) return { error: new Error(error.message) };
    if (!data?.token) return { error: new Error("Registration failed") };
    setToken(data.token);
    setProfile(data.user);
    setUserRole(data.role as AppRole);
    setUser(profileToUser(data.user));
    setSession({ user: profileToUser(data.user), access_token: data.token });
    return { error: null };
  };

  const signInWithPhone = async (_phone: string) => {
    return { error: new Error("Phone sign-in is not available. Use email and password.") as Error | null };
  };

  const verifyOtp = async (_phone: string, _token: string) => {
    return { error: new Error("OTP verification is not available.") as Error | null };
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await api.patch("/profiles/me", updates);
    if (error) return { error: new Error(error.message) };
    await refreshProfile();
    return { error: null };
  };

  const switchRole = async (newRole: AppRole) => {
    if (newRole === "admin") return { error: new Error("Cannot switch to admin role") };
    return { error: new Error("Role switching is not supported. Sign in to the correct app (Passenger or Driver).") as Error | null };
  };

  const isDriver = userRole === "driver";
  const isPassenger = userRole === "passenger";
  const isAdmin = userRole === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        userRole,
        loading,
        isDriver,
        isPassenger,
        isAdmin,
        signInWithEmail,
        signUpWithEmail,
        signInWithPhone,
        verifyOtp,
        signOut,
        updateProfile,
        refreshProfile,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
