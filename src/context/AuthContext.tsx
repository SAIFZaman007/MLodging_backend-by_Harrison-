import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiClient, tokenStorage } from "@/api/client";
import type { User } from "@/api/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await apiClient.get<User>("/auth/me");
    setUser(data);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!tokenStorage.getAccess()) {
        setIsLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        tokenStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await apiClient.post("/auth/login", { email, password });
      tokenStorage.set(data.access_token, data.refresh_token);
      await refreshUser();
    },
    [refreshUser],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      // Role gating is a UX affordance only — every admin-only action is also
      // enforced server-side, so hiding a button is never the security boundary.
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}