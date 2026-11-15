import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getCurrentUser,
  signIn as serviceSignIn,
  signOut as serviceSignOut,
} from '../services/authService';
import type { AppUser, UserRole } from '../types/auth';

export interface AuthContextValue {
  user: AppUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isExaminee: boolean;
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  signIn: (username: string, pass: string) => Promise<AppUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => getCurrentUser());
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const signIn = useCallback(async (username: string, pass: string) => {
    const signedIn = await serviceSignIn(username, pass);
    setUser(signedIn);
    setLoginOpen(false);
    return signedIn;
  }, []);

  const signOut = useCallback(() => {
    serviceSignOut();
    setUser(null);
  }, []);

  const role = user?.role ?? null;
  const isAdmin = role === 'admin';
  const isExaminee = role === 'examinee';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isAdmin,
      isExaminee,
      loginOpen,
      setLoginOpen,
      signIn,
      signOut,
    }),
    [user, role, isAdmin, isExaminee, loginOpen, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
