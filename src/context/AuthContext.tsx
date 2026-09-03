import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { LoginRequest, User } from '../types/auth';
import * as authApi from '../services/authApi';
import * as profileApi from '../services/profileApi';
import { setAuthToken, setOnSessionEnd, restoreSession } from '../services/apiClient';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  restoring: boolean;
  sessionMessage: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  clearSession: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, restoreOnMount = true }: { children: ReactNode; restoreOnMount?: boolean }) {
  // token żyje wyłącznie w apiClient — tu trzymamy sam fakt zalogowania,
  // inaczej po cichym odświeżeniu mielibyśmy nieaktualną kopię
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(restoreOnMount);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setAuthenticated(false);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    clearSession();
    setSessionMessage(null);
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await profileApi.getProfile();
      setUser({
        userId: profile.id,
        email: profile.email,
        role: profile.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
    } catch {}
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const res = await authApi.login(data);

      setAuthToken(res.token);
      setAuthenticated(true);
      setUser({ userId: res.userId, email: res.email, role: res.role });
      setSessionMessage(null);

      await refreshProfile();
    },
    [refreshProfile],
  );

  useEffect(() => {
    if (!restoreOnMount) return;
    let cancelled = false;

    restoreSession()
      .then(async (session) => {
        if (cancelled || !session) return;
        setAuthenticated(true);
        setUser({ userId: session.userId, email: session.email, role: session.role });
        await refreshProfile();
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshProfile, restoreOnMount]);

  useEffect(() => {
    setOnSessionEnd((message) => {
      clearSession();
      setSessionMessage(message ?? 'Twoja sesja wygasła. Zaloguj się ponownie.');
    });
    return () => setOnSessionEnd(null);
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: authenticated,
        restoring,
        sessionMessage,
        login,
        logout,
        clearSession,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
  }
  return ctx;
}
