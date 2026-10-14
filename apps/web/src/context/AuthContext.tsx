import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";
import type { RegisterInput, LoginInput } from "@couple-ledger/shared";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  inviteCode: string;
  datePolicy?: "STRICT_TODAY" | "FLEXIBLE";
  theme?: string;
  role: string;
  createdAt: string;
  members: WorkspaceMember[];
}

interface AuthContextType {
  user: UserProfile | null;
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo | null;
  isLoading: boolean;
  setActiveWorkspace: (ws: WorkspaceInfo | null) => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.auth.me.get();
      if (res.data && res.data.success && res.data.data) {
        const u = res.data.data.user;
        const ws = res.data.data.workspaces as WorkspaceInfo[];
        setUser(u);
        setWorkspaces(ws);
        if (ws.length > 0) {
          setActiveWorkspace((prev) => {
            if (!prev) return ws[0] ?? null;
            const updated = ws.find((w) => w.id === prev.id);
            return updated ?? ws[0] ?? null;
          });
        }
      } else {
        setUser(null);
        setWorkspaces([]);
        setActiveWorkspace(null);
      }
    } catch {
      setUser(null);
      setWorkspaces([]);
      setActiveWorkspace(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCurrentUser();

    const handleFocus = () => {
      // Re-fetch saat tab/aplikasi dibuka kembali untuk sinkronisasi antar pasangan
      void fetchCurrentUser();
    };

    window.addEventListener("focus", handleFocus);
    // Polling halus setiap 15 detik jika user sedang aktif
    const interval = setInterval(() => {
      if (!document.hidden) {
        void fetchCurrentUser();
      }
    }, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  const login = async (input: LoginInput) => {
    const res = await api.auth.login.post(input);
    if (res.error) {
      const errVal = res.error.value as { error?: { message?: string } };
      throw new Error(errVal?.error?.message || "Email atau password salah");
    }
    if (res.data?.data?.token) {
      localStorage.setItem("couple_ledger_token", res.data.data.token);
    }
    await fetchCurrentUser();
  };

  const register = async (input: RegisterInput) => {
    const res = await api.auth.register.post(input);
    if (res.error) {
      const errVal = res.error.value as { error?: { message?: string } };
      throw new Error(errVal?.error?.message || "Registrasi gagal");
    }
    if (res.data?.data?.token) {
      localStorage.setItem("couple_ledger_token", res.data.data.token);
    }
    await fetchCurrentUser();
  };

  const logout = async () => {
    try {
      await api.auth.logout.post({});
    } finally {
      localStorage.removeItem("couple_ledger_token");
      setUser(null);
      setWorkspaces([]);
      setActiveWorkspace(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        isLoading,
        setActiveWorkspace,
        login,
        register,
        logout,
        refreshAuth: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

