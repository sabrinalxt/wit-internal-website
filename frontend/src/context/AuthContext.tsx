import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AUTH_EXPIRED_EVENT, clearToken, getToken, setToken } from "../api/client";
import type { AuthUser, LoginResponse } from "../types";

// localStorage key for the user object
const USER_KEY = "wit_user";

type AuthContextValue = {
  user: AuthUser | null;
  // True when the last sign-out happened because the session ran out
  sessionExpired: boolean;
  signIn: (result: LoginResponse) => void; // login/signup success
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Reads the `exp` claim (seconds) from a JWT and returns it in milliseconds.
// Returns 0 if the token can't be read, so it is treated as expired.
function getTokenExpiry(token: string): number {
  try {
    const part = token.split(".")[1];
    if (!part) return 0;
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function clearStoredSession() {
  clearToken();
  localStorage.removeItem(USER_KEY);
}

// Restores the session from localStorage so a page refresh keeps the user logged in
function loadStoredUser(): AuthUser | null {
  const token = getToken();
  const stored = localStorage.getItem(USER_KEY);
  if (!token || !stored || getTokenExpiry(token) <= Date.now()) {
    clearStoredSession();
    return null;
  }
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [sessionExpired, setSessionExpired] = useState(false);

  const signIn = useCallback((result: LoginResponse) => {
    setToken(result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setSessionExpired(false);
    setUser(result.user);
  }, []);

  const signOut = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  const expireSession = useCallback(() => {
    clearStoredSession();
    setSessionExpired(true);
    setUser(null);
  }, []);

  // Sign out automatically the moment the token expires
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    const msLeft = token ? getTokenExpiry(token) - Date.now() : 0;
    const timer = setTimeout(expireSession, Math.max(msLeft, 0));
    return () => clearTimeout(timer);
  }, [user, expireSession]);

  // The API client fires this event when the server rejects our token
  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
  }, [expireSession]);

  // Keep tabs in sync: logging out in one tab logs out the others
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === USER_KEY || e.key === null) setUser(loadStoredUser());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, sessionExpired, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}