import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile } from "../types";
import { loginApi, getMeApi, logoutApi } from "../services/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  quickSwitchPersona: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("clinical_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (!token) {
        // Auto-login as MDT Chair for immediate rich prototype exploration
        try {
          const res = await loginApi("prof.adams@hospital.org", "HospitalSecure2024!");
          localStorage.setItem("clinical_token", res.token);
          setToken(res.token);
          setUser(res.user);
        } catch {
          // Fallback if backend initializing
          setUser({
            id: "usr-chair",
            email: "prof.adams@hospital.org",
            full_name: "Prof. E. Adams, MD",
            role: "chair",
            department: "Medical Oncology",
          });
        }
      } else {
        try {
          const u = await getMeApi();
          setUser(u);
        } catch {
          // Token expired or server restarted
          try {
            const res = await loginApi("prof.adams@hospital.org", "HospitalSecure2024!");
            localStorage.setItem("clinical_token", res.token);
            setToken(res.token);
            setUser(res.user);
          } catch {
            setUser(null);
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password = "HospitalSecure2024!") => {
    setIsLoading(true);
    try {
      const res = await loginApi(email, password);
      localStorage.setItem("clinical_token", res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const quickSwitchPersona = async (email: string) => {
    await login(email, "HospitalSecure2024!");
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, quickSwitchPersona }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
