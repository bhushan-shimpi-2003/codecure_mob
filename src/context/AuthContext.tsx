/** @jsxImportSource react */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Storage } from "../utils/storage";
import { authApi } from "../api/endpoints";
import { setLogoutListener } from "../api/client";
import { extractApiData, isApiSuccess } from "../api/response";
import { User } from "../types";
import { createRequestCache } from "../utils/requestCache";


interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const authRequestCache = createRequestCache();
const AUTH_ME_CACHE_KEY = "auth_me_cache";
const AUTH_ME_CACHE_TS_KEY = "auth_me_cache_ts";
const AUTH_ME_CACHE_TTL_MS = 5 * 60 * 1000;
const AUTH_ME_TIMEOUT_MS = 6000;

const normalizeUser = (raw: any): User => {
  const email = String(raw?.email || "");
  const fallbackNameFromEmail = email.includes("@") ? email.split("@")[0] : "Student";

  return {
    ...raw,
    id: String(raw?.id || raw?._id || ""),
    name: String(raw?.name || raw?.full_name || raw?.username || fallbackNameFromEmail),
  } as User;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<{ user: User | null; token: string | null }>({
    user: null,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) => {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("AUTH_ME_TIMEOUT")), timeoutMs)
      ),
    ]);
  };

  // ── Hydrate session from storage on app start ──────────────────────
  useEffect(() => {
    const clearAuthState = async () => {
      await Storage.deleteItem("auth_token");
      await Storage.deleteItem(AUTH_ME_CACHE_KEY);
      await Storage.deleteItem(AUTH_ME_CACHE_TS_KEY);
      setAuthState({ token: null, user: null });
    };

    const validateMe = async (storedToken: string, fallbackToCache: boolean) => {
      try {
        const res = await authRequestCache.getOrFetch(
          `auth:me:${storedToken}`,
          AUTH_ME_CACHE_TTL_MS,
          () => withTimeout(authApi.me(), AUTH_ME_TIMEOUT_MS)
        );
        const payload = res.data;
        if (isApiSuccess(payload)) {
          const me = extractApiData<User | null>(payload, null);
          if (me) {
            const normalizedUser = normalizeUser(me);
            setAuthState((prev) => ({ token: prev.token, user: normalizedUser }));
            await Storage.setItem(AUTH_ME_CACHE_KEY, JSON.stringify(normalizedUser));
            await Storage.setItem(AUTH_ME_CACHE_TS_KEY, String(Date.now()));
            return;
          }
        }

        if (!fallbackToCache) {
          await clearAuthState();
        }
      } catch {
        if (!fallbackToCache) {
          await clearAuthState();
        }
      }
    };

    const hydrate = async () => {
      try {
        const storedToken = await Storage.getItem("auth_token");
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        const [cachedUserRaw, cachedAtRaw] = await Promise.all([
          Storage.getItem(AUTH_ME_CACHE_KEY),
          Storage.getItem(AUTH_ME_CACHE_TS_KEY),
        ]);
        const cachedAt = Number(cachedAtRaw || 0);
        const cacheValid = Boolean(
          cachedUserRaw &&
          cachedAt &&
          Date.now() - cachedAt < AUTH_ME_CACHE_TTL_MS
        );

        if (cacheValid && cachedUserRaw) {
          const cachedUser = normalizeUser(JSON.parse(cachedUserRaw));
          setAuthState({ token: storedToken, user: cachedUser });
          setIsLoading(false);
          validateMe(storedToken, true);
          return;
        }

        setAuthState((prev) => ({ ...prev, token: storedToken }));
        await validateMe(storedToken, false);
      } catch {
        await clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();

    // Register the global 401 logout listener for the axios interceptor
    setLogoutListener(async () => {
      setAuthState({ token: null, user: null });
      authRequestCache.clearByPrefix("auth:me:");
      Storage.deleteItem("auth_token").catch(() => {});
      Storage.deleteItem(AUTH_ME_CACHE_KEY).catch(() => {});
      Storage.deleteItem(AUTH_ME_CACHE_TS_KEY).catch(() => {});
    });
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const login = async (newToken: string, userData: User) => {
    const normalizedUser = normalizeUser(userData);
    authRequestCache.clearByPrefix("auth:me:");
    await Storage.setItem("auth_token", newToken);
    await Storage.setItem(AUTH_ME_CACHE_KEY, JSON.stringify(normalizedUser));
    await Storage.setItem(AUTH_ME_CACHE_TS_KEY, String(Date.now()));
    setAuthState({ token: newToken, user: normalizedUser });
  };

  const logout = async () => {
    // Atomic state update ensures no race conditions during navigation transitions
    setAuthState({ token: null, user: null });
    authRequestCache.clearByPrefix("auth:me:");
    
    // Then clean up persistent storage (non-blocking)
    try {
      await Storage.deleteItem("auth_token");
      await Storage.deleteItem(AUTH_ME_CACHE_KEY);
      await Storage.deleteItem(AUTH_ME_CACHE_TS_KEY);
    } catch (e) {
      // Storage cleanup failed but UI already transitioned
    }
  };

  const updateUser = (userData: User) => {
    const normalizedUser = normalizeUser(userData);
    setAuthState(prev => ({ ...prev, user: normalizedUser }));
    Storage.setItem(AUTH_ME_CACHE_KEY, JSON.stringify(normalizedUser)).catch(() => {});
    Storage.setItem(AUTH_ME_CACHE_TS_KEY, String(Date.now())).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isAuthenticated: !!authState.token && !!authState.user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
