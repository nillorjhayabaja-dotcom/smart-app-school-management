import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/services";
import type { User, Role } from "@/types";

interface AuthCtxValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthCtx = createContext<AuthCtxValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.me().then((u) => setUser(u)).finally(() => setLoading(false));
  }, []);

  return (
    <AuthCtx.Provider value={{
      user, loading,
      login: async (e, p) => { const u = await authService.login(e, p); setUser(u); return u; },
      logout: async () => { await authService.logout(); setUser(null); },
      hasRole: (...roles) => !!user && roles.includes(user.role),
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
