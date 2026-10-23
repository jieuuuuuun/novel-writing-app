"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
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
  status: AuthStatus;
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
  const pathname = usePathname();
  const router = useRouter();
  const isAppRoute =
    pathname === "/works" || pathname.startsWith("/works/");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [hasCheckError, setHasCheckError] = useState(false);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const applyUser = (currentUser: AuthUser | null) => {
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "unauthenticated");
      setHasCheckError(false);
    };

    const syncCurrentUser = (signal?: AbortSignal) =>
      getCurrentUser(signal)
        .then(applyUser)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setStatus("unauthenticated");
            setHasCheckError(true);
          }
        });

    void syncCurrentUser(controller.signal);

    const handleUnauthorized = () => {
      setUser(null);
      setStatus("unauthenticated");
      setHasCheckError(false);
    };

    // 뒤로가기로 bfcache에서 복원되면 마운트 effect가 다시 돌지 않으므로 세션을 재확인합니다.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void syncCurrentUser();
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      controller.abort();
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        handleUnauthorized,
      );
      window.removeEventListener("pageshow", handlePageShow);
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
    setHasLoggedOut(true);
    setUser(null);
    setStatus("unauthenticated");
    setHasCheckError(false);
    router.replace("/");
  }, [router]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      authenticated: status === "authenticated",
      status,
      logout,
    }),
    [logout, status, user],
  );

  if (hasLoggedOut && !isAppRoute) {
    setHasLoggedOut(false);
  }

  let content: React.ReactNode = children;

  // 공개 랜딩은 로그인 여부와 관계없이 보여주고, 앱 경로만 인증으로 가립니다.
  // 로그아웃 직후에는 LoginScreen 대신 랜딩으로 이동합니다.
  if (hasLoggedOut && isAppRoute) {
    content = (
      <main className={styles.authScreen} aria-live="polite">
        <span
          className={styles.loadingMark}
          aria-label={copy.auth.checking}
        />
      </main>
    );
  } else if (isAppRoute && status === "loading") {
    content = (
      <main className={styles.authScreen} aria-live="polite">
        <span
          className={styles.loadingMark}
          aria-label={copy.auth.checking}
        />
      </main>
    );
  } else if (isAppRoute && !user) {
    content = (
      <LoginScreen
        brand={copy.brand}
        copy={copy.auth}
        hasError={hasCheckError}
        onRetry={() => void retryAuthentication()}
      />
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {content}
    </AuthContext.Provider>
  );
}
