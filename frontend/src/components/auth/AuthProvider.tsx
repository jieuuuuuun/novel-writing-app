"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultLocale, getMessages } from "@/i18n/messages";
import {
  AUTH_UNAUTHORIZED_EVENT,
  getCurrentUser,
  logout as requestLogout,
} from "@/lib/auth-api";
import type { AuthUser } from "@/types/auth";
import LoginScreen from "./LoginScreen";
import styles from "./auth.module.css";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}

export default function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const copy = getMessages(defaultLocale);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [hasCheckError, setHasCheckError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getCurrentUser(controller.signal)
      .then((currentUser) => {
        setUser(currentUser);
        setStatus(currentUser ? "authenticated" : "unauthenticated");
        setHasCheckError(false);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("unauthenticated");
          setHasCheckError(true);
        }
      });

    const handleUnauthorized = () => {
      setUser(null);
      setStatus("unauthenticated");
      setHasCheckError(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      controller.abort();
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        handleUnauthorized,
      );
    };
  }, []);

  const retryAuthentication = useCallback(async () => {
    setStatus("loading");
    setHasCheckError(false);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "unauthenticated");
    } catch {
      setStatus("unauthenticated");
      setHasCheckError(true);
    }
  }, []);

  const logout = useCallback(async () => {
    await requestLogout();
    setUser(null);
    setStatus("unauthenticated");
    setHasCheckError(false);
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      authenticated: status === "authenticated",
      logout,
    }),
    [logout, status, user],
  );

  let content: React.ReactNode;

  if (status === "loading") {
    content = (
      <main className={styles.authScreen} aria-live="polite">
        <span
          className={styles.loadingMark}
          aria-label={copy.auth.checking}
        />
      </main>
    );
  } else if (!user) {
    content = (
      <LoginScreen
        brand={copy.brand}
        copy={copy.auth}
        hasError={hasCheckError}
        onRetry={() => void retryAuthentication()}
      />
    );
  } else {
    content = children;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {content}
    </AuthContext.Provider>
  );
}
