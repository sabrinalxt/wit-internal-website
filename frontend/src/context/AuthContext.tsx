import { createContext, useContext, useState, type ReactNode } from "react";
import { clearToken, getToken, setToken } from "../api/client";
import type { AuthUser, LoginResponse } from "../types";

// localStorage key for the user object
const USER_KEY = "wit_user";

type AuthContextValue = {
  user: AuthUser | null;
  signIn: (result: LoginResponse) => void; // login/signup success
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Restores the session from localStorage so a page refresh keep user logged in
function loadStoredUser(): AuthUser | null {
  const token = getToken();
  const stored = localStorage.getItem(USER_KEY);
  if (!token || !stored || isTokenExpired(token)) {
    clearToken();
    localStorage.removeItem(USER_KEY);
    return null;
  }
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  function signIn(result: LoginResponse) {
    setToken(result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
  }

  function signOut() {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}