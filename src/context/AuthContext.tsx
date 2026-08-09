import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { LoginRequest, User } from "../types/auth";
import * as authApi from "../services/authApi";
import * as profileApi from "../services/profileApi";
import { setAuthToken, setOnUnauthorized } from "../services/apiClient";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);

    setAuthToken(res.token);
    setToken(res.token);
    setUser({ userId: res.userId, email: res.email, role: res.role });

    try {
      const profile = await profileApi.getProfile();
      setUser({
        userId: profile.userId,
        email: profile.email,
        role: profile.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
    } catch {
      /* niekrytyczne */
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: token !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth musi być użyty wewnątrz AuthProvider");
  }
  return ctx;
}